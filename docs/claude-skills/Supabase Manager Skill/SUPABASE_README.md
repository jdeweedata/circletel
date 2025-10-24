# Supabase Manager Skill

> Complete Supabase project management with automatic .env credential loading, RLS policy generation, and comprehensive troubleshooting.

## Quick Start

### 1. Add to Claude
Upload `supabase-manager.skill` to Claude

### 2. Load Your Project Credentials
Just say: *"Read my Supabase credentials from the .env file"*

### 3. Manage Your Database
- *"Create a users table with RLS policies"*
- *"Generate policies for my posts table"*
- *"Fix permission denied errors"*
- *"Help me set up team-based access"*

## What's Included

### 🔧 Automation Scripts
- **load_env.py** - Auto-detect and validate .env credentials
- **rls_generator.py** - Generate production-ready RLS policies

### 📚 Reference Guides
- **cli_commands.md** - Complete CLI reference (580 lines)
- **rls_policies.md** - RLS patterns and best practices (650 lines)
- **common_issues.md** - Troubleshooting guide (450 lines)

### 🎯 Key Features
- ✅ Reads .env files from your project automatically
- ✅ Supports all frameworks (Next.js, Vite, React, etc.)
- ✅ Generates 12+ types of RLS policies
- ✅ Complete Supabase CLI command reference
- ✅ Solutions for 20+ common issues
- ✅ Latest 2025 Supabase information

## Example Usage

### Load Credentials
```
You: "Check my Supabase configuration"
Claude: [Runs load_env.py and validates your .env file]
```

### Create Secure Tables
```
You: "Create a posts table where users can only edit their own posts"
Claude: [Generates migration with table + RLS policies + indexes]
```

### Fix Issues
```
You: "I'm getting permission denied errors"
Claude: [References common_issues.md and provides the fix]
```

### Team Setup
```
You: "Set up a workspace where team members can share documents"
Claude: [Creates complete schema with teams, members, documents, and RLS]
```

## Why Use This?

- 🚀 **Faster development** - Automated policy generation
- 🔒 **Better security** - RLS by default
- 🐛 **Fewer bugs** - Proven patterns and troubleshooting
- 📖 **Complete guidance** - From init to production
- 🤝 **Team friendly** - Collaboration workflows included

## Files in Package

```
supabase-manager.skill
├── SKILL.md (main instructions)
├── scripts/
│   ├── load_env.py (credential loader)
│   └── rls_generator.py (policy generator)
└── references/
    ├── cli_commands.md (CLI reference)
    ├── rls_policies.md (RLS guide)
    └── common_issues.md (troubleshooting)
```

## Perfect For

- 👨‍💻 **Developers** setting up new Supabase projects
- 🔐 **Teams** needing secure, collaborative databases
- 🐛 **Anyone** troubleshooting Supabase issues
- 📚 **Learners** wanting to master Supabase best practices

---

**[Download supabase-manager.skill](computer:///mnt/user-data/outputs/supabase-manager.skill)** | **[Read Full Showcase](computer:///mnt/user-data/outputs/SUPABASE_SHOWCASE.md)**
