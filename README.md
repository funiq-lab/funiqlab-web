# FuniqLab

A bilingual personal portfolio built with Next.js, React, TypeScript and next-intl. Scrolling scrubs a short film. The Route panel follows the same timeline, and More opens the project directory at the end.

## Local development

Use Node.js 24 and pnpm 12. Run `pnpm install --frozen-lockfile` and `pnpm dev`. The localized entries are `/en/` and `/zh/`. The root opens in English on a first visit and remembers an explicit language choice.

## Build and verify

```sh
pnpm lint
pnpm test
pnpm build
pnpm typecheck
pnpm preview
```

Cloudflare Pages serves the static export in `out/`. The preview command serves the same files on port 3000.

## Content and media

- `messages/` contains the interface and project copy. Project links live in `src/data/portfolio.ts`.
- `src/lib/choreography.ts` maps scroll position to film time and chapter captions. `src/lib/chapter-frames.ts` defines still frames for each device layout.
- `public/media/` contains the film and website imagery. Reduced-motion and data-saving modes use the chapter stills.
- `docs/video_prompt.md` contains the final production prompt.
- Font and component licenses are included in `public/licenses/`.
