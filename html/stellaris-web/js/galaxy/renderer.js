import { gameState } from '../gameState.js';
import { GALAXY, EMPIRE_COLORS } from '../constants.js';
import { dist, rgbaFromVar } from '../helpers.js';

const canvas = document.getElementById('galaxy-canvas');
const ctx = canvas.getContext('2d');

let cameraX = 0, cameraY = 0, zoom = 1;
let dragging = false, dragStartX = 0, dragStartY = 0;
let hoveredSystem = null;
let tooltipEl = null;

export function initRenderer() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel);
  canvas.addEventListener('dblclick', onDblClick);

  tooltipEl = document.createElement('div');
  tooltipEl.className = 'tooltip';
  tooltipEl.style.display = 'none';
  document.getElementById('galaxy-container').appendChild(tooltipEl);

  gameState.viewCenter = { x: cameraX, y: cameraY };
  gameState.viewZoom = zoom;
}

function resizeCanvas() {
  const container = document.getElementById('galaxy-container');
  canvas.width = container.clientWidth * window.devicePixelRatio;
  canvas.height = container.clientHeight * window.devicePixelRatio;
  canvas.style.width = container.clientWidth + 'px';
  canvas.style.height = container.clientHeight + 'px';
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}

function worldToScreen(wx, wy) {
  const container = document.getElementById('galaxy-container');
  const cx = container.clientWidth / 2;
  const cy = container.clientHeight / 2;
  return {
    x: cx + (wx - cameraX) * zoom,
    y: cy + (wy - cameraY) * zoom,
  };
}

function screenToWorld(sx, sy) {
  const container = document.getElementById('galaxy-container');
  const cx = container.clientWidth / 2;
  const cy = container.clientHeight / 2;
  return {
    x: (sx - cx) / zoom + cameraX,
    y: (sy - cy) / zoom + cameraY,
  };
}

function onMouseDown(e) {
  if (e.button === 0) {
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
  }
}

function onMouseMove(e) {
  if (dragging) {
    const dx = (e.clientX - dragStartX) / zoom;
    const dy = (e.clientY - dragStartY) / zoom;
    cameraX -= dx;
    cameraY -= dy;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    gameState.viewCenter = { x: cameraX, y: cameraY };
    return;
  }

  const wp = screenToWorld(e.clientX, e.clientY);
  let found = null;
  for (const sys of Object.values(gameState.systems)) {
    const sd = dist(wp.x, wp.y, sys.x, sys.y);
    if (sd < 25 / zoom) {
      if (!found || dist(wp.x, wp.y, sys.x, sys.y) < dist(wp.x, wp.y, found.x, found.y)) {
        found = sys;
      }
    }
  }
  hoveredSystem = found;

  if (found) {
    const sp = worldToScreen(found.x, found.y);
    tooltipEl.style.display = 'block';
    tooltipEl.style.left = (sp.x + 15) + 'px';
    tooltipEl.style.top = (sp.y - 10) + 'px';

    let extraInfo = '';
    if (found.owner && gameState.empires[found.owner]) {
      extraInfo = `<br>Owned by: ${gameState.empires[found.owner].name}`;
    }
    if (found.planets) {
      const hab = found.planets.filter(p => p.isHabitable);
      if (hab.length > 0) extraInfo += `<br>Habitable worlds: ${hab.length}`;
    }
    const fleetsHere = gameState.getFleetsInSystem(found.id);
    if (fleetsHere.length > 0) extraInfo += `<br>Fleets: ${fleetsHere.length}`;

    tooltipEl.innerHTML = `<div class="tt-title">${found.name}</div>
      <div class="tt-desc">${found.starType.replace('_', ' ')} system${extraInfo}</div>`;
  } else {
    tooltipEl.style.display = 'none';
  }

  canvas.style.cursor = hoveredSystem ? 'pointer' : (dragging ? 'grabbing' : 'default');
}

function onMouseUp(e) {
  if (dragging) {
    const moved = Math.abs(e.clientX - dragStartX) + Math.abs(e.clientY - dragStartY);
    dragging = false;
    if (moved > 5) return;
  }

  if (hoveredSystem) {
    selectSystem(hoveredSystem.id);
  }
}

