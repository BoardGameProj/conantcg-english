@echo off
bun run crawler.ts
@echo on
bun run update_artists.ts
bun run find_missing_translations.ts
@echo off
pause