#!/usr/bin/env node
/**
 * memory-rotate.js — Stop hook
 *
 * Keeps the Claude Code auto-memory index (MEMORY.md) inside the harness's
 * auto-load window. When MEMORY.md grows past TRIGGER lines, the oldest entries
 * are MOVED (never deleted) into MEMORY-ARCHIVE.md until the hot index is back
 * under TARGET lines.
 *
 * Lossless: archived entries stay on disk, greppable, with their topic-file
 * links intact. Fail-safe: on any parse ambiguity or error the hook exits 0
 * and writes nothing, leaving MEMORY.md untouched.
 *
 * Project-agnostic: derives the memory dir from the hook's `cwd`
 * (/x/y -> -x-y slug under ~/.claude/projects/<slug>/memory/).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const TRIGGER = 150; // start rotating once the hot index exceeds this many lines
const TARGET = 120; // rotate down to at most this many lines

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  let cwd = process.cwd();
  try {
    const input = JSON.parse(readStdin() || '{}');
    if (input && typeof input.cwd === 'string' && input.cwd) cwd = input.cwd;
  } catch {
    /* no/!json stdin — fall back to process cwd */
  }

  const slug = cwd.replace(/\//g, '-');
  const memDir = path.join(os.homedir(), '.claude', 'projects', slug, 'memory');
  const hotPath = path.join(memDir, 'MEMORY.md');
  const archivePath = path.join(memDir, 'MEMORY-ARCHIVE.md');

  if (!fs.existsSync(hotPath)) return; // nothing to do for this project

  const hot = fs.readFileSync(hotPath, 'utf8');
  const lines = hot.split('\n');
  if (lines.length <= TRIGGER) return; // under the cap — leave it alone

  // ---- Split hot index into: header | entry-body | footer -----------------
  const firstEntry = lines.findIndex((l) => l.startsWith('- ['));
  if (firstEntry === -1) return; // unrecognised format — fail safe

  // Footer = a trailing `---` block that contains no entry bullets.
  let footerStart = lines.length;
  for (let i = lines.length - 1; i > firstEntry; i--) {
    if (lines[i].trim() === '---') {
      const tail = lines.slice(i);
      if (!tail.some((l) => l.startsWith('- ['))) footerStart = i;
      break;
    }
  }

  const header = lines.slice(0, firstEntry);
  const body = lines.slice(firstEntry, footerStart);
  const footer = lines.slice(footerStart);

  // ---- Parse body into entries (a `- [` line + any trailing blank lines) ---
  const entries = [];
  let cur = null;
  for (const line of body) {
    if (line.startsWith('- [')) {
      if (cur) entries.push(cur);
      cur = [line];
    } else if (cur) {
      cur.push(line);
    }
  }
  if (cur) entries.push(cur);
  if (entries.length <= 1) return; // nothing meaningful to rotate

  // ---- Decide how many oldest entries to move (entries are newest-first) ----
  const fixedLines = header.length + footer.length;
  let keep = entries.length;
  const entryLen = (e) => e.length; // already includes its trailing blank line(s)
  let total = fixedLines + entries.reduce((s, e) => s + entryLen(e), 0);
  while (keep > 1 && total > TARGET) {
    keep--;
    total -= entryLen(entries[keep]);
  }
  const moved = entries.slice(keep); // oldest entries, still newest-first among themselves
  if (moved.length === 0) return;

  // ---- Build the moved block (normalise: one blank line after each entry) ---
  const movedBlock = [];
  for (const e of moved) {
    const text = e.filter((l) => l.trim() !== ''); // drop internal blanks at edges
    movedBlock.push(...text, '');
  }

  // ---- Prepend moved entries into the archive (newest archive entries top) --
  let archive;
  if (fs.existsSync(archivePath)) {
    archive = fs.readFileSync(archivePath, 'utf8');
  } else {
    archive =
      '# CircleTel Project Memory — Archive\n\n' +
      '> Older entries rotated out of the auto-loaded `MEMORY.md` hot index.\n' +
      '> Nothing here is deleted — full detail preserved and greppable.\n\n---\n\n';
  }
  const aLines = archive.split('\n');
  let insertAt = aLines.findIndex((l) => l.trim() === '---');
  if (insertAt === -1) {
    // no separator — treat whole file as body, insert after a blank header line
    insertAt = aLines.findIndex((l) => l.trim() === '');
  }
  // insert right after the separator and its following blank line
  let ip = insertAt + 1;
  while (ip < aLines.length && aLines[ip].trim() === '') ip++;
  const newArchive = [
    ...aLines.slice(0, ip),
    ...movedBlock,
    ...aLines.slice(ip),
  ].join('\n');

  // ---- Rebuild the hot index ------------------------------------------------
  const keptBody = [];
  for (const e of entries.slice(0, keep)) {
    const text = e.filter((l) => l.trim() !== '');
    keptBody.push(...text, '');
  }
  const newHot = [...header, ...keptBody, ...footer].join('\n');

  // ---- Atomic-ish write (temp + rename), archive first so nothing is lost ---
  fs.writeFileSync(archivePath + '.tmp', newArchive);
  fs.renameSync(archivePath + '.tmp', archivePath);
  fs.writeFileSync(hotPath + '.tmp', newHot);
  fs.renameSync(hotPath + '.tmp', hotPath);

  process.stdout.write(
    JSON.stringify({
      systemMessage: `MEMORY.md auto-rotated: moved ${moved.length} oldest entr${
        moved.length === 1 ? 'y' : 'ies'
      } to MEMORY-ARCHIVE.md (hot index ${lines.length}→${newHot.split('\n').length} lines).`,
    })
  );
}

try {
  main();
} catch {
  // Fail safe: never break the Stop chain or corrupt memory on error.
  process.exit(0);
}
