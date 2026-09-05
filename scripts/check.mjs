import { loadContent } from "./lib/content.mjs";

const { rangers } = await loadContent();
console.log(`✓ Content is valid (${rangers.length} Rangers)`);
