import { EventBus } from './engine.js';
import { BUILDING_DEFS, BUDGET_SLIDERS, TAX_RATE as TAX_RATE_CONFIG } from './config.js';
import * as Sim from './simulation.js';

let currentTool = { type: 'road', subtype: null };
let budgetVisible = false;

const TOOLS = [
  { type: 'road', subtype: null, emoji: '🛣', label: '道路', subItems: [
    { subtype: 'road_basic', label: '两车道道路', cost: '$10/格' },
    { subtype: 'road_highway', label: '高速公路', cost: '$30/格' },
  ]},
  { type: 'zone', subtype: null, emoji: '🏘', label: '分区', subItems: [
    { subtype: 'residential', label: '🏠 住宅区', cost: '免费' },
    { subtype: 'commercial', label: '🏪 商业区', cost: '免费' },
    { subtype: 'industrial', label: '🏭 工业区', cost: '免费' },
    { subtype: 'dezone', label: '🗑 取消分区', cost: '' },
  ]},
  { type: 'power', subtype: null, emoji: '⚡', label: '电力', subItems: [
    { subtype: 'wind_turbine', label: '风力发电机', cost: `$${BUILDING_DEFS.wind_turbine.cost}` },
    { subtype: 'coal_plant', label: '燃煤发电厂', cost: `$${BUILDING_DEFS.coal_plant.cost}` },
  ]},
  { type: 'water', subtype: null, emoji: '💧', label: '供水', subItems: [
    { subtype: 'water_pump', label: '抽水泵', cost: `$${BUILDING_DEFS.water_pump.cost}` },
    { subtype: 'sewage_outlet', label: '排污口', cost: `$${BUILDING_DEFS.sewage_outlet.cost}` },
  ]},
  { type: 'service', subtype: null, emoji: '🏥', label: '服务', subItems: [
    { subtype: 'fire_station', label: `🔥 ${BUILDING_DEFS.fire_station.name}`, cost: `$${BUILDING_DEFS.fire_station.cost}` },
    { subtype: 'police_station', label: `🚔 ${BUILDING_DEFS.police_station.name}`, cost: `$${BUILDING_DEFS.police_station.cost}` },
    { subtype: 'hospital', label: `🏥 ${BUILDING_DEFS.hospital.name}`, cost: `$${BUILDING_DEFS.hospital.cost}` },
    { subtype: 'elementary_school', label: `📚 ${BUILDING_DEFS.elementary_school.name}`, cost: `$${BUILDING_DEFS.elementary_school.cost}` },
    { subtype: 'landfill', label: `🗑 ${BUILDING_DEFS.landfill.name}`, cost: `$${BUILDING_DEFS.landfill.cost}` },
  ]},
  { type: 'budget', subtype: null, emoji: '📊', label: '预算' },
];

export function initUI() {
  buildToolbar();
  buildBudgetPanel();
  updateTopBar();

  EventBus.on('stats-updated', updateTopBar);
  EventBus.on('notification', showNotification);
  EventBus.on('milestone-reached', showMilestone);
}

function buildToolbar() {
  const bar = document.getElementById('bottom-bar');
  const submenu = document.getElementById('tool-submenu');
  let activeTool = null;

  for (const tool of TOOLS) {
    const btn = document.createElement('button');
    btn.className = 'tool-btn' + (tool.type === 'road' ? ' active' : '');
    btn.innerHTML = `<span class="emoji">${tool.emoji}</span>${tool.label}`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#bottom-bar .tool-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#bottom-bar .tool-btn').forEach(b => b.classList.remove('active'));

      if (tool.type === 'budget') {
        toggleBudget();
        return;
      }

      if (activeTool === tool.type && submenu.classList.contains('show')) {
        submenu.classList.remove('show');
        activeTool = null;
      } else {
        btn.classList.add('active');
        showSubmenu(tool, submenu, btn);
        activeTool = tool.type;
      }
    });
    bar.appendChild(btn);
  }

  document.addEventListener('click', (e) => {
    if (!submenu.contains(e.target) && !e.target.closest('#bottom-bar')) {
      submenu.classList.remove('show');
      activeTool = null;
    }
  });
}

