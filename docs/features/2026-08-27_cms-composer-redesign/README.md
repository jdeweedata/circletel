# CMS composer redesign — hi-fi mockups

**Date:** 2026-08-27  
**Status:** Design review — pick direction A or B before implementing  
**Related:** marketing role workspace mapping in the same PR

Admin mockups use the backend UI kit (`docs/design/BACKEND_UI_KIT.md`, `--pm-*`, Archivo). Public mockups use `DESIGN.md` (Manrope / Inter, `#1B2A4A` / `#E87A1E`).

Interactive HTML: [index.html](./index.html)

## Pick one

| | A — Canvas | B — Section kit (recommended) |
|---|---|---|
| Edit | Click-to-type on the page + inspector | Reorder CircleTel sections only |
| Risk | Off-brand freeform | Harder to make ugly |
| Deals | Live `service_packages` SKUs | Same |

## Screens

### Admin

![Pages library](png/01-library.png)

![Composer A](png/02-composer-a.png)

![Composer B](png/03-composer-b.png)

![Publish](png/04-publish.png)

![5G shop chrome](png/05-5g-shop.png)

### Public

![Campaign landing](png/06-landing-desktop.png)

![Landing mobile](png/08-landing-mobile.png)

![/5g-deals merchandising](png/07-5g-deals-desktop.png)

## Not in this PR

- No rewrite of `lib/cms` or `/admin/cms/builder`
- `/5g-deals` still a code template; mock 05/07 show the merchandising seam only
- `designs/` stays gitignored; these files live here so they can be reviewed
