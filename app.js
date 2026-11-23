const I18N = {
  zh: {
    brandTitle: 'SUPER-INDIVIDUAL-TOOLBOX',
    brandSlogan: '一人成军，顺手兵器库 · Equip One. Run Like a Team.',
    viewDrawer: '抽屉视图',
    viewXray: 'X光体检',
    onlyLoadout: '只看已装配',
    exportMd: '导出 Markdown',
    clearLoadout: '清空',
    searchPlaceholder: '搜索工具名、编号、痛点或交付物... (按 / 快速聚焦)',
    filterForm: '载体:',
    filterLeverage: '杠杆:',
    all: '全部',
    allDrawers: '全部抽屉',
    equip: '+ 收入装配台',
    equipped: '✓ 已装配',
    copyPrompt: '⚡ 复制为 AI Prompt',
    triggerLabel: '什么时候掏出来 · TRIGGER',
    mechanismLabel: '核心机制 · MECHANISM',
    deliverableLabel: '交付物 · DELIVERABLE',
    stackLabel: '当下装配 · CURRENT STACK',
    antiLabel: '误用警告 · ANTI-PATTERN',
    combosLabel: '连招推荐 · COMBO CHAIN',
    xrayTitle: '能力层分布体检（X-Ray · 点击定位）',
    xrayMissing: '⚠️ 当前装配缺少此能力层',
    emptyMsg: '没有匹配的工具卡，试试放宽筛选条件。',
    footerNote: '零依赖静态架构 · 所有装配数据仅存于本地浏览器 (localStorage)，零云端上传。',
    loadoutSummary: (c, t, d) => `已装配 ${c}/${t} · 覆盖 ${d}/9 岗位`,
    toastExported: '已导出并复制 Markdown 装备清单',
    toastEmptyExport: '装配台还是空的，先收几件顺手兵器吧',
    toastPromptCopied: '已复制为标准 AI Prompt，直接粘贴即可使用',
    layers: {
      Thinking: '认知与决策 (Thinking)',
      Memory: '资产与记忆 (Memory)',
      Building: '制造与原型 (Building)',
      Automation: '自动化与代理 (Automation)',
      Distribution: '分发与变现 (Distribution)'
    }
  },
  en: {
    brandTitle: 'SUPER-INDIVIDUAL-TOOLBOX',
    brandSlogan: 'Equip One. Run Like a Team. · Solo Builder Workbench',
    viewDrawer: 'Drawers',
    viewXray: 'X-Ray',
    onlyLoadout: 'Loadout Only',
    exportMd: 'Export Markdown',
    clearLoadout: 'Clear',
    searchPlaceholder: 'Search by ID, title, trigger, or deliverable... (Press / to search)',
    filterForm: 'Form:',
    filterLeverage: 'Leverage:',
    all: 'All',
    allDrawers: 'All Drawers',
    equip: '+ Add to Loadout',
    equipped: '✓ Equipped',
    copyPrompt: '⚡ Copy as AI Prompt',
    triggerLabel: 'WHEN TO PULL IT OUT · TRIGGER',
    mechanismLabel: 'CORE MECHANISM',
    deliverableLabel: 'CONCRETE DELIVERABLE',
    stackLabel: 'CURRENT STACK',
    antiLabel: 'ANTI-PATTERN WARNING',
    combosLabel: 'COMBO CHAIN (NEXT STEPS)',
    xrayTitle: 'Capability Layer Distribution (X-Ray · Click to jump)',
    xrayMissing: '⚠️ Missing in your current loadout',
    emptyMsg: 'No tools match your current filters.',
    footerNote: 'Zero-dependency static app · Loadout state stays strictly in localStorage.',
    loadoutSummary: (c, t, d) => `Equipped ${c}/${t} · Covering ${d}/9 Roles`,
    toastExported: 'Exported & copied Markdown loadout',
    toastEmptyExport: 'Your loadout is empty—add a few tools first',
    toastPromptCopied: 'Copied as ready-to-paste AI Prompt',
    layers: {
      Thinking: 'Thinking & Decision',
      Memory: 'Memory & Assets',
      Building: 'Building & Prototyping',
      Automation: 'Automation & Agents',
      Distribution: 'Distribution & Commercial'
    }
  }
};

