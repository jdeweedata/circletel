# Compliance Check Definitions

Each check has an ID, the rule it enforces, the exact bash command to run, and what counts as a violation.
Run every command from the project root. Flag any stdout output as a violation.
Skip any check whose ID appears in `accepted-debt.md`.

---

## C1 — Hardcoded contact strings
**Rule:** `contact-details.md`
**Command:**
```bash
git diff HEAD~5 -- '*.tsx' '*.ts' | grep -E "^\+" | grep -E "(wa\.me|082 487|contactus@circletel)" | grep -v "contact\.ts" | grep -v "^+++"
```
**Violation:** Any output line = hardcoded contact value outside constants file
**Severity:** ❌

---

## C2 — TODO / placeholder code committed
**Rule:** `anti-patterns.md`
**Command:**
```bash
git diff HEAD~5 -- '*.tsx' '*.ts' | grep -E "^\+.*\b(TODO|FIXME|placeholder|stub function|// temp)\b" | grep -v "^+++"
```
**Violation:** Any output line = placeholder committed
**Severity:** ❌

---

## C3 — createClient() used where getUser() is called
**Rule:** `auth-patterns.md`
**Command:**
```bash
git diff HEAD~5 -- 'app/api/**' | grep -E "^\+" | grep "getUser()" | grep -v "^+++"
```
Then for each changed file containing `getUser()`:
```bash
grep -n "createClient()" <file> | grep -v "createClientWithSession"
```
**Violation:** File uses `getUser()` but imports `createClient()` not `createClientWithSession()`
**Severity:** ❌

---

## C4 — context.params not awaited (Next.js 15)
**Rule:** `coding-standards.md`
**Command:**
```bash
git diff HEAD~5 -- 'app/api/**/*.ts' 'app/**/*.tsx' | grep -E "^\+.*context\.params\." | grep -v "await" | grep -v "^+++"
```
**Violation:** Any output = params accessed synchronously
**Severity:** ❌

---

## C5 — Files created in project root
**Rule:** `file-organization.md`
**Command:**
```bash
git diff HEAD~5 --name-only --diff-filter=A | grep -E "^[^/]+\.(md|txt|js|ts|json)$" | grep -vE "^(package\.json|package-lock\.json|tsconfig|next\.config|tailwind\.config|vercel\.json|CLAUDE\.md|README\.md|\.eslintrc|\.prettierrc)"
```
**Violation:** Any output = file created in root that should be in a subdirectory
**Severity:** ❌

---

## C6 — StatusBadge missing status= prop
**Rule:** `admin-shared-components.md`
**Command:**
```bash
git diff HEAD~5 -- 'components/**/*.tsx' | grep -E "^\+.*<StatusBadge" | grep -v 'status=' | grep -v "^+++"
```
**Violation:** StatusBadge used without `status=` prop
**Severity:** ❌

---

## C7 — StatCard icon passed as component ref not JSX element
**Rule:** `admin-shared-components.md`
**Command:**
```bash
git diff HEAD~5 -- 'components/**/*.tsx' | grep -E "^\+.*<StatCard" | grep -E 'icon=\{[A-Z][a-zA-Z]+\}' | grep -v "^+++"
```
**Violation:** StatCard icon is a component reference `{PiXxx}` not a JSX element `{<PiXxx />}`
**Severity:** ❌

---

## C8 — Pipeline gates (session context check — no command)
**Rule:** `workflow.md` / `anti-patterns.md`
**Method:** Reflect on the current session. Ask yourself:
- Did this session begin new feature/page/component work? → Was `brainstorming` invoked?
- Did this session encounter a bug or error? → Was `systematic-debugging` invoked?
- Did this session change 2+ files? → Was `writing-plans` invoked?
- Did this session complete a feature? → Was `verification-before-completion` invoked?
- Did this session complete a feature? → Was `requesting-code-review` invoked?

**Violation:** Any gate that should have been invoked but wasn't
**Severity:** ⚠️