function showSubmenu(tool, submenu, btn) {
  submenu.innerHTML = '';
  submenu.classList.add('show');

  const rect = btn.getBoundingClientRect();
  submenu.style.left = Math.max(4, rect.left) + 'px';

  if (!tool.subItems) {
    currentTool = { type: tool.type, subtype: null };
    EventBus.emit('tool-changed', currentTool);
    submenu.classList.remove('show');
    return;
  }

  for (const item of tool.subItems) {
    const div = document.createElement('button');
    div.className = 'sub-item';
    div.textContent = `${item.label}  ${item.cost || ''}`;
    div.addEventListener('click', () => {
      currentTool = { type: tool.type, subtype: item.subtype };
      EventBus.emit('tool-changed', currentTool);
      submenu.querySelectorAll('.sub-item').forEach(i => i.classList.remove('selected'));
      div.classList.add('selected');
    });
    submenu.appendChild(div);
  }

  const defaultItem = submenu.querySelector('.sub-item');
  if (defaultItem) {
    defaultItem.classList.add('selected');
    currentTool = { type: tool.type, subtype: tool.subItems[0].subtype };
    EventBus.emit('tool-changed', currentTool);
  }
}

function buildBudgetPanel() {
  const panel = document.getElementById('budget-panel');

  const taxTypes = [
    { key: 'residential', label: '住宅区税率' },
    { key: 'commercial', label: '商业区税率' },
    { key: 'industrial', label: '工业区税率' },
  ];

  let html = '<h3>📊 预算管理</h3>';

  html += '<div style="margin-bottom:10px;font-weight:600">税率</div>';
  for (const t of taxTypes) {
    html += `<div class="slider-row">
      <label>${t.label}: <strong id="tax-${t.key}-val">${Sim.getTaxRate(t.key)}%</strong></label>
      <input type="range" min="${TAX_RATE_CONFIG.min}" max="${TAX_RATE_CONFIG.max}"
        value="${Sim.getTaxRate(t.key)}" data-tax="${t.key}" class="tax-slider" />
      <div class="range-info"><span>${TAX_RATE_CONFIG.min}%</span><span>${TAX_RATE_CONFIG.max}%</span></div>
    </div>`;
  }

  html += '<div style="margin:12px 0;font-weight:600">服务预算</div>';
  for (const [key, { label }] of Object.entries({
    power: { label: '⚡ 电力预算' },
    water: { label: '💧 供水预算' },
    healthcare: { label: '🏥 医疗预算' },
    police: { label: '🚔 警察预算' },
    fire: { label: '🔥 消防预算' },
    education: { label: '📚 教育预算' },
    roads: { label: '🛣 道路维护' },
  })) {
    html += `<div class="slider-row">
      <label>${label}: <strong id="budget-${key}-val">${Sim.getBudgetSlider(key)}%</strong></label>
      <input type="range" min="50" max="150" value="${Sim.getBudgetSlider(key)}"
        data-budget="${key}" class="budget-slider" />
      <div class="range-info"><span>50%</span><span>150%</span></div>
    </div>`;
  }

  html += `<button id="budget-close" style="margin-top:10px;width:100%;padding:6px;cursor:pointer;">关闭</button>`;
  panel.innerHTML = html;

  panel.querySelectorAll('.tax-slider').forEach(s => {
    s.addEventListener('input', () => {
      const type = s.dataset.tax;
      const val = parseInt(s.value);
      Sim.setTaxRate(type, val);
      const label = panel.querySelector(`#tax-${type}-val`);
      if (label) label.textContent = val + '%';
    });
  });

  panel.querySelectorAll('.budget-slider').forEach(s => {
    s.addEventListener('input', () => {
      const key = s.dataset.budget;
      const val = parseInt(s.value);
      Sim.setBudgetSlider(key, val);
      const label = panel.querySelector(`#budget-${key}-val`);
      if (label) label.textContent = val + '%';
    });
  });

  panel.querySelector('#budget-close').addEventListener('click', () => toggleBudget());
}

