export function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}

export function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

export function pickWeighted(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function angle(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(1);
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function createEl(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'className') el.className = v;
    else if (k === 'innerHTML') el.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  });
  children.forEach(c => {
    if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else if (c) el.appendChild(c);
  });
  return el;
}

export function $(selector) { return document.querySelector(selector); }
export function $$(selector) { return document.querySelectorAll(selector); }

export function formatDate(year, month, day) {
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;
}

export function addDays(date, days) {
  let d = date.day + days;
  let m = date.month;
  let y = date.year;
  while (d > 30) { d -= 30; m++; }
  while (m > 12) { m -= 12; y++; }
  return { year: y, month: m, day: d };
}

export function daysSince(a, b) {
  return (a.year - b.year) * 360 + (a.month - b.month) * 30 + (a.day - b.day);
}

export function posToColor(pos, neutral) {
  if (pos >= 80) return 'var(--accent-green)';
  if (pos >= 40) return 'var(--accent-cyan)';
  if (pos >= 0) return neutral || 'var(--text-secondary)';
  if (pos >= -40) return 'var(--accent-orange)';
  return 'var(--accent-red)';
}

export function colorToHex(cssVar) {
  const el = document.createElement('div');
  el.style.color = cssVar;
  document.body.appendChild(el);
  const hex = getComputedStyle(el).color;
  document.body.removeChild(el);
  return hex;
}

export function rgbaFromVar(cssVar, alpha) {
  const el = document.createElement('div');
  el.style.color = cssVar;
  document.body.appendChild(el);
  const color = getComputedStyle(el).color;
  document.body.removeChild(el);
  const match = color.match(/[\d.]+/g);
  if (match && match.length >= 3) {
    return `rgba(${match[0]},${match[1]},${match[2]},${alpha})`;
  }
  return `rgba(255,255,255,${alpha})`;
}
