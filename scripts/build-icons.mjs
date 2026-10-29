import { loadDesign } from '../generators/lib/design.mjs';
import { generateIcons } from '../generators/zed/icons.mjs';

const family = await generateIcons(await loadDesign());
console.log(`Generated ${family.themes.length} Darkstar Nova icon variants.`);
