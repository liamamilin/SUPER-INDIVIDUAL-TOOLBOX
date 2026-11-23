# SUPER-INDIVIDUAL-TOOLBOX

**Equip One. Run Like a Team. / 一人成军，顺手兵器库**

A zero-dependency, bilingual (`zh` / `en`) curated workbench of **36 battle-tested capability tools** across **9 virtual roles** for solo builders in the LLM era.

## Features
- **9 Virtual-Role Drawers (3×3)**: From `00 Personal OS` to `08 Legal & Finance`.
- **Dual-Axis View (`Drawer` / `X-Ray`)**: Browse by role or switch to X-Ray mode to audit capability balance across `Thinking`, `Memory`, `Building`, `Automation`, and `Distribution`.
- **Combo Chains**: Jump directly between complementary tools inside the detail drawer.
- **My Loadout (`localStorage`)**: Assemble your personal kit, track role coverage, and export a clean Markdown checklist.
- **Zero-Dependency CI Gate**: `node scripts/validate.mjs` enforces schema integrity, ID prefixes, controlled vocabularies, and combo referential integrity before GitHub Pages deployment.

## Local Preview & Validation
```bash
# 1. Validate all 36 cards
node scripts/validate.mjs

# 2. Preview locally (any static server)
npx serve .
# or
python3 -m http.server 8080
```

## Deploy to GitHub Pages
1. Push this repository to GitHub (`main` branch).
2. Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Every push to `main` automatically runs `validate.mjs` and deploys to GitHub Pages.
