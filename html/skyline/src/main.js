import * as THREE from 'three';
import { GRID_SIZE, CELL_SIZE, MAP_HALF, WATER_LEVEL, MAX_HEIGHT, STARTING_MONEY, BUILDING_DEFS, ZONE_COLORS } from './config.js';
import { EventBus } from './engine.js';
import { Grid } from './grid.js';
import { generateHeightmap } from './terrain.js';
import { RoadTool } from './roads.js';
import * as Buildings from './buildings.js';
import * as Sim from './simulation.js';
import * as Renderer from './renderer.js';
import { initUI, getCurrentTool, showInfoPanel } from './ui.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let dragStartCell = null;
let dragEndCell = null;
let lastHoverCell = null;
let roadPreviewCells = [];
let isBuildingRoad = false;
let isPaintingZone = false;
let isPanning = false;
let isRotating = false;
let middleMouseDown = false;
let prevMouse = { x: 0, y: 0 };
let rotationStart = { x: 0, y: 0 };
let cameraStartAngle = { theta: 0, phi: 0 };
let clock;

function init() {
  clock = new THREE.Clock();
  Grid.init();
  const heights = generateHeightmap();
  Grid.setHeightmap(heights);

  const { camera } = Renderer.initRenderer(document.getElementById('game-container'));

  Renderer.buildTerrain();
  Renderer.buildWater();
  Renderer.buildGridOverlay();

  Sim.initSimulation(STARTING_MONEY);

  initUI();

  setupInput();

  EventBus.on('grid-changed', () => {
    Renderer.rebuildRoads();
    Renderer.rebuildBuildings();
    const tool = getCurrentTool();
    if (tool && tool.type === 'zone') {
      Renderer.showZoneOverlay(tool.subtype);
    }
  });

  EventBus.on('tool-changed', (tool) => {
    if (tool.type === 'zone') {
      Renderer.showZoneOverlay(tool.subtype);
    } else {
      Renderer.showZoneOverlay(null);
      Renderer.clearGhost();
    }
  });

  EventBus.on('road-placed', ({ cost }) => {
    if (cost) Sim.spendMoney(cost);
  });

  EventBus.on('building-placed', ({ cost }) => {
    if (cost) Sim.spendMoney(cost);
  });

  const ch = Math.floor(GRID_SIZE / 2);
  for (let y = ch - 5; y <= ch + 5; y++) {
    if (Grid.inBounds(ch - 8, y) && Grid.inUnlocked(ch - 8, y)) {
      Grid.setRoad(ch - 8, y, 'road_highway', 1);
    }
  }
  for (let x = ch - 8; x <= ch + 25; x++) {
    if (Grid.inBounds(x, ch) && Grid.inUnlocked(x, ch)) {
      Grid.setRoad(x, ch, 'road_basic', 0);
    }
  }
  Buildings.placeServiceBuilding('wind_turbine', ch + 3, ch - 2);
  Renderer.rebuildRoads();
  Renderer.rebuildBuildings();

  EventBus.emit('notification', '\u{1F3D7} 欢迎！先画道路，再画分区，然后放置电厂...');

  gameLoop();
}

function setupInput() {
  const canvas = Renderer.getRenderer().domElement;

  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel);
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      isBuildingRoad = false;
      isPaintingZone = false;
      Renderer.clearGhost();
    }
  });

  window.addEventListener('keydown', (e) => {
    const speed = 0.8;
    const cam = Renderer.getCamera();
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();

    switch (e.key) {
      case 'w': case 'W': cam.position.addScaledVector(dir, speed); break;
      case 's': case 'S': cam.position.addScaledVector(dir, -speed); break;
      case 'a': case 'A': cam.position.addScaledVector(right, -speed); break;
      case 'd': case 'D': cam.position.addScaledVector(right, speed); break;
      case 'q': case 'Q': cam.position.y += speed; break;
      case 'e': case 'E': cam.position.y -= speed; break;
    }
  });
}

