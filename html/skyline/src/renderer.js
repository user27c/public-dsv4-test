import * as THREE from 'three';
import { GRID_SIZE, CELL_SIZE, MAP_HALF, WATER_LEVEL, MAX_HEIGHT, ZONE_COLORS, ROAD_COLORS, TERRAIN_COLORS, BUILDING_DEFS } from './config.js';
import { Grid } from './grid.js';
import * as Buildings from './buildings.js';

let scene, camera, renderer, controls;
let terrainMesh, waterMesh, gridOverlay;
let roadGroup, buildingGroup, zoneOverlayGroup, ghostGroup;
let directionalLight, ambientLight;
const buildingMeshes = {};

const cssColor = (hex) => '#' + hex.toString(16).padStart(6, '0');

export function initRenderer(container) {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 80, 160);

  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 300);
  camera.position.set(50, 60, 50);
  camera.lookAt(0, 0, 0);

  ambientLight = new THREE.AmbientLight(0x6688cc, 0.6);
  scene.add(ambientLight);

  directionalLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  directionalLight.position.set(60, 80, 40);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  directionalLight.shadow.camera.far = 300;
  scene.add(directionalLight);

  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x445533, 0.3);
  scene.add(hemiLight);

  roadGroup = new THREE.Group();
  buildingGroup = new THREE.Group();
  zoneOverlayGroup = new THREE.Group();
  ghostGroup = new THREE.Group();
  scene.add(roadGroup);
  scene.add(buildingGroup);
  scene.add(zoneOverlayGroup);
  scene.add(ghostGroup);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer };
}

export function buildTerrain() {
  if (terrainMesh) scene.remove(terrainMesh);

  const cells = Grid.getAllCells();
  const segments = GRID_SIZE;
  const geom = new THREE.PlaneGeometry(
    GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE, segments, segments
  );
  geom.rotateX(-Math.PI / 2);

  const positions = geom.attributes.position;
  const colors = [];
  const heightScale = MAX_HEIGHT * 5;

  for (let i = 0; i < positions.count; i++) {
    const wx = positions.getX(i);
    const wy = positions.getY(i);
    const wz = positions.getZ(i);
    const gx = Math.round(wx + MAP_HALF);
    const gz = Math.round(wz + MAP_HALF);

    let h = 0;
    if (gx >= 0 && gx < GRID_SIZE && gz >= 0 && gz < GRID_SIZE) {
      h = cells[gz * GRID_SIZE + gx].height * heightScale;
    }
    positions.setY(i, h);

    const t = h / heightScale;
    let color = new THREE.Color(TERRAIN_COLORS.grass_low);
    if (t < WATER_LEVEL + 0.02) color.set(TERRAIN_COLORS.sand);
    else if (t > 0.4) color.set(TERRAIN_COLORS.rock_high);
    else if (t > 0.25) color.set(TERRAIN_COLORS.grass_high);
    else color.set(TERRAIN_COLORS.grass_mid);

    colors.push(color.r, color.g, color.b);
  }

  geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geom.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.0,
  });

  terrainMesh = new THREE.Mesh(geom, mat);
  terrainMesh.receiveShadow = true;
  terrainMesh.name = 'terrain';
  scene.add(terrainMesh);
}

export function buildWater() {
  if (waterMesh) scene.remove(waterMesh);

  const size = GRID_SIZE * CELL_SIZE;
  const geom = new THREE.PlaneGeometry(size, size);
  geom.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: 0x2266aa,
    roughness: 0.2,
    metalness: 0.3,
    transparent: true,
    opacity: 0.75,
  });

  waterMesh = new THREE.Mesh(geom, mat);
  waterMesh.position.y = WATER_LEVEL * MAX_HEIGHT * 5 - 0.02;
  waterMesh.receiveShadow = true;
  waterMesh.name = 'water';
  scene.add(waterMesh);
}

export function buildGridOverlay() {
  if (gridOverlay) scene.remove(gridOverlay);

  const group = new THREE.Group();
  const size = GRID_SIZE * CELL_SIZE;
  const half = MAP_HALF;
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.05,
  });

  for (let i = 0; i <= GRID_SIZE; i++) {
    const pos = -half + i * CELL_SIZE;
    const h = new THREE.PlaneGeometry(size, 0.02);
    const line = new THREE.Mesh(h, mat);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.05, pos);
    group.add(line);

    const v = new THREE.PlaneGeometry(0.02, size);
    const line2 = new THREE.Mesh(v, mat);
    line2.rotation.x = -Math.PI / 2;
    line2.position.set(pos, 0.05, 0);
    group.add(line2);
  }

  gridOverlay = group;
  scene.add(gridOverlay);
}