const FORMS = ['Prompt / Protocol', 'Skill / Template', 'Workflow / Agent', 'Local / Code'];
const LEVERAGES = ['Time', 'Quality', 'Risk'];
const LAYERS = ['Thinking', 'Memory', 'Building', 'Automation', 'Distribution'];

const state = {
  lang: localStorage.getItem('sit_lang') || 'zh',
  theme: localStorage.getItem('sit_theme') || 'light',
  view: 'drawer', // 'drawer' | 'xray'
  activeDrawer: 'all',
  search: '',
  formFilter: 'all',
  leverageFilter: 'all',
  onlyLoadout: false,
  loadout: new Set(JSON.parse(localStorage.getItem('sit_loadout') || '[]')),
  drawers: [],
  cards: [],
  cardMap: new Map(),
  openCardId: null
};

const $ = sel => document.querySelector(sel);

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function init() {
  applyTheme();
  try {
    const manifestRes = await fetch('data/manifest.json');
    const manifest = await manifestRes.json();
    state.drawers = manifest.drawers;

    const results = await Promise.all(
      state.drawers.map(d => fetch(`data/${d.file}`).then(r => r.json()))
    );
    state.cards = results.flat();
    state.cards.forEach(c => state.cardMap.set(c.id, c));
  } catch (err) {
    $('#cardsContainer').innerHTML = `<div class="empty-state">Failed to load data. If opening locally, please run a local HTTP server (e.g. <code>python3 -m http.server</code>).</div>`;
    return;
  }

  bindEvents();
  renderAll();
  syncFromHash();
}

function saveLoadout() {
  localStorage.setItem('sit_loadout', JSON.stringify([...state.loadout]));
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
}

function t(key) {
  return I18N[state.lang][key];
}

function showToast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), 2400);
}

function syncFromHash() {
  const id = location.hash.replace(/^#/, '').trim();
  if (id && state.cardMap.has(id)) {
    openModal(id, false);
  } else if (state.openCardId) {
    closeModal(false);
  }
}

function bindEvents() {
  $('#btnLang').addEventListener('click', () => {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('sit_lang', state.lang);
    renderAll();
    if (state.openCardId) openModal(state.openCardId, false);
  });

  $('#btnTheme').addEventListener('click', () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('sit_theme', state.theme);
    applyTheme();
  });

  document.querySelectorAll('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.view = btn.dataset.view;
      document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b === btn));
      renderAll();
    });
  });

  $('#searchInput').addEventListener('input', e => {
    state.search = e.target.value.trim().toLowerCase();
    renderCards();
  });

  $('#btnFilterLoadout').addEventListener('click', () => {
    state.onlyLoadout = !state.onlyLoadout;
    $('#btnFilterLoadout').classList.toggle('active', state.onlyLoadout);
    renderCards();
  });

  $('#btnClearLoadout').addEventListener('click', () => {
    state.loadout.clear();
    saveLoadout();
    renderLoadoutBar();
    renderCards();
  });

  $('#btnExportMd').addEventListener('click', exportLoadoutMarkdown);

  $('#modalClose').addEventListener('click', () => closeModal(true));
  $('#modalBackdrop').addEventListener('click', e => {
    if (e.target === $('#modalBackdrop')) closeModal(true);
  });

  window.addEventListener('hashchange', syncFromHash);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && state.openCardId) {
      closeModal(true);
      return;
    }
    if (
      e.key === '/' &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA'
    ) {
      e.preventDefault();
      $('#searchInput').focus();
    }
  });
}

function renderAll() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  $('#btnLang').textContent = state.lang === 'zh' ? 'EN' : '中';
  $('#searchInput').placeholder = t('searchPlaceholder');

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (typeof t(key) === 'string') el.textContent = t(key);
  });

  renderFilters();
  renderLoadoutBar();
  renderDrawerTabs();
  renderCards();
}

