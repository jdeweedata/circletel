/**
 * File System Tools for Agents
 *
 * Provides file reading, writing, and search capabilities for agents.
 * All operations are sandboxed to the project directory.
 *
 * @module lib/agents/tools/file-tools
 */

import { readFile, writeFile, access, mkdir, stat, readdir } from 'fs/promises';
import { constants } from 'fs';
import { dirname, join, relative, resolve, normalize, extname } from 'path';
import { ToolDefinition, ToolExecutor, ToolResult, ExecutionContext } from '../types';

// ============================================================================
// Types
// ============================================================================

interface ReadFileInput {
  path: string;
  encoding?: 'utf-8' | 'base64';
  startLine?: number;
  endLine?: number;
}

interface WriteFileInput {
  path: string;
  content: string;
  createDirectories?: boolean;
}

interface GlobInput {
  pattern: string;
  cwd?: string;
  ignore?: string[];
  maxResults?: number;
}

interface GrepInput {
  pattern: string;
  path?: string;
  glob?: string;
  caseSensitive?: boolean;
  maxResults?: number;
  context?: number;
}

interface FileInfo {
  path: string;
  exists: boolean;
  size?: number;
  isDirectory?: boolean;
  modifiedAt?: string;
}

interface GrepMatch {
  file: string;
  line: number;
  content: string;
  context?: {
    before: string[];
    after: string[];
  };
}

// ============================================================================
// Security Utilities
// ============================================================================

/**
 * Get the project root directory.
 */
function getProjectRoot(): string {
  return process.cwd();
}

/**
 * Validate that a path is within the project directory.
 *
 * @param inputPath - Path to validate
 * @returns Normalized absolute path
 * @throws Error if path escapes project directory
 */
function validatePath(inputPath: string): string {
  const projectRoot = getProjectRoot();
  const normalizedPath = normalize(inputPath);

  // Resolve to absolute path
  const absolutePath = resolve(projectRoot, normalizedPath);

  // Ensure path is within project root
  const relativePath = relative(projectRoot, absolutePath);

  if (relativePath.startsWith('..') || resolve(projectRoot, relativePath) !== absolutePath) {
    throw new Error(`Path "${inputPath}" escapes project directory`);
  }

  return absolutePath;
}

/**
 * Check if a path exists.
 *
 * @param filePath - Path to check
 * @returns Whether path exists
 */
async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Tool Definitions
// ============================================================================

