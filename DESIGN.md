# SUPER-INDIVIDUAL-TOOLBOX · Design Specification (v1.0)

> **Slogan:** Equip One. Run Like a Team. / 一人成军，顺手兵器库
> **Metaphor:** 高手之所以成为高手，在于拥有一套经过实战打磨、随手可取的工具箱。
> **Architecture:** Zero-dependency Static Web App (GitHub Pages) + Bilingual JSON Data (`zh` / `en`) + GitHub Actions CI Gate.

## 1. Core Principles
1. **工具而非软件导航**：不收录“某某 AI 网址”，只沉淀抗迭代的能力模块（方法、协议、检查表、工作流）；具体模型/软件仅作为可热替换的 `current_stack` 字段存在。
2. **抽屉是岗位，卡片是兵器**：前台按虚拟岗位（心智模型）组织；卡片必须是具体可调用的工具。
3. **双轴结构（岗位为经，能力为纬）**：前台 9 个抽屉，后台 3 组正交标签，支持在“岗位视图”与“能力 X 光视图”间无缝切换。
4. **双语原生与自动化门禁**：所有展示字段强制 `{ zh, en }` 结构；任何数据变更必须通过 `node scripts/validate.mjs` 才允许部署。

## 2. 9 Drawers & 4 Boundary Rules
- **参谋 (`01`) vs. 产品 (`02`)**：解决 Why & Whether（做不做）归参谋；解决 What & How（做成什么样、边界在哪）归产品。
- **工程师 (`03`) vs. 运营自动化 (`07`)**：造产品/对外交付物归工程师；维护个人日常运转、消灭重复劳动归运营自动化。
- **内容 (`05`) vs. 增长 (`06`)**：从 0 到 1 产出核心母本归内容；拆条、改标题、多端分发与促转化归增长。
- **设计 (`04`) vs. 内容 (`05`)**：文字与叙事逻辑归内容；视觉、听觉、交互与审美表现归设计。

## 3. Controlled Vocabulary
- `tags.layer`: `Thinking` | `Memory` | `Building` | `Automation` | `Distribution`
- `tags.form_factor`: `Prompt / Protocol` | `Skill / Template` | `Workflow / Agent` | `Local / Code`
- `tags.leverage`: `Time` | `Quality` | `Risk`
