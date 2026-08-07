#!/usr/bin/env python3
"""Regenerate the Skill Upgrade Gauntlet dashboard from persisted state.

Reads:  state/run_state.json, skills_resolved.json, analysis/cluster_*.json,
        contracts/*.json, benchmarks/*/coverage.json, runs/**/verdict.json
Writes: dashboard/index.html   (self-contained, no external requests)

Safe to run at any point in the run; renders whatever exists.
"""
import json, os, html, glob, datetime, collections

G = os.path.dirname(os.path.abspath(__file__))


def load(p, default=None):
    try:
        with open(os.path.join(G, p), encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default if default is not None else None


def collect():
    state = load("state/run_state.json", {})
    resolved = load("skills_resolved.json", [])

    # merge cluster analyses keyed by slug
    analysis = {}
    for p in sorted(glob.glob(os.path.join(G, "analysis", "cluster_*.json"))):
        try:
            for row in json.load(open(p, encoding="utf-8")):
                if isinstance(row, dict) and row.get("slug"):
                    analysis[row["slug"]] = row
        except Exception:
            pass

    skills = []
    for s in resolved:
        a = analysis.get(s["slug"], {})
        skills.append({
            "slug": s["slug"],
            "scope": s["scope"],
            "dir": s["dir"],
            "editable": bool(s.get("writable")),
            "desc": s.get("description", ""),
            "lines": s.get("skill_md_lines", 0),
            "files": s.get("n_files", 0),
            "scripts": s.get("n_scripts", 0),
            "kb": round(s.get("total_bytes", 0) / 1024),
            "shadows": s.get("shadows", []),
            "deps_raw": s.get("deps", {}),
            "purpose": a.get("purpose", ""),
            "does": a.get("does", []),
            "output_type": a.get("output_type", ""),
            "trigger": a.get("trigger_summary", ""),
            "provenance": a.get("provenance_signals", ""),
            "knowledge_type": a.get("knowledge_type", ""),
            "external_deps": a.get("external_deps", ""),
            "overlap_with": a.get("overlap_with", []),
            "risk_notes": a.get("risk_notes", ""),
            "analyzed": bool(a),
        })

    # per-skill gauntlet artifacts
    gaunt = {}
    for s in skills:
        slug = s["slug"]
        rec = {"contract": load(f"contracts/{slug}.json"),
               "coverage": load(f"benchmarks/{slug}/coverage.json"),
               "trials": [], "iterations": load(f"state/iterations_{slug}.json", [])}
        for vp in sorted(glob.glob(os.path.join(G, "runs", slug, "*", "verdict.json"))):
            v = load(os.path.relpath(vp, G))
            if v:
                rec["trials"].append(v)
        if any([rec["contract"], rec["coverage"], rec["trials"], rec["iterations"]]):
            gaunt[slug] = rec
    return state, skills, gaunt


CSS = r"""
:root{
  --ground:#F3F6F6; --surface:#FFFFFF; --surface-2:#EAEFEF; --line:#D8E1E1;
  --ink:#0F1618; --ink-2:#3A4A4E; --muted:#63767B;
  --accent:#0B6E75; --accent-soft:#DCEDED; --accent-ink:#075258;
  --red:#A82F26; --red-soft:#F6E1DF; --amber:#8A5F0B; --amber-soft:#F8ECD6;
  --green:#256D49; --green-soft:#DCEDE2; --slate:#4A5C61; --slate-soft:#E4EAEA;
  --shadow:0 1px 2px rgba(15,22,24,.06),0 8px 24px -12px rgba(15,22,24,.18);
  --mono:ui-monospace,"SF Mono","Cascadia Mono","Roboto Mono",Menlo,Consolas,monospace;
  --sans:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --ground:#0B1113; --surface:#131B1E; --surface-2:#1A2429; --line:#253337;
  --ink:#E2EAEB; --ink-2:#B3C4C7; --muted:#8199A0;
  --accent:#46B3B9; --accent-soft:#12312F; --accent-ink:#7FD3D7;
  --red:#E58379; --red-soft:#341C1A; --amber:#D9A648; --amber-soft:#31260F;
  --green:#63BC8D; --green-soft:#12291E; --slate:#9BB0B5; --slate-soft:#1C262A;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7);
}}
:root[data-theme="dark"]{
  --ground:#0B1113; --surface:#131B1E; --surface-2:#1A2429; --line:#253337;
  --ink:#E2EAEB; --ink-2:#B3C4C7; --muted:#8199A0;
  --accent:#46B3B9; --accent-soft:#12312F; --accent-ink:#7FD3D7;
  --red:#E58379; --red-soft:#341C1A; --amber:#D9A648; --amber-soft:#31260F;
  --green:#63BC8D; --green-soft:#12291E; --slate:#9BB0B5; --slate-soft:#1C262A;
  --shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7);
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--sans);
  font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1320px;margin:0 auto;padding:0 20px 80px}

/* ---- masthead ---- */
header.mast{border-bottom:1px solid var(--line);background:var(--surface);
  position:sticky;top:0;z-index:40;box-shadow:var(--shadow)}
.mast-in{max-width:1320px;margin:0 auto;padding:14px 20px;display:flex;
  align-items:baseline;gap:18px;flex-wrap:wrap}
.brandmark{font-family:var(--mono);font-size:11px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--accent);font-weight:600}
h1{font-size:19px;letter-spacing:-.02em;margin:0;font-weight:650;text-wrap:balance}
.mast-meta{margin-left:auto;display:flex;gap:14px;align-items:center;flex-wrap:wrap;
  font-family:var(--mono);font-size:11px;color:var(--muted)}
.mast-meta b{color:var(--ink-2);font-weight:600}

/* ---- generic ---- */
section{margin-top:34px}
h2{font-size:12px;font-family:var(--mono);letter-spacing:.14em;text-transform:uppercase;
  color:var(--muted);margin:0 0 12px;font-weight:600;display:flex;align-items:center;gap:10px}
h2::after{content:"";flex:1;height:1px;background:var(--line)}
.sub{color:var(--muted);font-size:13px;margin:-4px 0 16px;max-width:76ch}

/* ---- tiles ---- */
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.tile{background:var(--surface);border:1px solid var(--line);border-radius:6px;
  padding:14px 15px;position:relative;overflow:hidden}
.tile .n{font-family:var(--mono);font-size:26px;font-weight:600;letter-spacing:-.03em;
  font-variant-numeric:tabular-nums;line-height:1.1}
.tile .l{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;
  font-family:var(--mono);margin-top:5px}
.tile .h{font-size:12px;color:var(--ink-2);margin-top:7px;line-height:1.4}
.tile.stripe::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--accent)}
.tile.red::before{background:var(--red)} .tile.amber::before{background:var(--amber)}
.tile.green::before{background:var(--green)}

/* ---- callout ---- */
.callout{border:1px solid var(--line);border-left:3px solid var(--amber);
  background:var(--surface);border-radius:6px;padding:16px 18px;margin-bottom:16px}
.callout.red{border-left-color:var(--red)}
.callout h3{margin:0 0 6px;font-size:14px;font-weight:650;display:flex;gap:9px;align-items:center}
.callout p{margin:6px 0;color:var(--ink-2);font-size:13px}
.callout .tag{font-family:var(--mono);font-size:10px;letter-spacing:.1em;padding:2px 7px;
  border-radius:3px;background:var(--amber-soft);color:var(--amber);text-transform:uppercase}
.callout.red .tag{background:var(--red-soft);color:var(--red)}

/* ---- chips ---- */
.chip{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-size:10.5px;
  letter-spacing:.05em;padding:2px 7px;border-radius:3px;background:var(--slate-soft);
  color:var(--slate);white-space:nowrap;text-transform:uppercase;font-weight:600}
.chip.accent{background:var(--accent-soft);color:var(--accent-ink)}
.chip.red{background:var(--red-soft);color:var(--red)}
.chip.amber{background:var(--amber-soft);color:var(--amber)}
.chip.green{background:var(--green-soft);color:var(--green)}
.chip.ghost{background:transparent;color:var(--muted);border:1px solid var(--line)}
.dot{width:6px;height:6px;border-radius:50%;background:currentColor;flex:none}

/* ---- controls ---- */
.controls{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}
.controls input[type=search]{font-family:var(--mono);font-size:12px;padding:7px 11px;
  border:1px solid var(--line);border-radius:5px;background:var(--surface);color:var(--ink);
  min-width:230px}
.controls input:focus-visible,.fbtn:focus-visible,.row:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.fbtn{font-family:var(--mono);font-size:11px;padding:6px 10px;border:1px solid var(--line);
  border-radius:5px;background:var(--surface);color:var(--muted);cursor:pointer;
  text-transform:uppercase;letter-spacing:.06em;font-weight:600}
.fbtn[aria-pressed=true]{background:var(--accent);border-color:var(--accent);color:#fff}
:root[data-theme="dark"] .fbtn[aria-pressed=true],
@media(prefers-color-scheme:dark){:root:not([data-theme=light]) .fbtn[aria-pressed=true]{color:#08191A}}

/* ---- table ---- */
.tablewrap{border:1px solid var(--line);border-radius:6px;overflow:hidden;background:var(--surface)}
table{width:100%;border-collapse:collapse}
thead th{position:sticky;top:53px;background:var(--surface-2);z-index:20;font-family:var(--mono);
  font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);
  text-align:left;padding:9px 12px;border-bottom:1px solid var(--line);font-weight:600;white-space:nowrap}
tbody tr.row{border-bottom:1px solid var(--line);cursor:pointer}
tbody tr.row:last-child{border-bottom:0}
tbody tr.row:hover{background:var(--surface-2)}
tbody td{padding:9px 12px;vertical-align:middle;font-size:13px}
td.nm{font-family:var(--mono);font-weight:600;font-size:12.5px;letter-spacing:-.01em}
td.num{font-family:var(--mono);font-variant-numeric:tabular-nums;color:var(--muted);
  font-size:12px;text-align:right;white-space:nowrap}
.stripecell{width:3px;padding:0!important}
.stripecell i{display:block;width:3px;height:100%;min-height:34px;background:var(--slate)}
.stripecell i.red{background:var(--red)} .stripecell i.amber{background:var(--amber)}
.stripecell i.green{background:var(--green)} .stripecell i.accent{background:var(--accent)}
.caret{display:inline-block;width:9px;color:var(--muted);font-family:var(--mono);font-size:10px}
.pcell{color:var(--ink-2);font-size:12.5px;max-width:430px}

/* knowledge bar */
.kbar{display:flex;height:5px;border-radius:3px;overflow:hidden;background:var(--line);min-width:64px}
.kbar span{display:block;height:100%}
.k-dur{background:var(--accent)} .k-gen{background:var(--red)}
.k-wf{background:var(--slate)} .k-mix{background:var(--amber)}

/* ---- detail drawer ---- */
tr.detail>td{padding:0;background:var(--surface-2);border-bottom:1px solid var(--line)}
.dbody{padding:18px 20px 22px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.dblock h4{margin:0 0 7px;font-family:var(--mono);font-size:10px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--muted);font-weight:600}
.dblock p,.dblock li{font-size:12.5px;color:var(--ink-2);margin:0 0 5px;line-height:1.5}
.dblock ul{margin:0;padding-left:16px}
.dblock code,.mono{font-family:var(--mono);font-size:11.5px;background:var(--surface);
  border:1px solid var(--line);border-radius:3px;padding:1px 5px;color:var(--ink-2)}
.dfull{grid-column:1/-1}
.kv{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;font-size:12px}
.kv dt{font-family:var(--mono);color:var(--muted);font-size:11px;white-space:nowrap}
.kv dd{margin:0;color:var(--ink-2);word-break:break-word}
.ovl{display:flex;flex-wrap:wrap;gap:5px}

/* gauntlet panel */
.gpanel{grid-column:1/-1;border-top:1px dashed var(--line);padding-top:16px;margin-top:4px}
.gempty{font-size:12.5px;color:var(--muted);font-style:italic}
.trials{width:100%;border-collapse:collapse;margin-top:8px;font-size:12px}
.trials th{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;
  color:var(--muted);text-align:left;padding:5px 8px;border-bottom:1px solid var(--line)}
.trials td{padding:5px 8px;border-bottom:1px solid var(--line);color:var(--ink-2)}
.trials td.m{font-family:var(--mono);font-size:11px}
.sealed{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:11px;
  color:var(--muted);border:1px dashed var(--line);border-radius:4px;padding:5px 9px}

/* findings */
.findings{border:1px solid var(--line);border-radius:6px;overflow:hidden;background:var(--surface)}
details.finding{border-bottom:1px solid var(--line)}
details.finding:last-child{border-bottom:0}
details.finding>summary{list-style:none;cursor:pointer;padding:10px 14px;display:flex;
  align-items:center;gap:11px;flex-wrap:wrap}
details.finding>summary::-webkit-details-marker{display:none}
details.finding>summary:hover{background:var(--surface-2)}
details.finding[open]>summary{background:var(--surface-2)}
.fid{color:var(--muted);font-size:11px}
.ftitle{font-size:13.5px;font-weight:600;flex:1;min-width:220px}
.fbody{padding:2px 14px 15px 14px}
.fbody p{margin:0 0 10px;color:var(--ink-2);font-size:12.5px;max-width:100ch;line-height:1.6}

footer{margin-top:44px;padding-top:16px;border-top:1px solid var(--line);color:var(--muted);
  font-size:11.5px;font-family:var(--mono);line-height:1.7}
.hide{display:none!important}
@media (max-width:820px){
  .colhide{display:none}
  .mast-meta{width:100%;margin-left:0}
  thead th{top:0}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
"""


def kbar(ktype):
    """Render the knowledge-type split as a stacked bar."""
    t = (ktype or "").lower()
    import re as _re
    segs = []
    for key, cls in (("durable", "k-dur"), ("generic", "k-gen"),
                     ("workflow", "k-wf"), ("mixed", "k-mix")):
        m = _re.search(key + r"[^0-9%]{0,40}?(\d{1,3})\s*%", t)
        if not m:
            m = _re.search(r"(\d{1,3})\s*%[^0-9%]{0,25}?" + key, t)
        if m:
            segs.append((cls, min(100, int(m.group(1)))))
    if not segs:
        for key, cls in (("durable", "k-dur"), ("generic", "k-gen"),
                         ("workflow", "k-wf"), ("mixed", "k-mix")):
            if key in t:
                segs = [(cls, 100)]
                break
    if not segs:
        return '<span class="mono" style="color:var(--muted);font-size:11px">—</span>'
    tot = sum(v for _, v in segs) or 1
    inner = "".join(f'<span class="{c}" style="width:{v/tot*100:.0f}%"></span>' for c, v in segs)
    return f'<div class="kbar" title="{html.escape(ktype)}">{inner}</div>'


def esc(x):
    return html.escape(str(x if x is not None else ""))


def render_overlaps(ov):
    if not ov:
        return '<p style="color:var(--muted)">None detected.</p>'
    out = []
    for o in ov:
        if isinstance(o, dict):
            slug = o.get("slug") or o.get("skill") or ""
            why = o.get("reason") or o.get("why") or ""
        else:
            s = str(o)
            slug, _, why = s.partition(":")
        out.append(f'<li><code>{esc(slug.strip())}</code> — {esc(why.strip())}</li>')
    return "<ul>" + "".join(out) + "</ul>"


def render_gauntlet(slug, g):
    if not g:
        return ('<div class="gpanel"><h4 style="font-family:var(--mono);font-size:10px;'
                'letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:0 0 7px">'
                'Gauntlet</h4><p class="gempty">Not selected for upgrade. No contract, '
                'benchmark, or trials exist for this skill.</p></div>')
    p = ['<div class="gpanel"><h4 style="font-family:var(--mono);font-size:10px;letter-spacing:.12em;'
         'text-transform:uppercase;color:var(--muted);margin:0 0 9px">Gauntlet</h4>']
    c = g.get("contract")
    if c:
        frozen = c.get("frozen")
        p.append(f'<div style="margin-bottom:12px"><span class="chip {"green" if frozen else "amber"}">'
                 f'<i class="dot"></i>Contract {"frozen" if frozen else "draft"}</span> '
                 f'<span class="mono">{esc(c.get("hash",""))[:12]}</span>')
        for k in ("success_looks_like", "priority_qualities", "constraints", "never_do", "scope_in", "scope_out"):
            v = c.get(k)
            if not v:
                continue
            items = v if isinstance(v, list) else [v]
            p.append(f'<div style="margin-top:8px"><span class="mono" style="color:var(--muted);'
                     f'font-size:10px;letter-spacing:.1em;text-transform:uppercase">{esc(k.replace("_"," "))}</span>'
                     "<ul>" + "".join(f"<li>{esc(i)}</li>" for i in items) + "</ul></div>")
        p.append("</div>")
    cov = g.get("coverage")
    if cov:
        p.append(f'<div style="margin-bottom:12px"><span class="chip accent">Benchmark</span> '
                 f'<span class="mono">{cov.get("n_iteration","?")} iteration · '
                 f'{cov.get("n_heldout","?")} held-out (sealed)</span>')
        dims = cov.get("dimensions") or []
        if dims:
            p.append('<div class="ovl" style="margin-top:7px">' +
                     "".join(f'<span class="chip ghost">{esc(d)}</span>' for d in dims) + "</div>")
        p.append('<div style="margin-top:8px"><span class="sealed">&#128274; Held-out task text '
                 'withheld until final evaluation</span></div></div>')
    tr = g.get("trials") or []
    if tr:
        rows = "".join(
            f'<tr><td class="m">{esc(t.get("trial_id",""))}</td>'
            f'<td class="m">{esc(t.get("task_id",""))}</td>'
            f'<td class="m">{esc(t.get("model_id",""))}</td>'
            f'<td>{esc(t.get("condition",""))}</td>'
            f'<td><span class="chip {"green" if t.get("winner") else "ghost"}">{esc(t.get("winner","—"))}</span></td>'
            f'<td class="m">{esc(t.get("confidence",""))}</td>'
            f'<td>{esc(t.get("why",""))[:200]}</td></tr>' for t in tr)
        p.append('<table class="trials"><thead><tr><th>Trial</th><th>Task</th><th>Model</th>'
                 '<th>Condition</th><th>Verdict</th><th>Conf</th><th>Judge reasoning</th></tr>'
                 f'<tbody>{rows}</tbody></table>')
    else:
        p.append('<p class="gempty">No trials run yet.</p>')
    p.append("</div>")
    return "".join(p)


def build():
    state, skills, gaunt = collect()
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    models = (state.get("models_verified") or {})
    avail = models.get("available", {})
    unavail = models.get("unavailable", {})
    blockers = state.get("blockers", [])
    selected = set(state.get("selected_skills") or [])

    n_total = len(skills)
    n_edit = sum(1 for s in skills if s["editable"])
    n_ro = n_total - n_edit
    n_over = sum(1 for s in skills if s["overlap_with"])
    n_risk = sum(1 for s in skills if s["risk_notes"])
    scopes = sorted({s["scope"] for s in skills})

    def status_of(s):
        if s["slug"] in gaunt:
            g = gaunt[s["slug"]]
            if g.get("trials"):
                return "amber", "in trials"
            if g.get("contract"):
                return "accent", "contract"
            return "accent", "selected"
        if s["slug"] in selected:
            return "accent", "selected"
        return "slate", "inventory"

    rows = []
    for i, s in enumerate(skills):
        st, stlabel = status_of(s)
        ov_n = len(s["overlap_with"])
        risk = bool(s["risk_notes"])
        rows.append(f"""
<tr class="row" data-i="{i}" data-scope="{esc(s['scope'])}" data-edit="{'1' if s['editable'] else '0'}"
    data-risk="{'1' if risk else '0'}" data-ovl="{'1' if ov_n else '0'}" tabindex="0"
    data-search="{esc((s['slug']+' '+s['purpose']+' '+s['desc']+' '+s['scope']).lower())}">
  <td class="stripecell"><i class="{st}"></i></td>
  <td class="nm"><span class="caret">&#9656;</span> {esc(s['slug'])}</td>
  <td><span class="chip {'ghost' if s['editable'] else 'red'}">{esc(s['scope'])}</span></td>
  <td class="colhide"><span class="chip {'green' if s['editable'] else 'red'}">{'editable' if s['editable'] else 'read-only'}</span></td>
  <td class="pcell">{esc(s['purpose'] or s['desc'][:150])}</td>
  <td class="colhide">{kbar(s['knowledge_type'])}</td>
  <td class="num colhide">{s['lines']}L</td>
  <td class="num colhide">{s['files']}f</td>
  <td class="num colhide">{s['kb']}K</td>
  <td>{'<span class="chip amber">'+str(ov_n)+'</span>' if ov_n else '<span class="chip ghost">0</span>'}</td>
  <td>{'<span class="chip red"><i class="dot"></i></span>' if risk else ''}</td>
  <td><span class="chip {st if st!='slate' else 'ghost'}">{esc(stlabel)}</span></td>
</tr>
<tr class="detail hide" data-for="{i}"><td colspan="12"><div class="dbody">
  <div class="dblock">
    <h4>What it does</h4>
    <p>{esc(s['purpose'])}</p>
    {'<ul>'+''.join('<li>'+esc(d)+'</li>' for d in (s['does'] or []))+'</ul>' if s['does'] else ''}
    <dl class="kv" style="margin-top:9px">
      <dt>output</dt><dd>{esc(s['output_type']) or '—'}</dd>
      <dt>triggers</dt><dd>{esc(s['trigger'])[:400] or esc(s['desc'])[:400]}</dd>
    </dl>
  </div>
  <div class="dblock">
    <h4>Origin &amp; editability</h4>
    <dl class="kv">
      <dt>scope</dt><dd>{esc(s['scope'])}</dd>
      <dt>path</dt><dd><code>{esc(s['dir'])}</code></dd>
      <dt>editable</dt><dd>{'Yes — user-owned, safe to upgrade' if s['editable'] else 'No — vendored/read-only; upgrade would need a user-scope override copy'}</dd>
      <dt>size</dt><dd>{s['lines']} lines · {s['files']} files · {s['scripts']} scripts · {s['kb']} KB</dd>
    </dl>
    {'<p style="margin-top:8px"><span class="chip amber">shadows</span> '+', '.join('<code>'+esc(x['scope'])+'</code>' for x in s['shadows'])+'</p>' if s['shadows'] else ''}
    <p style="margin-top:8px">{esc(s['provenance'])[:700]}</p>
  </div>
  <div class="dblock">
    <h4>Knowledge composition</h4>
    {kbar(s['knowledge_type'])}
    <p style="margin-top:7px">{esc(s['knowledge_type'])}</p>
    <h4 style="margin-top:12px">Dependencies</h4>
    <p>{esc(s['external_deps'] if isinstance(s['external_deps'],str) else json.dumps(s['external_deps']))[:700] or '—'}</p>
  </div>
  <div class="dblock">
    <h4>Overlaps ({ov_n})</h4>
    {render_overlaps(s['overlap_with'])}
    {'<h4 style="margin-top:12px">Risks</h4><p>'+esc(s['risk_notes'] if isinstance(s['risk_notes'],str) else json.dumps(s['risk_notes']))[:900]+'</p>' if s['risk_notes'] else ''}
  </div>
  {render_gauntlet(s['slug'], gaunt.get(s['slug']))}
</div></td></tr>""")

    blocker_html = ""
    for b in blockers:
        if b.get("status") != "open":
            continue
        blocker_html += f"""
<div class="callout red">
  <h3><span class="tag">Blocker · {esc(b.get('id',''))}</span> {esc(b.get('title',''))}</h3>
  <p>{esc(b.get('detail',''))}</p>
</div>"""

    # cross-cutting findings
    findings = load("analysis/findings.json", []) or []
    SEV = {"critical": "red", "high": "amber", "medium": "slate", "low": "ghost"}
    fh = []
    for f in findings:
        sev = f.get("severity", "low")
        aff = "".join(f'<span class="chip ghost">{esc(a)}</span>' for a in f.get("affects", []))
        fh.append(f"""
<details class="finding">
  <summary><span class="chip {SEV.get(sev,'ghost')}"><i class="dot"></i>{esc(sev)}</span>
    <span class="mono fid">{esc(f.get('id',''))}</span>
    <span class="ftitle">{esc(f.get('title',''))}</span></summary>
  <div class="fbody"><p>{esc(f.get('detail',''))}</p>
    <div class="ovl">{aff}</div></div>
</details>""")
    findings_html = "".join(fh)
    n_crit = sum(1 for f in findings if f.get("severity") == "critical")

    model_rows = "".join(
        f'<tr><td class="m">{esc(k)}</td><td class="m" style="color:var(--green)">{esc(v)}</td>'
        f'<td><span class="chip green"><i class="dot"></i>verified live</span></td></tr>'
        for k, v in avail.items())
    model_rows += "".join(
        f'<tr><td class="m">{esc(k)}</td><td class="m" style="color:var(--red)">unreachable</td>'
        f'<td><span class="chip red"><i class="dot"></i>not tested</span></td></tr>'
        for k in unavail)

    scope_btns = "".join(
        f'<button class="fbtn" data-f="scope" data-v="{esc(sc)}" aria-pressed="false">{esc(sc)}</button>'
        for sc in scopes)

    doc = f"""<title>Skill Upgrade Gauntlet — Inventory &amp; Run Console</title>
<style>{CSS}</style>
<header class="mast"><div class="mast-in">
  <span class="brandmark">Gauntlet</span>
  <h1>Skill Upgrade Gauntlet</h1>
  <div class="mast-meta">
    <span>phase <b>{esc(state.get('phase','—'))}</b></span>
    <span>skills <b>{n_total}</b></span>
    <span>selected <b>{len(selected)}</b></span>
    <span>built <b>{now}</b></span>
  </div>
</div></header>
<div class="wrap">

<section>
  <h2>Run status</h2>
  <p class="sub">Read-only console. Skill selection and run start happen in Claude Code, not here.</p>
  {blocker_html}
  <div class="tiles">
    <div class="tile stripe"><div class="n">{n_total}</div><div class="l">active skills</div>
      <div class="h">Unique, after resolving shadowed duplicates</div></div>
    <div class="tile stripe green"><div class="n">{n_edit}</div><div class="l">editable</div>
      <div class="h">User- or project-scope; safe to upgrade in place</div></div>
    <div class="tile stripe red"><div class="n">{n_ro}</div><div class="l">read-only</div>
      <div class="h">Vendored / built-in; need an override copy to change</div></div>
    <div class="tile stripe amber"><div class="n">{n_over}</div><div class="l">with overlaps</div>
      <div class="h">Job substantially duplicated by another skill</div></div>
    <div class="tile stripe red"><div class="n">{n_risk}</div><div class="l">with defects</div>
      <div class="h">Broken paths, missing deps, or stale content</div></div>
    <div class="tile stripe"><div class="n">1519</div><div class="l">files preserved</div>
      <div class="h">Immutable originals, SHA-256 manifested</div></div>
  </div>
</section>

<section>
  <h2>Cross-cutting findings <span class="chip red" style="text-transform:none">{n_crit} critical</span></h2>
  <p class="sub">Defects that span more than one skill. These are inventory observations, not
     gauntlet results — nothing here has been changed. Click to expand.</p>
  <div class="findings">{findings_html}</div>
</section>

<section>
  <h2>Model roster</h2>
  <p class="sub">Every model below was probed live by a fresh agent reporting its own identifier.
     Nothing is assumed and nothing unavailable is substituted silently.</p>
  <div class="tablewrap"><table class="trials" style="margin:0">
    <thead><tr><th>Alias requested</th><th>Actual model id</th><th>Status</th></tr></thead>
    <tbody>{model_rows}</tbody>
  </table></div>
</section>

<section>
  <h2>Skill inventory</h2>
  <p class="sub">Click any row for its full dossier: purpose, origin, editability, knowledge
     composition, dependencies, overlaps, defects, and gauntlet state.
     The bar under <em>knowledge</em> splits each skill into
     <span class="mono" style="color:var(--accent)">durable external knowledge</span> /
     <span class="mono" style="color:var(--red)">generic reasoning</span> /
     <span class="mono" style="color:var(--slate)">workflow</span> /
     <span class="mono" style="color:var(--amber)">mixed</span> — the red share is what
     Opus 5 arguably already knows.</p>
  <div class="controls">
    <input type="search" id="q" placeholder="filter skills…" aria-label="Filter skills">
    {scope_btns}
    <button class="fbtn" data-f="edit" data-v="1" aria-pressed="false">editable only</button>
    <button class="fbtn" data-f="ovl" data-v="1" aria-pressed="false">has overlap</button>
    <button class="fbtn" data-f="risk" data-v="1" aria-pressed="false">has defect</button>
    <button class="fbtn" id="clear">reset</button>
    <span class="mono" style="color:var(--muted);font-size:11px" id="count"></span>
  </div>
  <div class="tablewrap"><table>
    <thead><tr>
      <th class="stripecell"></th><th>Skill</th><th>Scope</th><th class="colhide">Edit</th>
      <th>Purpose</th><th class="colhide">Knowledge</th><th class="colhide">Lines</th>
      <th class="colhide">Files</th><th class="colhide">Size</th><th>Ovl</th><th></th><th>State</th>
    </tr></thead>
    <tbody id="tb">{''.join(rows)}</tbody>
  </table></div>
</section>

<footer>
  Originals preserved read-only at <code>.claude/gauntlet/originals/</code> ·
  SHA-256 manifest at <code>originals_manifest.json</code> ·
  state at <code>.claude/gauntlet/state/run_state.json</code><br>
  Held-out benchmark tasks are sealed and never rendered here before final evaluation.
</footer>
</div>
<script>
const rowsEl=[...document.querySelectorAll('tr.row')];
const F={{scope:null,edit:null,ovl:null,risk:null,q:''}};
function apply(){{
  let n=0;
  rowsEl.forEach(r=>{{
    let ok=true;
    if(F.scope&&r.dataset.scope!==F.scope)ok=false;
    if(F.edit&&r.dataset.edit!=='1')ok=false;
    if(F.ovl&&r.dataset.ovl!=='1')ok=false;
    if(F.risk&&r.dataset.risk!=='1')ok=false;
    if(F.q&&!r.dataset.search.includes(F.q))ok=false;
    r.classList.toggle('hide',!ok);
    const d=document.querySelector('tr.detail[data-for="'+r.dataset.i+'"]');
    if(!ok&&d)d.classList.add('hide');
    if(ok)n++;
  }});
  document.getElementById('count').textContent=n+' / '+rowsEl.length+' shown';
}}
function toggle(r){{
  const d=document.querySelector('tr.detail[data-for="'+r.dataset.i+'"]');
  if(!d)return;
  const open=!d.classList.contains('hide');
  d.classList.toggle('hide',open);
  r.querySelector('.caret').innerHTML=open?'&#9656;':'&#9662;';
}}
rowsEl.forEach(r=>{{
  r.addEventListener('click',()=>toggle(r));
  r.addEventListener('keydown',e=>{{if(e.key==='Enter'||e.key===' '){{e.preventDefault();toggle(r);}}}});
}});
document.querySelectorAll('.fbtn[data-f]').forEach(b=>{{
  b.addEventListener('click',()=>{{
    const f=b.dataset.f,v=b.dataset.v;
    if(F[f]===v){{F[f]=null;b.setAttribute('aria-pressed','false');}}
    else{{
      document.querySelectorAll('.fbtn[data-f="'+f+'"]').forEach(o=>o.setAttribute('aria-pressed','false'));
      F[f]=v;b.setAttribute('aria-pressed','true');
    }}
    apply();
  }});
}});
document.getElementById('q').addEventListener('input',e=>{{F.q=e.target.value.toLowerCase().trim();apply();}});
document.getElementById('clear').addEventListener('click',()=>{{
  F.scope=F.edit=F.ovl=F.risk=null;F.q='';document.getElementById('q').value='';
  document.querySelectorAll('.fbtn[data-f]').forEach(o=>o.setAttribute('aria-pressed','false'));
  apply();
}});
apply();
</script>"""

    out = os.path.join(G, "dashboard", "index.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(doc)
    print(f"wrote {out}  ({len(doc)/1024:.0f} KB)  skills={n_total} analyzed={sum(1 for s in skills if s['analyzed'])}")


if __name__ == "__main__":
    build()
