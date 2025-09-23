# Client-Specific Forms System

This directory contains client-specific forms for surveys, audits, and data collection.

## Architecture

### Directory Structure
```
src/components/forms/
├── common/              # Reusable form components
│   ├── FormLayout.tsx   # Standard form layout wrapper
│   ├── ProgressBar.tsx  # Form progress indicator
│   ├── FormSection.tsx  # Form section wrapper
│   └── FormFields/      # Reusable field components
├── clients/             # Client-specific form implementations
│   ├── unjani/          # Unjani clinic forms
│   │   ├── ContractAuditForm.tsx
│   │   └── types.ts
│   └── [other-clients]/ # Future client forms
└── utils/               # Form utilities
    ├── validation.ts    # Form validation schemas
    ├── storage.ts       # Draft saving/loading
    └── export.ts        # Data export utilities
```

## Usage

### Creating a New Client Form
1. Create a new directory under `clients/[client-name]/`
2. Define TypeScript types for the form data
3. Create the form component using common components
4. Add routing in the main app
5. Configure submission handlers

### Form Features
- Progress tracking
- Draft saving/loading
- Data validation with Zod
- Export to CSV/JSON
- Responsive design
- Accessibility compliance

## Integration with Supabase
Forms can optionally integrate with Supabase Edge Functions for:
- Data submission and storage
- Email notifications
- Integration with CRM systems (e.g., Zoho)