function toggleBudget() {
  const panel = document.getElementById('budget-panel');
  budgetVisible = !budgetVisible;
  panel.classList.toggle('show', budgetVisible);
}

function updateTopBar(data) {
  if (!data) {
    document.getElementById('stat-pop').textContent = '0';
    document.getElementById('stat-money').textContent = '70000';
    document.getElementById('stat-day').textContent = 'Day 1';
    return;
  }

  document.getElementById('stat-pop').textContent = (data.population || 0).toLocaleString();
  document.getElementById('stat-money').textContent = formatMoney(data.money || 0);
  document.getElementById('stat-day').textContent = `Day ${data.day || 1}`;

  const container = document.getElementById('demand-bars');
  if (container) {
    const d = data.demand || { r: 0, c: 0, i: 0 };
    container.innerHTML = `
      <div class="demand-item"><span class="label">🏠 R</span><div class="bar"><div class="fill r" style="width:${d.r}%"></div></div></div>
      <div class="demand-item"><span class="label">🏪 C</span><div class="bar"><div class="fill c" style="width:${d.c}%"></div></div></div>
      <div class="demand-item"><span class="label">🏭 I</span><div class="bar"><div class="fill i" style="width:${d.i}%"></div></div></div>
    `;
  }
}

export function showInfoPanel(building) {
  const panel = document.getElementById('info-panel');
  if (!building) {
    panel.classList.remove('show');
    return;
  }

  let html = `<h3>${building.name || '建筑'}</h3>`;
  html += `<div class="row"><span>类型</span><span class="val">${building.type}</span></div>`;

  if (building.level) html += `<div class="row"><span>等级</span><span class="val">${'⭐'.repeat(building.level)}</span></div>`;
  if (building.residents) html += `<div class="row"><span>居民</span><span class="val">${building.residents}</span></div>`;
  if (building.jobs) html += `<div class="row"><span>工作岗位</span><span class="val">${building.jobs}</span></div>`;
  if (building.category === 'power') {
    html += `<div class="row"><span>发电量</span><span class="val">${building.powerOutput || 0} MW</span></div>`;
  }
  if (building.category === 'water') {
    html += `<div class="row"><span>供水量</span><span class="val">${building.waterOutput || building.sewageCapacity || 0}</span></div>`;
  }
  html += `<div class="row"><span>维护费</span><span class="val">$${building.upkeep || 0}/日</span></div>`;
  if (building.hasPower !== undefined) {
    html += `<div class="row"><span>电力</span><span class="val" style="color:${building.hasPower ? '#4caf50' : '#f44336'}">${building.hasPower ? '已供电' : '⚠ 无电'}</span></div>`;
  }
  if (building.hasWater !== undefined) {
    html += `<div class="row"><span>供水</span><span class="val" style="color:${building.hasWater ? '#4caf50' : '#f44336'}">${building.hasWater ? '已供水' : '⚠ 无供水'}</span></div>`;
  }

  panel.innerHTML = html;
  panel.classList.add('show');

  if (!panel._closeBound) {
    panel._closeBound = true;
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        panel.classList.remove('show');
      }
    });
  }
}

function showNotification(msg) {
  const el = document.getElementById('notification');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._timeout);
  el._timeout = setTimeout(() => el.classList.remove('show'), 3000);
}

function showMilestone(data) {
  showNotification(`🎉 达到里程碑：${data.name}！新建筑已解锁`);
}

export function getCurrentTool() { return currentTool; }

function formatMoney(n) {
  if (Math.abs(n) >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (Math.abs(n) >= 1000) return '$' + Math.floor(n).toLocaleString();
  return '$' + Math.floor(n);
}
