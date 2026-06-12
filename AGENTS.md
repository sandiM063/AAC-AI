<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Responsive UI

- Use design tokens from `src/app/responsive.css`: `--page-gutter`, `--touch-target`, `--bp-lg` (900px), safe-area insets.
- **Mobile-first**: default styles should work on small screens; enhance at `min-width: 900px` when needed.
- **Dashboard** (`< 900px`): slide-out nav via `DashboardShellClient`; do not rely on a permanent horizontal nav strip.
- **Touch**: interactive controls should meet ~44px min height (`var(--touch-target)`).
- **New pages/components**: use fluid spacing (`clamp`, `min()`, `%`), avoid fixed widths without a `max-width`, test at 320px–900px widths.
- Put cross-cutting breakpoint overrides in `responsive.css`; co-locate component-specific rules in `*.css` next to the component.