function onWheel(e) {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.9 : 1.1;
  zoom = Math.max(0.2, Math.min(3.0, zoom * factor));
  gameState.viewZoom = zoom;
}

function onDblClick(e) {
  if (hoveredSystem) {
    selectSystem(hoveredSystem.id);
  }
}

export function selectSystem(systemId) {
  const sys = gameState.systems[systemId];
  if (!sys) return;
  gameState.selectedSystemId = systemId;
  gameState.selectedFleetId = null;

  cameraX = sys.x;
  cameraY = sys.y;
  gameState.viewCenter = { x: cameraX, y: cameraY };

  updateBottomBar(sys);
}

function updateBottomBar(sys) {
  const info = document.getElementById('bb-info');
  if (!info) return;

  let owned = '';
  if (sys.owner && gameState.empires[sys.owner]) {
    owned = ` — ${gameState.empires[sys.owner].name}`;
  }

  let fleetsHere = '';
  const fleets = gameState.getFleetsInSystem(sys.id);
  if (fleets.length > 0) {
    fleetsHere = ` | ${fleets.length} fleet(s)`;
  }

  let planetsHere = '';
  if (sys.planets) {
    const hab = sys.planets.filter(p => p.isHabitable);
    const col = sys.planets.filter(p => p.colonized);
    if (col.length > 0) planetsHere = ` | ${col.length} colonies`;
    else if (hab.length > 0) planetsHere = ` | ${hab.length} habitable worlds`;
  }

  info.innerHTML = `<b>${sys.name}</b> [${sys.starType.replace(/_/g, ' ')}]${owned}${planetsHere}${fleetsHere}`;

  const actions = document.getElementById('bb-actions');
  if (sys.owner === gameState.playerEmpireId && sys.starbase && sys.starbase.level >= 1) {
    const planets = sys.planets.filter(p => p.colonized && p.owner === gameState.playerEmpireId);
    let html = '';
    if (planets.length > 0) {
      html += `<button class="btn" onclick="window.openPlanetView('${planets[0].id}')">${planets[0].name}</button>`;
    }
    actions.innerHTML = html;
  } else {
    actions.innerHTML = '';
  }
}

export function render(cameraXParam, cameraYParam, zoomParam) {
  cameraX = cameraXParam || cameraX;
  cameraY = cameraYParam || cameraY;
  zoom = zoomParam || zoom;

  const container = document.getElementById('galaxy-container');
  const w = container.clientWidth;
  const h = container.clientHeight;
  ctx.clearRect(0, 0, w, h);

  drawBackground(w, h);
  drawHyperlanes();
  drawEmpireBorders();

  const markerLayer = [];
  for (const sys of Object.values(gameState.systems)) {
    const sp = worldToScreen(sys.x, sys.y);
    if (sp.x < -50 || sp.x > w + 50 || sp.y < -50 || sp.y > h + 50) continue;
    markerLayer.push({ sys, sp });
  }

  for (const item of markerLayer) {
    drawSystem(item.sys, item.sp);
    drawSystemLabel(item.sys, item.sp);
  }

  drawSelectedHighlight();
}

