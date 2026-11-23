import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const MANIFEST_PATH = path.join(DATA_DIR, 'manifest.json');
const IS_PARTIAL = process.argv.includes('--partial');

const DRAWER_PREFIX = {
  'personal-os': 'os-',
  'chief-of-staff': 'cos-',
  'product-architect': 'prd-',
  'engineer': 'eng-',
  'design-creative': 'des-',
  'editorial': 'edt-',
  'growth-commercial': 'grw-',
  'ops-automation': 'ops-',
  'legal-finance': 'leg-'
};

const VALID_LAYERS = new Set(['Thinking', 'Memory', 'Building', 'Automation', 'Distribution']);
const VALID_FORMS = new Set(['Prompt / Protocol', 'Skill / Template', 'Workflow / Agent', 'Local / Code']);
const VALID_LEVERAGES = new Set(['Time', 'Quality', 'Risk']);

const errors = [];
const warnings = [];
const allCards = [];
const idSet = new Set();

if (!fs.existsSync(DATA_DIR)) {
  console.error('❌ Missing data/ directory.');
  process.exit(1);
}

const files = fs
  .readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.json') && f !== 'tools.json' && f !== 'manifest.json');

// 0. Manifest consistency check
if (!fs.existsSync(MANIFEST_PATH)) {
  errors.push('[manifest.json] Missing data/manifest.json');
} else {
  try {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    if (!manifest || !Array.isArray(manifest.drawers)) {
      errors.push('[manifest.json] Must contain a "drawers" array');
    } else {
      const declaredFiles = new Set();
      for (const d of manifest.drawers) {
        if (!d.file) {
          errors.push(`[manifest.json] Drawer "${d.id || 'UNKNOWN'}" missing "file"`);
          continue;
        }
        declaredFiles.add(d.file);
        if (!fs.existsSync(path.join(DATA_DIR, d.file))) {
          errors.push(`[manifest.json] Declared file "data/${d.file}" does not exist`);
        }
      }
      for (const f of files) {
        if (!declaredFiles.has(f)) {
          errors.push(`[manifest.json] Orphan data file "data/${f}" is not registered in manifest.json`);
        }
      }
    }
  } catch (err) {
    errors.push(`[manifest.json] JSON parse error: ${err.message}`);
  }
}

for (const file of files) {
  const filePath = path.join(DATA_DIR, file);
  let cards;
  try {
    cards = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    if (!Array.isArray(cards)) throw new Error('Root must be a JSON array');
  } catch (err) {
    errors.push(`[${file}] JSON parse error: ${err.message}`);
    continue;
  }

  for (const card of cards) {
    const ref = `[${file} :: ${card.id || 'UNKNOWN'}]`;

    if (!card.id || typeof card.id !== 'string') {
      errors.push(`${ref} Missing valid string id`);
    } else if (idSet.has(card.id)) {
      errors.push(`${ref} Duplicate id "${card.id}"`);
    } else {
      idSet.add(card.id);
    }

    if (!DRAWER_PREFIX[card.drawer]) {
      errors.push(`${ref} Invalid drawer "${card.drawer}"`);
    } else if (card.id && !card.id.startsWith(DRAWER_PREFIX[card.drawer])) {
      errors.push(`${ref} ID "${card.id}" must start with "${DRAWER_PREFIX[card.drawer]}"`);
    }

    const textFields = ['title', 'metaphor', 'trigger', 'deliverable', 'current_stack', 'anti_pattern'];
    for (const field of textFields) {
      const val = card[field];
      if (!val || typeof val.zh !== 'string' || !val.zh.trim() || typeof val.en !== 'string' || !val.en.trim()) {
        errors.push(`${ref} Field "${field}" must have non-empty zh and en strings`);
      }
    }

    if (!card.mechanism || !Array.isArray(card.mechanism.zh) || !Array.isArray(card.mechanism.en)) {
      errors.push(`${ref} Field "mechanism" must have zh and en arrays`);
    } else {
      if (card.mechanism.zh.length < 2 || card.mechanism.en.length < 2) {
        warnings.push(`${ref} Mechanism has fewer than 2 steps`);
      }
      if (card.mechanism.zh.length !== card.mechanism.en.length) {
        warnings.push(`${ref} Mechanism step count mismatch between zh and en`);
      }
    }

    if (card.metaphor?.zh?.length > 25) {
      warnings.push(`${ref} metaphor.zh exceeds 25 chars (${card.metaphor.zh.length})`);
    }

    if (!card.tags || !VALID_LAYERS.has(card.tags.layer)) {
      errors.push(`${ref} Invalid tags.layer "${card.tags?.layer}"`);
    }
    if (!card.tags || !VALID_FORMS.has(card.tags.form_factor)) {
      errors.push(`${ref} Invalid tags.form_factor "${card.tags?.form_factor}"`);
    }
    if (!card.tags || !VALID_LEVERAGES.has(card.tags.leverage)) {
      errors.push(`${ref} Invalid tags.leverage "${card.tags?.leverage}"`);
    }

    allCards.push({ file, card });
  }
}

for (const { file, card } of allCards) {
  const ref = `[${file} :: ${card.id}]`;
  if (!Array.isArray(card.combos)) {
    errors.push(`${ref} Field "combos" must be an array`);
    continue;
  }
  for (const targetId of card.combos) {
    if (targetId === card.id) {
      errors.push(`${ref} Self-referencing combo "${targetId}"`);
    } else if (!idSet.has(targetId)) {
      const msg = `${ref} Broken combo reference "${targetId}"`;
      if (IS_PARTIAL) warnings.push(`${msg} (ignored in --partial mode)`);
      else errors.push(msg);
    }
  }
}

const drawerCount = {};
const layerCount = {};
for (const { card } of allCards) {
  drawerCount[card.drawer] = (drawerCount[card.drawer] || 0) + 1;
  layerCount[card.tags?.layer] = (layerCount[card.tags?.layer] || 0) + 1;
}

console.log(`\n📦 Validated ${allCards.length} cards across ${files.length} files.`);
console.log('Drawers:', drawerCount);
console.log('Layers: ', layerCount);

if (warnings.length) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`);
  warnings.forEach(w => console.log(`  - ${w}`));
}

if (errors.length) {
  console.error(`\n❌ Errors (${errors.length}):`);
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
}

console.log('\n✅ All checks passed!\n');