export function rebuildRoads() {
  while (roadGroup.children.length) roadGroup.remove(roadGroup.children[0]);

  const roadMap = Grid.getRoadMap();
  const heightScale = MAX_HEIGHT * 5;

  const cellsByType = {};
  for (const coords of roadMap.keys()) {
    const cell = Grid.get(parseInt(coords.split(',')[0]), parseInt(coords.split(',')[1]));
    if (!cell) continue;
    (cellsByType[cell.roadType] ||= []).push(cell);
  }

  const roadWidth = { basic: 0.5, highway: 0.9 };
  const roadHeight = 0.15;

  for (const [type, typeCells] of Object.entries(cellsByType)) {
    for (const cell of typeCells) {
      const wx = (cell.x - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
      const wz = (cell.y - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
      const h = cell.height * heightScale + roadHeight;
      const w = roadWidth[type] || 0.5;

      const geom = new THREE.BoxGeometry(
        cell.roadDir === 1 ? CELL_SIZE : w,
        0.08,
        cell.roadDir === 0 ? CELL_SIZE : w,
      );
      const mat = new THREE.MeshStandardMaterial({
        color: ROAD_COLORS[type] || 0x444444,
        roughness: 0.9,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(wx, h, wz);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      roadGroup.add(mesh);

      if (type === 'road_highway') {
        for (let side = -1; side <= 1; side += 2) {
          const lineGeom = new THREE.BoxGeometry(
            cell.roadDir === 1 ? CELL_SIZE * 0.7 : 0.05,
            0.01,
            cell.roadDir === 0 ? CELL_SIZE * 0.7 : 0.05,
          );
          const lineMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            roughness: 0.5,
            emissive: 0x331100,
            emissiveIntensity: 0.3,
          });
          const line = new THREE.Mesh(lineGeom, lineMat);
          line.position.set(
            wx + (cell.roadDir === 0 ? side * 0.18 : 0),
            h + 0.05,
            wz + (cell.roadDir === 1 ? side * 0.18 : 0),
          );
          roadGroup.add(line);
        }
      }
    }
  }
}

export function rebuildBuildings() {
  for (const key of Object.keys(buildingMeshes)) {
    const m = buildingMeshes[key];
    if (m) buildingGroup.remove(m);
    delete buildingMeshes[key];
  }

  const allBuildings = Buildings.getAllBuildings();
  const heightScale = MAX_HEIGHT * 5;

  const buildingColors = {
    residential: [0x66bb6a, 0x81c784, 0xa5d6a7, 0x4caf50, 0x388e3c],
    commercial: [0x42a5f5, 0x64b5f6, 0x90caf9, 0x1e88e5, 0x1976d2],
    industrial: [0xffa726, 0xffb74d, 0xffcc80, 0xfb8c00, 0xef6c00],
    power: 0x888888,
    water: 0x4488cc,
    service: 0xffffff,
  };

  const serviceColors = {
    fire_station: 0xcc4444,
    police_station: 0x4444cc,
    hospital: 0x44cc88,
    elementary_school: 0xffcc44,
    landfill: 0x666644,
  };

  for (const b of allBuildings) {
    const wx = (b.x - GRID_SIZE / 2 + b.w / 2) * CELL_SIZE;
    const wz = (b.y - GRID_SIZE / 2 + b.h / 2) * CELL_SIZE;
    const cell = Grid.get(b.x, b.y);
    const groundH = (cell ? cell.height : 0) * heightScale;

    let color, height;
    if (b.category === 'rci') {
      const palette = buildingColors[b.type] || buildingColors.residential;
      color = palette[Math.min(b.level - 1, palette.length - 1)];
      const bh = b.type === 'industrial' ? 0.8 : 0.4;
      height = bh + b.level * 0.35 + Math.random() * 0.3;
    } else if (b.category === 'service') {
      color = serviceColors[b.type] || 0xffffff;
      height = 1.2;
    } else if (b.category === 'power') {
      color = b.type === 'coal_plant' ? 0x666666 : 0xcccccc;
      height = b.type === 'coal_plant' ? 2.5 : 3.0;
    } else if (b.category === 'water') {
      color = 0x4488cc;
      height = 0.6;
    }

    const group = new THREE.Group();

    const bodyGeom = new THREE.BoxGeometry(b.w * 0.85, height, b.h * 0.85);
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    body.position.y = groundH + height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    if (b.category === 'rci') {
      const roofGeom = new THREE.ConeGeometry(b.w * 0.5, 0.2, 4);
      const roofMat = new THREE.MeshStandardMaterial({
        color: b.type === 'industrial' ? 0x555555 : 0x884444,
        roughness: 0.6,
      });
      const roof = new THREE.Mesh(roofGeom, roofMat);
      roof.position.y = groundH + height + 0.1;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
    }

    if (b.type === 'wind_turbine') {
      const poleGeom = new THREE.CylinderGeometry(0.08, 0.1, height, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 });
      const pole = new THREE.Mesh(poleGeom, poleMat);
      pole.position.y = groundH + height / 2;
      group.add(pole);

      for (let i = 0; i < 3; i++) {
        const bladeGeom = new THREE.BoxGeometry(0.05, 1.2, 0.15);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
        const blade = new THREE.Mesh(bladeGeom, bladeMat);
        blade.position.y = groundH + height;
        blade.rotation.z = (i * Math.PI * 2) / 3;
        group.add(blade);
      }
    }

    if (b.type === 'coal_plant') {
      const chimneyGeom = new THREE.CylinderGeometry(0.15, 0.2, 1.5, 8);
      const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x884444, roughness: 0.5 });
      const chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
      chimney.position.set(0.3, groundH + height + 0.75, 0.3);
      group.add(chimney);
      const chimney2 = new THREE.Mesh(chimneyGeom, chimneyMat);
      chimney2.position.set(-0.3, groundH + height + 0.75, -0.3);
      group.add(chimney2);
    }

    group.position.set(wx, 0, wz);
    buildingGroup.add(group);
    buildingMeshes[b.id] = group;
  }
}

