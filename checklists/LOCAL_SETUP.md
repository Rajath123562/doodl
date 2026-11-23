# Windows 11 local implementation checklist

1. Extract archive, open folder in Antigravity. Preserve `reference/` as read-only concept.
2. Run `py -3 tools\verify_package.py` and `py -3 tools\review_kit.py` (or `python ...` if Python on PATH).
3. Check `node --version`, `npm --version`, `git --version`; use a supported current Node LTS compatible with latest Wrangler/Vite.
4. Open `prompts\00_MASTER_BUILD_PROMPT.md`; paste all content in Antigravity and tell it to follow phase files and tests.
5. Confirm actual app created at `app/`. Run `cd app`, `npm ci` if lockfile exists, `npm run dev`; open local URL.
6. Do not judge by static HTML alone: join from two isolated browsers and observe actual networked player movement/drawing.
7. Execute documented unit/integration/E2E, lint, typecheck, build scripts and save results.
8. Cloudflare login/deploy only after review and user authorization. Never paste secrets in prompt, chat or source.
9. Keep original ZIP/checklists as requirements; update status in new `app/IMPLEMENTATION_STATUS.md` after each phase.
