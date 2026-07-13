import { HEX_SIZE, HEX_NEIGHBORS } from '../constants';

export function axialToPixel(q: number, r: number): [number, number] {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * (3 / 2) * r;
  return [x, y];
}

export function pixelToAxial(px: number, py: number): [number, number] {
  const q = (Math.sqrt(3) / 3 * px - 1 / 3 * py) / HEX_SIZE;
  const r = (2 / 3 * py) / HEX_SIZE;
  return cubeRound(q, r);
}

function cubeRound(q: number, r: number): [number, number] {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }
  return [rq, rr];
}

export function getHexCorners(centerX: number, centerY: number, size: number = HEX_SIZE): [number, number][] {
  const corners: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30);
    corners.push([
      centerX + size * Math.cos(angle),
      centerY + size * Math.sin(angle),
    ]);
  }
  return corners;
}

export function getNeighbors(q: number, r: number): [number, number][] {
  return HEX_NEIGHBORS.map(([dq, dr]) => [q + dq, r + dr] as [number, number]);
}

export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(-q1 - r1 + q2 + r2)) / 2;
}

export function hexesInRange(q: number, r: number, range: number): [number, number][] {
  const results: [number, number][] = [];
  for (let dq = -range; dq <= range; dq++) {
    for (let dr = Math.max(-range, -dq - range); dr <= Math.min(range, -dq + range); dr++) {
      results.push([q + dq, r + dr]);
    }
  }
  return results;
}

export function hexLine(q1: number, r1: number, q2: number, r2: number): [number, number][] {
  const dist = hexDistance(q1, r1, q2, r2);
  if (dist === 0) return [[q1, r1]];
  const results: [number, number][] = [];
  for (let i = 0; i <= dist; i++) {
    const t = i / dist;
    const q = q1 + (q2 - q1) * t;
    const r = r1 + (r2 - r1) * t;
    results.push(cubeRound(q, r));
  }
  return results;
}

export function getRing(q: number, r: number, radius: number): [number, number][] {
  if (radius === 0) return [[q, r]];
  const results: [number, number][] = [];
  let hq = q + HEX_NEIGHBORS[4][0] * radius;
  let hr = r + HEX_NEIGHBORS[4][1] * radius;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < radius; j++) {
      results.push([hq, hr]);
      hq += HEX_NEIGHBORS[i][0];
      hr += HEX_NEIGHBORS[i][1];
    }
  }
  return results;
}
