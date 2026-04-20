bun run scripts/prebuild.mjgs
bun run typecheck
bun run lint .
bun run format
bun run build
echo "done!"