export const fileToolDefinitions: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file. Supports text files and can read specific line ranges.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          name: 'path',
          type: 'string',
          description: 'Path to the file relative to project root',
          required: true,
        },
        encoding: {
          name: 'encoding',
          type: 'string',
          description: 'File encoding (utf-8 or base64)',
          required: false,
          default: 'utf-8',
          enum: ['utf-8', 'base64'],
        },
        startLine: {
          name: 'startLine',
          type: 'number',
          description: 'Starting line number (1-indexed)',
          required: false,
        },
        endLine: {
          name: 'endLine',
          type: 'number',
          description: 'Ending line number (1-indexed, inclusive)',
          required: false,
        },
      },
      required: ['path'],
    },
    categories: ['file:read'],
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates parent directories if needed.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          name: 'path',
          type: 'string',
          description: 'Path to the file relative to project root',
          required: true,
        },
        content: {
          name: 'content',
          type: 'string',
          description: 'Content to write to the file',
          required: true,
        },
        createDirectories: {
          name: 'createDirectories',
          type: 'boolean',
          description: 'Create parent directories if they don\'t exist',
          required: false,
          default: true,
        },
      },
      required: ['path', 'content'],
    },
    categories: ['file:write'],
    requiresApproval: true,
  },
  {
    name: 'glob_files',
    description: 'Find files matching a glob pattern. Returns file paths sorted by modification time.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          name: 'pattern',
          type: 'string',
          description: 'Glob pattern (e.g., "**/*.ts", "lib/**/*.tsx")',
          required: true,
        },
        cwd: {
          name: 'cwd',
          type: 'string',
          description: 'Working directory for glob (relative to project root)',
          required: false,
        },
        ignore: {
          name: 'ignore',
          type: 'array',
          description: 'Patterns to ignore (e.g., ["node_modules/**", "**/*.test.ts"])',
          required: false,
        },
        maxResults: {
          name: 'maxResults',
          type: 'number',
          description: 'Maximum number of results to return',
          required: false,
          default: 100,
        },
      },
      required: ['pattern'],
    },
    categories: ['file:read'],
  },
  {
    name: 'grep_search',
    description: 'Search for a pattern in files. Supports regex and context lines.',
    parameters: {
      type: 'object',
      properties: {
        pattern: {
          name: 'pattern',
          type: 'string',
          description: 'Search pattern (regex supported)',
          required: true,
        },
        path: {
          name: 'path',
          type: 'string',
          description: 'Specific file or directory to search in',
          required: false,
        },
        glob: {
          name: 'glob',
          type: 'string',
          description: 'Glob pattern to filter files (e.g., "**/*.ts")',
          required: false,
        },
        caseSensitive: {
          name: 'caseSensitive',
          type: 'boolean',
          description: 'Whether search is case-sensitive',
          required: false,
          default: false,
        },
        maxResults: {
          name: 'maxResults',
          type: 'number',
          description: 'Maximum number of matches to return',
          required: false,
          default: 50,
        },
        context: {
          name: 'context',
          type: 'number',
          description: 'Number of context lines before and after match',
          required: false,
          default: 0,
        },
      },
      required: ['pattern'],
    },
    categories: ['file:read'],
  },
  {
    name: 'file_info',
    description: 'Get information about a file (exists, size, type, modified time).',
    parameters: {
      type: 'object',
      properties: {
        path: {
          name: 'path',
          type: 'string',
          description: 'Path to the file relative to project root',
          required: true,
        },
      },
      required: ['path'],
    },
    categories: ['file:read'],
  },
];

// ============================================================================
// Tool Executors
// ============================================================================

/**
 * Read file executor.
 */
