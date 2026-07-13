export function drawTank(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
  facing: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((facing / 8) * Math.PI * 2);

  const w = size * 1.4;
  const h = size * 0.9;

  // body
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // darker outline
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // tracks
  ctx.fillStyle = secondary;
  ctx.fillRect(-w / 2, -h / 2 - 2, w, 4);
  ctx.fillRect(-w / 2, h / 2 - 2, w, 4);

  // turret base
  ctx.fillStyle = secondary;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.35, size * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();

  // barrel
  ctx.strokeStyle = secondary;
  ctx.lineWidth = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.5, 0);
  ctx.stroke();

  ctx.restore();
}

export function drawInfantry(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
  facing: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);

  const s = size * 0.5;

  // body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.3, s * 0.4, s * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // head
  ctx.fillStyle = secondary;
  ctx.beginPath();
  ctx.arc(0, -s * 1.1, s * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // legs
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, s * 0.1);
  ctx.lineTo(-s * 0.2, s * 0.8);
  ctx.moveTo(s * 0.15, s * 0.1);
  ctx.lineTo(s * 0.2, s * 0.8);
  ctx.stroke();

  ctx.restore();
}

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  w: number, h: number, color: string, secondary: string,
  owner: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  if (w > 30 && h > 30) {
    ctx.fillStyle = secondary;
    ctx.fillRect(-w / 2 + 4, -h / 2 + 4, 8, 8);
    ctx.fillRect(w / 2 - 12, -h / 2 + 4, 8, 8);
    ctx.fillRect(-w / 2 + 4, h / 2 - 12, 8, 8);
    ctx.fillRect(w / 2 - 12, h / 2 - 12, 8, 8);
  }

  ctx.restore();
}

export function drawConstructionYard(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
  progress: number,
): void {
  const w = size * 2;
  const h = size * 1.6;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  ctx.strokeStyle = secondary;
  ctx.lineWidth = 3;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  ctx.fillStyle = secondary;
  ctx.fillRect(-w / 2, -h / 2, w, 6);
  ctx.fillRect(-w / 2, h / 2 - 6, w, 6);

  if (progress > 0 && progress < 1) {
    ctx.fillStyle = 'rgba(255,255,0,0.5)';
    ctx.fillRect(-w / 2, -h / 2, w * progress, h);
  }

  ctx.restore();
}

export function drawPowerPlant(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
): void {
  const w = size * 1.6;
  const h = size * 1.4;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.moveTo(0, -h / 2 + 4);
  ctx.lineTo(w * 0.2, h / 2 - 8);
  ctx.lineTo(-w * 0.1, -h / 2 + 12);
  ctx.lineTo(w * 0.05, h / 2 - 4);
  ctx.lineTo(-w * 0.2, -h / 2 + 8);
  ctx.lineTo(w * 0.15, h / 2 - 8);
  ctx.fill();

  ctx.restore();
}

export function drawBarracks(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
): void {
  const w = size * 1.6;
  const h = size * 1.2;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // flag
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, -h / 2);
  ctx.lineTo(-w / 2 + 6, -h / 2 - h * 0.4);
  ctx.stroke();
  ctx.fillStyle = secondary;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 6, -h / 2 - h * 0.4);
  ctx.lineTo(-w / 2 + w * 0.25, -h / 2 - h * 0.2);
  ctx.lineTo(-w / 2 + 6, -h / 2 - h * 0.05);
  ctx.fill();

  ctx.restore();
}

export function drawRefinery(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
): void {
  const w = size * 2.2;
  const h = size * 1.4;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // chimney
  ctx.fillStyle = secondary;
  ctx.fillRect(-w / 2 + 4, -h / 2 - h * 0.2, 6, h * 0.2);
  ctx.fillRect(w / 2 - 10, -h / 2 - h * 0.2, 6, h * 0.2);

  // tank symbol
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawWarFactory(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
): void {
  const w = size * 2.4;
  const h = size * 1.6;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // garage door
  ctx.fillStyle = secondary;
  ctx.fillRect(-w / 2 + 6, -h / 2 + h * 0.3, w * 0.4, h * 0.4);

  // cog symbol
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(w * 0.2, 0, h * 0.2, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const r1 = h * 0.2 - 2;
    const r2 = w * 0.05;
    ctx.beginPath();
    ctx.moveTo(w * 0.2 + Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(w * 0.2 + Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawOreMine(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
): void {
  const w = size * 1.6;
  const h = size * 1.2;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // "$" symbol
  ctx.fillStyle = '#ffd700';
  ctx.font = `${size * 0.7}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 0);

  ctx.restore();
}

export function drawAirField(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
): void {
  const w = size * 2.4;
  const h = size * 1.4;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // runway
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 10, 0);
  ctx.lineTo(w / 2 - 10, 0);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

export function drawDefenseStructure(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
): void {
  const w = size * 1.2;
  const h = size * 1.2;

  ctx.save();
  ctx.translate(cx, cy);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = secondary;
  ctx.lineWidth = 2;
  ctx.stroke();

  // small turret dot
  ctx.fillStyle = secondary;
  ctx.beginPath();
  ctx.arc(0, 0, w * 0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawHarvester(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
  facing: number,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((facing / 8) * Math.PI * 2);

  const w = size * 1.8;
  const h = size * 1.1;

  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // scoop
  ctx.fillStyle = secondary;
  ctx.fillRect(w / 2 - 6, -h / 2, 8, h);
  ctx.fillRect(w / 2 - 2, -h / 2 - 6, 6, 12);

  ctx.restore();
}

export function drawAircraft(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, color: string, secondary: string,
  facing: number, isJet: boolean,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((facing / 8) * Math.PI * 2);

  const w = size * 1.6;
  const h = size * 0.5;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(0, -h / 2);
  ctx.lineTo(-w / 2, 0);
  ctx.lineTo(0, h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (isJet) {
    ctx.fillStyle = secondary;
    ctx.fillRect(w * 0.1, -h * 0.15, w * 0.3, h * 0.3);
  }

  // wings
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(size * 0.1, 0);
  ctx.lineTo(-size * 0.4, -size * 0.7);
  ctx.moveTo(size * 0.1, 0);
  ctx.lineTo(-size * 0.4, size * 0.7);
  ctx.stroke();

  ctx.restore();
}

export function drawOreParticle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, isGem: boolean,
): void {
  ctx.fillStyle = isGem ? '#ff4444' : '#ffaa00';
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.fill();
  if (isGem) {
    ctx.strokeStyle = '#ffaaaa';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

export function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  width: number, hp: number, maxHp: number,
): void {
  if (hp >= maxHp) return;
  const barW = width;
  const barH = 3;
  const x = cx - barW / 2;
  const y = cy - 16;

  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, barW, barH);
  ctx.fillStyle = hp / maxHp > 0.5 ? '#0f0' : hp / maxHp > 0.25 ? '#ff0' : '#f00';
  ctx.fillRect(x, y, barW * (hp / maxHp), barH);
}

export function drawSelectionCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
): void {
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, size + 4, 0, Math.PI * 2);
  ctx.setLineDash([3, 3]);
  ctx.stroke();
  ctx.setLineDash([]);
}

export function drawExplosion(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number, alpha: number,
): void {
  const colors = ['#ff4400', '#ff8800', '#ffaa00', '#ffff00'];
  const n = colors.length;

  for (let i = n - 1; i >= 0; i--) {
    const r = size * ((n - i) / n);
    ctx.fillStyle = colors[i] + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
): void {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);

  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
  ctx.fillRect(x, y, w, h);
}