export function showZoneOverlay(zoneType) {
  while (zoneOverlayGroup.children.length) zoneOverlayGroup.remove(zoneOverlayGroup.children[0]);

  if (!zoneType) return;

  const zoneMap = Grid.getZoneMap();
  const heightScale = MAX_HEIGHT * 5;
  const colorHex = ZONE_COLORS[zoneType] || 0xffffff;

  for (const [coords, type] of zoneMap) {
    const [gx, gy] = coords.split(',').map(Number);
    const cell = Grid.get(gx, gy);
    if (!cell || type !== zoneType) continue;

    const wx = (gx - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
    const wz = (gy - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
    const h = cell.height * heightScale + 0.05;

    const geom = new THREE.PlaneGeometry(0.9, 0.9);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(wx, h, wz);
    mesh.renderOrder = 999;
    zoneOverlayGroup.add(mesh);
  }
}

export function clearGhost() {
  while (ghostGroup.children.length) ghostGroup.remove(ghostGroup.children[0]);
}

export function showGhost(x, y, tool, color = 0xffff00) {
  clearGhost();
  if (!Grid.inBounds(x, y)) return;
  const wx = (x - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
  const wz = (y - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
  const cell = Grid.get(x, y);
  if (!cell) return;
  const h = cell.height * MAX_HEIGHT * 5 + 0.06;

  const geom = new THREE.PlaneGeometry(0.9, 0.9);
  geom.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.5,
    depthTest: false,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(wx, h, wz);
  mesh.renderOrder = 1000;
  ghostGroup.add(mesh);
}

export function showRoadGhost(cells, color = 0xffff00) {
  clearGhost();
  const heightScale = MAX_HEIGHT * 5;

  for (const { x, y } of cells) {
    if (!Grid.inBounds(x, y)) continue;
    const cell = Grid.get(x, y);
    if (!cell) continue;

    const wx = (x - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
    const wz = (y - GRID_SIZE / 2 + 0.5) * CELL_SIZE;
    const h = cell.height * heightScale + 0.06;

    const geom = new THREE.PlaneGeometry(0.9, 0.9);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(wx, h, wz);
    mesh.renderOrder = 1000;
    ghostGroup.add(mesh);
  }
}

export function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

export function render() {
  renderer.render(scene, camera);
}

export function getCamera() { return camera; }
export function getScene() { return scene; }
export function getRenderer() { return renderer; }