async function executeReadFile(
  input: ReadFileInput,
  _context: ExecutionContext
): Promise<ToolResult<{ content: string; lineCount: number }>> {
  const startTime = Date.now();

  try {
    const filePath = validatePath(input.path);

    // Check file exists
    if (!(await pathExists(filePath))) {
      return {
        success: false,
        error: `File not found: ${input.path}`,
        errorCode: 'FILE_NOT_FOUND',
        metadata: { executionTime: Date.now() - startTime, toolName: 'read_file' },
      };
    }

    // Read file
    const encoding = input.encoding === 'base64' ? 'base64' : 'utf-8';
    let content = await readFile(filePath, encoding);

    // Handle line range
    if (input.startLine !== undefined || input.endLine !== undefined) {
      const lines = content.split('\n');
      const start = Math.max(0, (input.startLine || 1) - 1);
      const end = input.endLine ? Math.min(lines.length, input.endLine) : lines.length;

      content = lines.slice(start, end).join('\n');
    }

    const lineCount = content.split('\n').length;

    return {
      success: true,
      data: { content, lineCount },
      metadata: { executionTime: Date.now() - startTime, toolName: 'read_file' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to read file',
      errorCode: 'READ_ERROR',
      metadata: { executionTime: Date.now() - startTime, toolName: 'read_file' },
    };
  }
}

/**
 * Write file executor.
 */
async function executeWriteFile(
  input: WriteFileInput,
  _context: ExecutionContext
): Promise<ToolResult<{ path: string; bytes: number }>> {
  const startTime = Date.now();

  try {
    const filePath = validatePath(input.path);

    // Create directories if needed
    if (input.createDirectories !== false) {
      const dir = dirname(filePath);
      await mkdir(dir, { recursive: true });
    }

    // Write file
    await writeFile(filePath, input.content, 'utf-8');

    const bytes = Buffer.byteLength(input.content, 'utf-8');

    return {
      success: true,
      data: { path: input.path, bytes },
      metadata: { executionTime: Date.now() - startTime, toolName: 'write_file' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to write file',
      errorCode: 'WRITE_ERROR',
      metadata: { executionTime: Date.now() - startTime, toolName: 'write_file' },
    };
  }
}

/**
 * Simple glob pattern matcher (supports * and ** wildcards).
 */
function matchesGlobPattern(filePath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '{{DOUBLE_STAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/{{DOUBLE_STAR}}/g, '.*')
    .replace(/\{([^}]+)\}/g, (_, group) => `(${group.split(',').join('|')})`);

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

/**
 * Check if a path should be ignored.
 */
function shouldIgnore(filePath: string, ignorePatterns: string[]): boolean {
  for (const pattern of ignorePatterns) {
    if (matchesGlobPattern(filePath, pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Recursively find files matching a pattern.
 */
async function findFiles(
  dir: string,
  pattern: string,
  ignore: string[],
  baseDir: string
): Promise<string[]> {
  const results: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(baseDir, fullPath);

      // Check ignore patterns
      if (shouldIgnore(relativePath, ignore) || shouldIgnore(entry.name, ignore)) {
        continue;
      }

      if (entry.isDirectory()) {
        // Recurse into directory
        const subResults = await findFiles(fullPath, pattern, ignore, baseDir);
        results.push(...subResults);
      } else if (entry.isFile()) {
        // Check if file matches pattern
        if (matchesGlobPattern(relativePath, pattern)) {
          results.push(relativePath);
        }
      }
    }
  } catch {
    // Ignore directories we can't read
  }

  return results;
}

/**
 * Glob files executor.
 */
async function executeGlob(
  input: GlobInput,
  _context: ExecutionContext
): Promise<ToolResult<{ files: string[]; count: number }>> {
  const startTime = Date.now();

  try {
    const projectRoot = getProjectRoot();
    const cwd = input.cwd ? validatePath(input.cwd) : projectRoot;

    // Default ignore patterns
    const ignore = [
      'node_modules',
      'node_modules/**',
      '.git',
      '.git/**',
      '.next',
      '.next/**',
      'dist',
      'dist/**',
      'coverage',
      'coverage/**',
      ...(input.ignore || []),
    ];

    // Find matching files
    let files = await findFiles(cwd, input.pattern, ignore, cwd);

    // Sort by modification time (newest first)
    const filesWithStats = await Promise.all(
      files.map(async f => {
        const fullPath = join(cwd, f);
        try {
          const stats = await stat(fullPath);
          return { path: f, mtime: stats.mtime };
        } catch {
          return { path: f, mtime: new Date(0) };
        }
      })
    );

    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
    files = filesWithStats.map(f => f.path);

    // Limit results
    const maxResults = input.maxResults || 100;
    const limitedFiles = files.slice(0, maxResults);

    return {
      success: true,
      data: { files: limitedFiles, count: files.length },
      metadata: { executionTime: Date.now() - startTime, toolName: 'glob_files' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to glob files',
      errorCode: 'GLOB_ERROR',
      metadata: { executionTime: Date.now() - startTime, toolName: 'glob_files' },
    };
  }
}

/**
 * Get extension filter from glob pattern.
 */
function getExtensionsFromGlob(pattern: string): string[] | null {
  // Match patterns like **/*.{ts,tsx,js,jsx} or **/*.ts
  const match = pattern.match(/\*\*?\/\*\.(\{[^}]+\}|[a-z]+)$/i);
  if (match) {
    const ext = match[1];
    if (ext.startsWith('{') && ext.endsWith('}')) {
      return ext.slice(1, -1).split(',').map(e => `.${e.trim()}`);
    }
    return [`.${ext}`];
  }
  return null;
}

/**
 * Grep search executor.
 */
async function executeGrep(
  input: GrepInput,
  _context: ExecutionContext
): Promise<ToolResult<{ matches: GrepMatch[]; totalMatches: number }>> {
  const startTime = Date.now();

  try {
    const projectRoot = getProjectRoot();
    const flags = input.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(input.pattern, flags);
    const matches: GrepMatch[] = [];
    const maxResults = input.maxResults || 50;

    // Default ignore patterns
    const defaultIgnore = [
      'node_modules',
      'node_modules/**',
      '.git',
      '.git/**',
      '.next',
      '.next/**',
      'dist',
      'dist/**',
    ];

    // Get files to search
    let filesToSearch: string[];

    if (input.path) {
      const validatedPath = validatePath(input.path);
      const stats = await stat(validatedPath);

      if (stats.isFile()) {
        filesToSearch = [validatedPath];
      } else {
        // Directory - find all text files
        const globPattern = input.glob || '**/*.{ts,tsx,js,jsx,json,md}';
        const files = await findFiles(validatedPath, globPattern, defaultIgnore, validatedPath);
        filesToSearch = files.map(f => join(validatedPath, f));
      }
    } else {
      // Search entire project
      const globPattern = input.glob || '**/*.{ts,tsx,js,jsx,json,md}';
      const files = await findFiles(projectRoot, globPattern, defaultIgnore, projectRoot);
      filesToSearch = files.map(f => join(projectRoot, f));
    }

    // Search files
    for (const filePath of filesToSearch) {
      if (matches.length >= maxResults) break;

      try {
        const content = await readFile(filePath, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (matches.length >= maxResults) break;

          const line = lines[i];
          // Reset regex lastIndex for global flag
          regex.lastIndex = 0;
          if (regex.test(line)) {
            const match: GrepMatch = {
              file: relative(projectRoot, filePath),
              line: i + 1,
              content: line.trim(),
            };

            // Add context if requested
            if (input.context && input.context > 0) {
              const contextLines = input.context;
              match.context = {
                before: lines.slice(Math.max(0, i - contextLines), i).map(l => l.trim()),
                after: lines.slice(i + 1, i + 1 + contextLines).map(l => l.trim()),
              };
            }

            matches.push(match);
          }
        }
      } catch {
        // Skip files that can't be read (binary, etc.)
        continue;
      }
    }

    return {
      success: true,
      data: { matches, totalMatches: matches.length },
      metadata: { executionTime: Date.now() - startTime, toolName: 'grep_search' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search',
      errorCode: 'GREP_ERROR',
      metadata: { executionTime: Date.now() - startTime, toolName: 'grep_search' },
    };
  }
}

/**
 * File info executor.
 */
async function executeFileInfo(
  input: { path: string },
  _context: ExecutionContext
): Promise<ToolResult<FileInfo>> {
  const startTime = Date.now();

  try {
    const filePath = validatePath(input.path);
    const exists = await pathExists(filePath);

    const info: FileInfo = {
      path: input.path,
      exists,
    };

    if (exists) {
      const stats = await stat(filePath);
      info.size = stats.size;
      info.isDirectory = stats.isDirectory();
      info.modifiedAt = stats.mtime.toISOString();
    }

    return {
      success: true,
      data: info,
      metadata: { executionTime: Date.now() - startTime, toolName: 'file_info' },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file info',
      errorCode: 'FILE_INFO_ERROR',
      metadata: { executionTime: Date.now() - startTime, toolName: 'file_info' },
    };
  }
}

// ============================================================================
// Executor Map
// ============================================================================

export const fileToolExecutors: Record<string, ToolExecutor> = {
  read_file: executeReadFile as ToolExecutor,
  write_file: executeWriteFile as ToolExecutor,
  glob_files: executeGlob as ToolExecutor,
  grep_search: executeGrep as ToolExecutor,
  file_info: executeFileInfo as ToolExecutor,
};