function renderFilters() {
  const formWrap = $('#formFilterGroup');
  formWrap.innerHTML = `<span class="filter-label">${escapeHtml(t('filterForm'))}</span>`;
  ['all', ...FORMS].forEach(val => {
    const btn = document.createElement('button');
    btn.className = `chip-btn ${state.formFilter === val ? 'active' : ''}`;
    btn.textContent = val === 'all' ? t('all') : val;
    btn.onclick = () => { state.formFilter = val; renderFilters(); renderCards(); };
    formWrap.appendChild(btn);
  });

  const levWrap = $('#leverageFilterGroup');
  levWrap.innerHTML = `<span class="filter-label">${escapeHtml(t('filterLeverage'))}</span>`;
  ['all', ...LEVERAGES].forEach(val => {
    const btn = document.createElement('button');
    btn.className = `chip-btn ${state.leverageFilter === val ? 'active' : ''}`;
    btn.textContent = val === 'all' ? t('all') : val;
    btn.onclick = () => { state.leverageFilter = val; renderFilters(); renderCards(); };
    levWrap.appendChild(btn);
  });
}

function renderLoadoutBar() {
  const equippedCards = state.cards.filter(c => state.loadout.has(c.id));
  const coveredDrawers = new Set(equippedCards.map(c => c.drawer)).size;
  $('#loadoutSummary').textContent = t('loadoutSummary')(equippedCards.length, state.cards.length, coveredDrawers);
}

function renderDrawerTabs() {
  const section = $('#drawerNavSection');
  if (state.view === 'xray') {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  const tabs = $('#drawerTabs');
  tabs.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = `drawer-tab ${state.activeDrawer === 'all' ? 'active' : ''}`;
  allBtn.innerHTML = `<span>${escapeHtml(t('allDrawers'))}</span><span class="drawer-code">${state.cards.length}</span>`;
  allBtn.onclick = () => { state.activeDrawer = 'all'; renderDrawerTabs(); renderCards(); };
  tabs.appendChild(allBtn);

  state.drawers.forEach(d => {
    const btn = document.createElement('button');
    btn.className = `drawer-tab ${state.activeDrawer === d.id ? 'active' : ''}`;
    btn.innerHTML = `<span class="drawer-code">${escapeHtml(d.code)}</span><span>${escapeHtml(d[state.lang])}</span>`;
    btn.onclick = () => { state.activeDrawer = d.id; renderDrawerTabs(); renderCards(); };
    tabs.appendChild(btn);
  });

  const banner = $('#drawerBanner');
  if (state.activeDrawer === 'all') {
    banner.classList.add('hidden');
  } else {
    const d = state.drawers.find(x => x.id === state.activeDrawer);
    banner.textContent = `“${d.question[state.lang]}”`;
    banner.classList.remove('hidden');
  }
}

function getFilteredCards() {
  return state.cards.filter(c => {
    if (state.view === 'drawer' && state.activeDrawer !== 'all' && c.drawer !== state.activeDrawer) return false;
    if (state.onlyLoadout && !state.loadout.has(c.id)) return false;
    if (state.formFilter !== 'all' && c.tags.form_factor !== state.formFilter) return false;
    if (state.leverageFilter !== 'all' && c.tags.leverage !== state.leverageFilter) return false;
    if (state.search) {
      const hay = [
        c.id, c.title.zh, c.title.en, c.metaphor.zh, c.metaphor.en,
        c.trigger.zh, c.trigger.en, c.deliverable.zh, c.deliverable.en
      ].join(' ').toLowerCase();
      if (!hay.includes(state.search)) return false;
    }
    return true;
  });
}

function createCardElement(card) {
  const isEq = state.loadout.has(card.id);
  const el = document.createElement('article');
  el.className = `tool-card ${isEq ? 'equipped' : ''}`;
  el.innerHTML = `
    <div class="card-top">
      <span class="id-badge">${escapeHtml(card.id)}</span>
      <button class="equip-btn ${isEq ? 'equipped' : ''}">${escapeHtml(isEq ? t('equipped') : t('equip'))}</button>
    </div>
    <h2 class="card-title">${escapeHtml(card.title[state.lang])}</h2>
    <p class="card-metaphor">${escapeHtml(card.metaphor[state.lang])}</p>
    <div class="card-tags">
      <span class="tag-pill">${escapeHtml(card.tags.layer)}</span>
      <span class="tag-pill">${escapeHtml(card.tags.form_factor)}</span>
      <span class="tag-pill">${escapeHtml(card.tags.leverage)}</span>
    </div>
  `;

  el.querySelector('.equip-btn').addEventListener('click', e => {
    e.stopPropagation();
    toggleEquip(card.id);
  });

  el.addEventListener('click', () => openModal(card.id, true));
  return el;
}

function toggleEquip(id) {
  if (state.loadout.has(id)) state.loadout.delete(id);
  else state.loadout.add(id);
  saveLoadout();
  renderLoadoutBar();
  renderCards();
}

function renderCards() {
  const filtered = getFilteredCards();
  const container = $('#cardsContainer');
  const xraySec = $('#xraySummarySection');
  container.innerHTML = '';

  if (state.view === 'xray') {
    xraySec.classList.remove('hidden');
    const total = filtered.length || 1;
    xraySec.innerHTML = `
      <div class="xray-title">${escapeHtml(t('xrayTitle'))} (${filtered.length})</div>
      <div class="xray-bars">
        ${LAYERS.map(layer => {
          const count = filtered.filter(c => c.tags.layer === layer).length;
          const pct = Math.round((count / total) * 100);
          const isMissing = state.onlyLoadout && count === 0;
          return `
            <div class="xray-bar-item ${isMissing ? 'missing' : ''}" data-layer-jump="${escapeHtml(layer)}">
              <div class="xray-bar-head">
                <span>${escapeHtml(t('layers')[layer])}</span>
                <span class="mono">${count} (${pct}%)</span>
              </div>
              <div class="xray-track"><div class="xray-fill" style="width:${pct}%"></div></div>
              ${isMissing ? `<div class="xray-missing-hint">${escapeHtml(t('xrayMissing'))}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;

    xraySec.querySelectorAll('[data-layer-jump]').forEach(item => {
      item.addEventListener('click', () => {
        const target = document.getElementById(`layer-${item.dataset.layerJump}`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state">${escapeHtml(t('emptyMsg'))}</div>`;
      return;
    }

    LAYERS.forEach(layer => {
      const group = filtered.filter(c => c.tags.layer === layer);
      if (!group.length) return;
      const sec = document.createElement('div');
      sec.className = 'layer-section';
      sec.id = `layer-${layer}`;
      sec.innerHTML = `<h3 class="layer-heading">${escapeHtml(t('layers')[layer])} <span class="id-badge">${group.length}</span></h3>`;
      const grid = document.createElement('div');
      grid.className = 'cards-grid';
      group.forEach(c => grid.appendChild(createCardElement(c)));
      sec.appendChild(grid);
      container.appendChild(sec);
    });
  } else {
    xraySec.classList.add('hidden');
    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state">${escapeHtml(t('emptyMsg'))}</div>`;
      return;
    }
    const grid = document.createElement('div');
    grid.className = 'cards-grid';
    filtered.forEach(c => grid.appendChild(createCardElement(c)));
    container.appendChild(grid);
  }
}

