# Tools

Local developer tools — not part of the CircleTel build.

## open-design (Prototyping)

Visual prototyping tool. Run before implementing any new page.

```bash
cd tools/open-design
npm run dev:all
```

Opens at http://localhost:5173

**Skills to use per page type:**

| Page type | Skill |
|-----------|-------|
| Campaign / landing / one-off | `web-prototype` |
| Partner / business landing | `saas-landing` |
| Pricing / package pages | `pricing-page` |
| Admin / dashboard | `dashboard` |
| Mobile flows | `mobile-app` |
| Invoice PDF layout | `invoice` |

Always select **CircleTel** from the Design System dropdown.

**Export:** Click "Save to disk" → artifact lands in `.od/artifacts/`. Copy HTML to `docs/superpowers/specs/assets/` to attach to the spec.
