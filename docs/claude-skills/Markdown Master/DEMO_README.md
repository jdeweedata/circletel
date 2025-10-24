# Markdown Master

[![Skill Type](https://img.shields.io/badge/type-Claude%20Skill-blue.svg)](https://claude.ai)
[![Version](https://img.shields.io/badge/version-1.0.0-green.svg)]()

> Professional markdown document creation toolkit with automated quality assurance, templates, and best practices built-in.

![Markdown Master Banner](https://img.shields.io/badge/Markdown-Master-black?style=for-the-badge&logo=markdown)

<!-- TOC -->
## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [What's Included](#whats-included)
  - [Automated Tools](#automated-tools)
  - [Comprehensive References](#comprehensive-references)
- [Quick Start](#quick-start)
- [Use Cases](#use-cases)
- [Installation](#installation)
- [Example Workflow](#example-workflow)
- [Quality Assurance](#quality-assurance)
- [Best Practices Built-In](#best-practices-built-in)
- [Contributing](#contributing)
- [License](#license)
<!-- TOC -->

## Overview

**Markdown Master** is a comprehensive Claude skill that transforms markdown document creation from a manual process into a guided, quality-assured workflow. Whether you're writing technical documentation, blog posts, project READMEs, or research papers, this skill provides the templates, tools, and guidance to create professional documents every time.

**Perfect for:**
- 📚 Technical writers creating documentation
- 💻 Developers building project READMEs
- ✍️ Content creators writing blog posts
- 🔬 Researchers drafting papers
- 📊 Project managers creating reports

## Features

✨ **Why Markdown Master stands out:**

- 🎯 **Smart Templates** - Pre-built templates for 6+ common document types
- 🔍 **Automated Linting** - Catch formatting issues before they become problems
- 📑 **TOC Generation** - Automatically generate tables of contents with multiple styles
- 📖 **Complete Syntax Guide** - Never forget markdown syntax again
- ✅ **Quality Checklists** - Ensure documents meet professional standards
- 🎨 **Best Practices** - Learn and apply markdown conventions automatically
- 🚀 **Fast Workflow** - Guided process from blank page to polished document

## What's Included

### Automated Tools

**Markdown Linter (`markdown_linter.py`)**
Validates your markdown for common issues:
- Heading hierarchy problems
- Missing code block languages
- Non-descriptive link text
- Images without alt text
- Trailing whitespace
- Inconsistent list formatting

**Example output:**
```bash
$ python scripts/markdown_linter.py document.md
🔍 Linting document.md...

⚠️ Line 15: Heading level skipped (H2 → H4)
ℹ️ Line 23: Code block without language specification
⚠️ Line 31: Image missing alt text

📊 Summary:
   Errors: 0
   Warnings: 2
   Info: 1
   Total: 3
```

**TOC Generator (`toc_generator.py`)**
Creates beautiful tables of contents:
- Three styles: default, numbered, compact
- Configurable depth levels
- Automatic anchor link generation
- In-place file updates

**Example:**
```bash
# Preview TOC
$ python scripts/toc_generator.py document.md

# Add to file
$ python scripts/toc_generator.py document.md --in-place --style numbered
✅ Updated document.md with table of contents
```

### Comprehensive References

**Syntax Guide** - Complete markdown reference with examples
- All standard markdown syntax
- Extended CommonMark/GFM features
- Advanced formatting techniques
- HTML integration patterns

**Templates Library** - Professional templates for:
- Technical Documentation
- Project Reports  
- Meeting Notes
- Blog Posts
- Research Papers
- README files

**Best Practices Guide** - Industry standards covering:
- Document structure and organization
- Readability optimization
- Accessibility requirements
- Common pitfalls to avoid
- Quality assurance checklist

## Quick Start

**1. Add the skill to Claude**
```bash
# Download markdown-master.skill and add it to Claude
```

**2. Create your first document**
Simply tell Claude:
> "Create a technical README for my Python library using the markdown-master skill"

**3. Watch the magic happen**
Claude will:
- Load the appropriate template
- Apply best practices automatically
- Format everything correctly
- Add a table of contents
- Validate the final output

## Use Cases

### For Developers
```markdown
"Create a README for my new React component library"
→ Professional README with installation, usage, API docs, and examples
```

### For Technical Writers
```markdown
"Draft API documentation for our REST endpoints"
→ Structured documentation with proper formatting and code examples
```

### For Content Creators
```markdown
"Write a blog post about Docker best practices"
→ Engaging blog post with proper structure and callouts
```

### For Project Managers
```markdown
"Create meeting notes for our quarterly planning session"
→ Organized notes with action items table and decisions captured
```

## Installation

1. Download the `markdown-master.skill` file
2. Add it to Claude through the skills interface
3. Start creating professional markdown documents

**Requirements:**
- Claude account with skills enabled
- Python 3.6+ (for running automation scripts locally)

## Example Workflow

Here's how a typical document creation looks:

```
User: "Create a comprehensive README for my Python CLI tool"

Claude: 
1. Loads README template from markdown-master
2. Customizes structure for CLI tools
3. Adds proper sections: Installation, Usage, Examples, etc.
4. Includes code blocks with syntax highlighting
5. Generates table of contents
6. Validates with linter
7. Delivers polished README

Result: Professional README in seconds, not hours
```

## Quality Assurance

Every document created with Markdown Master meets professional standards:

✅ **Proper structure** - Logical heading hierarchy  
✅ **Readable** - Optimized paragraph length and spacing  
✅ **Accessible** - Alt text on images, descriptive links  
✅ **Consistent** - Uniform formatting throughout  
✅ **Complete** - All necessary sections included  
✅ **Validated** - Passes automated quality checks

## Best Practices Built-In

Markdown Master automatically applies professional conventions:

**Good** ✅
```markdown
# Main Title
## Section
### Subsection

Install the package:
```bash
npm install package
```

![Screenshot of the dashboard](dashboard.png)
```

**Avoided** ❌  
```markdown
# Title
#### Skipping levels

Install:
```
npm install
```

![](image.png)
```

## Contributing

Want to improve Markdown Master? Contributions are welcome!

**Ideas for enhancements:**
- Additional document templates
- More linting rules
- Export to other formats
- Integration with popular platforms

## License

This skill is provided as-is for use with Claude. The included scripts are available under the MIT License.

---

**Ready to create amazing markdown documents?** Add the Markdown Master skill to Claude today and transform your writing workflow.

Made with 💙 by Claude users, for Claude users