function buildPromptText(card) {
  const steps = card.mechanism[state.lang].map((s, i) => `${i + 1}. ${s}`).join('\n');
  if (state.lang === 'zh') {
    return [
      `请作为我的专业协作者，严格按照【${card.title.zh}】协议执行以下任务：`,
      '',
      `【适用背景】${card.trigger.zh}`,
      '',
      '【执行步骤】',
      steps,
      '',
      `【最终交付物】${card.deliverable.zh}`,
      `【注意避坑】${card.anti_pattern.zh}`,
      '',
      '如果你已准备好，请先向我索取必要输入，或直接根据我接下来提供的内容开始执行。'
    ].join('\n');
  }
  return [
    `Act as my sharp collaborator and execute the [${card.title.en}] protocol:`,
    '',
    `[Context / Trigger] ${card.trigger.en}`,
    '',
    '[Execution Steps]',
    steps,
    '',
    `[Concrete Deliverable] ${card.deliverable.en}`,
    `[Anti-Pattern Warning] ${card.anti_pattern.en}`,
    '',
    'If you are ready, ask me for the required inputs or begin immediately with what I provide next.'
  ].join('\n');
}

function openModal(id, updateHash = true) {
  const card = state.cardMap.get(id);
  if (!card) return;
  state.openCardId = id;

  if (updateHash && location.hash !== `#${id}`) {
    location.hash = `#${id}`;
  }

  const drawer = state.drawers.find(d => d.id === card.drawer);
  const isEq = state.loadout.has(card.id);

  $('#modalBadges').innerHTML = `
    <span class="id-badge">${escapeHtml(card.id)}</span>
    <span class="id-badge">${escapeHtml(drawer ? `${drawer.code} ${drawer[state.lang]}` : card.drawer)}</span>
    <button id="modalEquipBtn" class="equip-btn ${isEq ? 'equipped' : ''}">${escapeHtml(isEq ? t('equipped') : t('equip'))}</button>
  `;

  $('#modalEquipBtn').onclick = () => {
    toggleEquip(card.id);
    openModal(card.id, false);
  };

  const combosHtml = card.combos
    .map(cid => state.cardMap.get(cid))
    .filter(Boolean)
    .map(target => `<button class="combo-pill" data-jump="${escapeHtml(target.id)}"><span class="mono">${escapeHtml(target.id)}</span> ${escapeHtml(target.title[state.lang])} →</button>`)
    .join('');

  $('#modalBody').innerHTML = `
    <div class="modal-actions-row">
      <h2 class="modal-title" id="modalTitle">${escapeHtml(card.title[state.lang])}</h2>
    </div>
    <div class="modal-actions-row">
      <button id="btnCopyPrompt" class="copy-prompt-btn">${escapeHtml(t('copyPrompt'))}</button>
    </div>
    <div class="modal-metaphor">${escapeHtml(card.metaphor[state.lang])}</div>

    <div class="detail-block">
      <h3>${escapeHtml(t('triggerLabel'))}</h3>
      <p>${escapeHtml(card.trigger[state.lang])}</p>
    </div>

    <div class="detail-block">
      <h3>${escapeHtml(t('mechanismLabel'))}</h3>
      <ol class="mechanism-list">
        ${card.mechanism[state.lang].map(step => `<li>${escapeHtml(step)}</li>`).join('')}
      </ol>
    </div>

    <div class="detail-block">
      <h3>${escapeHtml(t('deliverableLabel'))}</h3>
      <p>${escapeHtml(card.deliverable[state.lang])}</p>
    </div>

    <div class="detail-block">
      <h3>${escapeHtml(t('stackLabel'))}</h3>
      <p>${escapeHtml(card.current_stack[state.lang])}</p>
    </div>

    <div class="detail-block">
      <h3>${escapeHtml(t('antiLabel'))}</h3>
      <div class="anti-box">${escapeHtml(card.anti_pattern[state.lang])}</div>
    </div>

    <div class="detail-block">
      <h3>${escapeHtml(t('combosLabel'))}</h3>
      <div class="combo-list">${combosHtml}</div>
    </div>
  `;

  $('#btnCopyPrompt').addEventListener('click', () => {
    const promptText = buildPromptText(card);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(promptText).then(() => showToast(t('toastPromptCopied'))).catch(() => {});
    }
  });

  $('#modalBody').querySelectorAll('[data-jump]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.jump, true));
  });

  $('#modalBackdrop').classList.remove('hidden');
  $('#modalBackdrop').setAttribute('aria-hidden', 'false');
}