function onMouseDown(event) {
  if (event.button === 1) {
    middleMouseDown = true;
    prevMouse = { x: event.clientX, y: event.clientY };
    return;
  }
  if (event.button === 2) {
    isRotating = true;
    rotationStart = { x: event.clientX, y: event.clientY };
    const cam = Renderer.getCamera();
    const pos = cam.position;
    cameraStartAngle = {
      theta: Math.atan2(pos.x, pos.z),
      phi: Math.acos(pos.y / Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)),
    };
    return;
  }

  const intersect = raycastTerrain(event);
  if (!intersect) return;

  const cell = worldToCell(intersect.point.x, intersect.point.z);
  if (!cell || !Grid.inUnlocked(cell.x, cell.y)) return;

  const tool = getCurrentTool();

  if (tool.type === 'road') {
    isBuildingRoad = true;
    dragStartCell = cell;
    dragEndCell = cell;
    roadPreviewCells = [cell];
    Renderer.showRoadGhost(roadPreviewCells, 0xffff00);
  } else if (tool.type === 'zone') {
    if (tool.subtype === 'dezone') {
      applyZone(cell.x, cell.y, 0);
      Grid.setZone(cell.x, cell.y, 0);
      isPaintingZone = false;
      Renderer.rebuildBuildings();
      EventBus.emit('grid-changed');
      return;
    }
    const zoneType = tool.subtype;
    if (zoneType && zoneType !== 'dezone') {
      isPaintingZone = true;
      lastHoverCell = cell;
      applyZone(cell.x, cell.y, zoneType);
    }
  } else if (tool.type === 'power' || tool.type === 'water' || tool.type === 'service') {
    const subtype = tool.subtype;
    if (subtype) {
      placePlopBuilding(cell.x, cell.y, subtype);
    }
  }
}

function onMouseMove(event) {
  if (isRotating) {
    const dx = event.clientX - rotationStart.x;
    const dy = event.clientY - rotationStart.y;
    const cam = Renderer.getCamera();
    const dist = Math.sqrt(
      cam.position.x * cam.position.x +
      cam.position.y * cam.position.y +
      cam.position.z * cam.position.z
    );
    let theta = cameraStartAngle.theta - dx * 0.005;
    let phi = cameraStartAngle.phi - dy * 0.005;
    phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, phi));
    cam.position.x = dist * Math.sin(phi) * Math.cos(theta);
    cam.position.z = dist * Math.sin(phi) * Math.sin(theta);
    cam.position.y = dist * Math.cos(phi);
    return;
  }

  if (middleMouseDown) {
    const dx = event.clientX - prevMouse.x;
    const dy = event.clientY - prevMouse.y;
    const cam = Renderer.getCamera();
    cam.position.x -= dx * 0.05;
    cam.position.z -= dy * 0.05;
    prevMouse = { x: event.clientX, y: event.clientY };
    return;
  }

  const intersect = raycastTerrain(event);
  if (!intersect) return;
  const cell = worldToCell(intersect.point.x, intersect.point.z);

  if (isBuildingRoad && cell) {
    dragEndCell = cell;
    roadPreviewCells = RoadTool.placeLine(
      dragStartCell.x, dragStartCell.y,
      dragEndCell.x, dragEndCell.y
    );
    Renderer.showRoadGhost(roadPreviewCells, 0xffff00);
  } else if (isPaintingZone && cell && cell !== lastHoverCell) {
    lastHoverCell = cell;
    const tool = getCurrentTool();
    applyZone(cell.x, cell.y, tool.subtype);
  } else if (!isBuildingRoad && !isPaintingZone) {
    if (cell) {
      const tool = getCurrentTool();
      if (tool.type === 'road') {
        Renderer.showGhost(cell.x, cell.y, 'road', 0xaaaaaa);
      } else if (tool.type === 'power' || tool.type === 'water' || tool.type === 'service') {
        Renderer.showGhost(cell.x, cell.y, 'building', 0xaaaaaa);
      } else {
        Renderer.clearGhost();
      }
    }
    const gridCell = Grid.get(cell.x, cell.y);
    if (gridCell && gridCell.buildingId) {
      const b = Buildings.getBuilding(gridCell.buildingId);
      if (b) showInfoPanel(b);
    } else {
      showInfoPanel(null);
    }
  }
}