function drawBackground(w, h) {
  const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
  gradient.addColorStop(0, '#0d111a');
  gradient.addColorStop(0.5, '#080c13');
  gradient.addColorStop(1, '#020408');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

function drawHyperlanes() {
  const drawn = new Set();
  for (const hl of gameState.hyperlanes) {
    const s1 = gameState.systems[hl.a], s2 = gameState.systems[hl.b];
    if (!s1 || !s2) continue;
    const sp1 = worldToScreen(s1.x, s1.y);
    const sp2 = worldToScreen(s2.x, s2.y);

    let alpha = 0.15, color = '#334466';
    if (s1.owner === gameState.playerEmpireId || s2.owner === gameState.playerEmpireId) {
      alpha = 0.4; color = '#446688';
    }

    ctx.beginPath();
    ctx.moveTo(sp1.x, sp1.y);
    ctx.lineTo(sp2.x, sp2.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1 * zoom;
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawEmpireBorders() {
  const colors = EMPIRE_COLORS;
  let ci = 0;
  for (const empire of Object.values(gameState.empires)) {
    const ownedSystems = Object.values(gameState.systems).filter(s => s.owner === empire.id);
    if (ownedSystems.length === 0) continue;

    const col = colors[ci % colors.length];
    ci++;

    for (const sys of ownedSystems) {
      const sp = worldToScreen(sys.x, sys.y);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 30 * zoom, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.globalAlpha = 0.05;
      ctx.fill();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = col;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

function drawSystem(sys, sp) {
  const starInfo = GALAXY.STAR_COLORS[sys.starType] || '#ffffff';
  const starSize = (GALAXY.STAR_SIZES[sys.starType] || 2.5) * zoom;

  ctx.globalAlpha = 1;

  if (sys.owner === gameState.playerEmpireId) {
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, starSize + 4, 0, Math.PI * 2);
    ctx.fillStyle = rgbaFromVar('var(--accent-cyan)', 0.2);
    ctx.fill();
  }

  if (sys.starType === 'black_hole') {
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, starSize + 3, 0, Math.PI * 2);
    const bhGrad = ctx.createRadialGradient(sp.x, sp.y, starSize * 0.2, sp.x, sp.y, starSize + 3);
    bhGrad.addColorStop(0, '#1a1a2e');
    bhGrad.addColorStop(0.5, '#252540');
    bhGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = bhGrad;
    ctx.fill();
  }

  if (sys.starType === 'neutron' || sys.starType === 'pulsar') {
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, starSize + 2, 0, Math.PI * 2);
    ctx.fillStyle = rgbaFromVar('var(--accent-cyan)', 0.1);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(sp.x, sp.y, starSize, 0, Math.PI * 2);
  const starGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, starSize);
  starGrad.addColorStop(0, '#ffffff');
  starGrad.addColorStop(0.2, starInfo);
  starGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = starGrad;
  ctx.fill();

  if (sys.owner && gameState.empires[sys.owner]) {
    const empIdx = Object.keys(gameState.empires).indexOf(sys.owner);
    const col = EMPIRE_COLORS[empIdx % EMPIRE_COLORS.length];
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, starSize + 3, 0, Math.PI * 2);
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5 * zoom;
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (sys.starbase && sys.starbase.level >= 1 && sys.owner) {
    const empIdx = Object.keys(gameState.empires).indexOf(sys.owner);
    const col = EMPIRE_COLORS[empIdx % EMPIRE_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(sp.x - starSize - 5, sp.y);
    ctx.lineTo(sp.x - starSize - 14, sp.y - 6);
    ctx.lineTo(sp.x - starSize - 14, sp.y + 6);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const fleetsHere = gameState.getFleetsInSystem(sys.id);
  if (fleetsHere.length > 0 && sys.owner !== gameState.playerEmpireId) {
    const empIdx = Object.keys(gameState.empires).indexOf(fleetsHere[0].owner);
    const col = EMPIRE_COLORS[empIdx % EMPIRE_COLORS.length];
    ctx.beginPath();
    ctx.arc(sp.x + starSize + 6, sp.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  }
}

function drawSystemLabel(sys, sp) {
  if (zoom < 0.4) return;

  ctx.font = `${Math.max(8, 10 * zoom)}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';

  let alpha = 0.6;
  let color = '#576574';
  if (sys.owner === gameState.playerEmpireId) { alpha = 0.9; color = '#c8d6e5'; }
  else if (sys.owner) { alpha = 0.7; color = '#8395a7'; }

  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  const label = sys.name;
  const labelY = sp.y + (GALAXY.STAR_SIZES[sys.starType] || 2.5) * zoom + 10 * zoom;
  ctx.fillText(label, sp.x, labelY);
  ctx.globalAlpha = 1;
}

function drawSelectedHighlight() {
  if (gameState.selectedSystemId) {
    const sys = gameState.systems[gameState.selectedSystemId];
    if (!sys) return;
    const sp = worldToScreen(sys.x, sys.y);
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 30 * zoom, 0, Math.PI * 2);
    ctx.strokeStyle = 'var(--accent-cyan)';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    const dashLen = 6;
    ctx.setLineDash([dashLen, dashLen]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }
}