function closeModal(clearHash = true) {
  state.openCardId = null;
  $('#modalBackdrop').classList.add('hidden');
  $('#modalBackdrop').setAttribute('aria-hidden', 'true');
  if (clearHash && location.hash) {
    history.replaceState(null, '', location.pathname + location.search);
  }
}

function exportLoadoutMarkdown() {
  const equipped = state.cards.filter(c => state.loadout.has(c.id));
  if (!equipped.length) {
    showToast(t('toastEmptyExport'));
    return;
  }

  const lines = [
    `# My Super Individual Toolbox Loadout (${equipped.length}/${state.cards.length})`,
    ''
  ];

  state.drawers.forEach(d => {
    const items = equipped.filter(c => c.drawer === d.id);
    if (!items.length) return;
    lines.push(`## ${d.code} ${d[state.lang]}`);
    items.forEach(c => {
      lines.push(`- **[${c.id.toUpperCase()}] ${c.title[state.lang]}** — ${c.metaphor[state.lang]}`);
      lines.push(`  - *Deliverable*: ${c.deliverable[state.lang]}`);
      lines.push(`  - *Stack*: ${c.current_stack[state.lang]}`);
    });
    lines.push('');
  });

  const md = lines.join('\n');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(md).catch(() => {});
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'my-super-individual-loadout.md';
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('toastExported'));
}

init();