function onMouseUp(event) {
  if (event.button === 1) {
    middleMouseDown = false;
    return;
  }
  if (event.button === 2) {
    isRotating = false;
    return;
  }

  if (isBuildingRoad) {
    isBuildingRoad = false;
    if (dragStartCell && dragEndCell) {
      const cost = RoadTool.getCostPerCell() * roadPreviewCells.length;
      if (Sim.getMoney() >= cost) {
        RoadTool.placeSegment(
          dragStartCell.x, dragStartCell.y,
          dragEndCell.x, dragEndCell.y
        );
      }
    }
    Renderer.clearGhost();
    roadPreviewCells = [];
    dragStartCell = null;
    dragEndCell = null;
  }

  if (isPaintingZone) {
    isPaintingZone = false;
  }
}

function onWheel(event) {
  const cam = Renderer.getCamera();
  cam.position.y += event.deltaY * 0.05;
  cam.position.y = Math.max(5, Math.min(120, cam.position.y));
}

function applyZone(x, y, type) {
  const cell = Grid.get(x, y);
  if (!cell || cell.hasRoad || cell.isWater) return;
  if (!Grid.isAdjacentToRoad(x, y)) return;
  if (type === 0 || type === 'dezone') {
    Grid.setZone(x, y, 0);
  } else {
    Grid.setZone(x, y, type);
  }
  const tool = getCurrentTool();
  Renderer.showZoneOverlay(tool.type === 'zone' ? tool.subtype : null);
}

function placePlopBuilding(x, y, defKey) {
  const def = BUILDING_DEFS[defKey];
  if (!def) return;

  if (Sim.getMoney() < def.cost) {
    EventBus.emit('notification', `\u{1F4B8} 资金不足，需要 $${def.cost}`);
    return;
  }

  const cell = Grid.get(x, y);

  if (def.category === 'water' && !cell.isWater) {
    EventBus.emit('notification', '\u26A0 水设施必须放置在水体上');
    return;
  }

  if (def.category !== 'water' && !Grid.isAdjacentToRoad(x, y, 2)) {
    EventBus.emit('notification', '\u26A0 建筑必须靠近道路');
    return;
  }

  const id = Buildings.placeServiceBuilding(defKey, x, y);
  if (id) {
    Sim.spendMoney(def.cost);
    EventBus.emit('notification', `\u2705 ${def.name} 建造完成`);
  } else {
    EventBus.emit('notification', '\u26A0 无法在此处放置建筑');
  }
}

function raycastTerrain(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, Renderer.getCamera());

  const scene = Renderer.getScene();
  const terrain = scene.getObjectByName('terrain');
  const water = scene.getObjectByName('water');

  const targets = [];
  if (terrain) targets.push(terrain);
  if (water) targets.push(water);

  const intersects = raycaster.intersectObjects(targets, false);
  return intersects[0] || null;
}

function worldToCell(wx, wz) {
  const x = Math.round(wx + MAP_HALF);
  const y = Math.round(wz + MAP_HALF);
  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
    return { x, y };
  }
  return null;
}

function gameLoop() {
  requestAnimationFrame(gameLoop);

  const delta = clock.getDelta();

  Sim.tick(delta * 1000);

  Renderer.render();

  if (Renderer.getCamera().position.x > MAP_HALF) Renderer.getCamera().position.x = MAP_HALF;
  if (Renderer.getCamera().position.x < -MAP_HALF) Renderer.getCamera().position.x = -MAP_HALF;
  if (Renderer.getCamera().position.z > MAP_HALF) Renderer.getCamera().position.z = MAP_HALF;
  if (Renderer.getCamera().position.z < -MAP_HALF) Renderer.getCamera().position.z = -MAP_HALF;
}

init();
