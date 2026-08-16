// viewer.js — lightweight 3D IFC viewer (Three.js). Renders geometry extracted by web-ifc,
// highlights failing elements red, and supports click-to-pick / focus. Self-hosted, no CDN.
import * as THREE from "three";
import { OrbitControls } from "../vendor/three/OrbitControls.js";

const DEFAULT_COLOR = 0x9aa7bd;
const FAIL_COLOR = 0xff5252;

let scene, camera, renderer, controls, root, raycaster, pointer, container;
const meshesById = new Map(); // expressID -> [THREE.Mesh]
let onPickCb = null;
let running = false;

export function initViewer(el) {
  container = el;
  const w = container.clientWidth || 640;
  const h = container.clientHeight || 420;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1420);

  camera = new THREE.PerspectiveCamera(55, w / h, 0.01, 100000);
  camera.position.set(10, 10, 10);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.innerHTML = "";
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const d1 = new THREE.DirectionalLight(0xffffff, 0.8); d1.position.set(1, 2, 1);
  const d2 = new THREE.DirectionalLight(0xffffff, 0.4); d2.position.set(-1, 1, -2);
  scene.add(d1, d2);

  root = new THREE.Group();
  root.rotation.x = -Math.PI / 2; // IFC is Z-up; Three.js is Y-up
  scene.add(root);

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("resize", onResize);

  if (!running) { running = true; animate(); }
}

function onResize() {
  if (!container || !renderer) return;
  const w = container.clientWidth, h = container.clientHeight;
  if (!w || !h) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

export function loadModel(geometry) {
  for (const meshes of meshesById.values()) {
    meshes.forEach((m) => { root.remove(m); m.geometry.dispose(); m.material.dispose(); });
  }
  meshesById.clear();
  while (root.children.length) root.remove(root.children[0]);

  for (const g of geometry) {
    const n = g.vertexData.length / 6;
    const pos = new Float32Array(n * 3);
    const nor = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = g.vertexData[i * 6];
      pos[i * 3 + 1] = g.vertexData[i * 6 + 1];
      pos[i * 3 + 2] = g.vertexData[i * 6 + 2];
      nor[i * 3] = g.vertexData[i * 6 + 3];
      nor[i * 3 + 1] = g.vertexData[i * 6 + 4];
      nor[i * 3 + 2] = g.vertexData[i * 6 + 5];
    }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    bg.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    bg.setIndex(new THREE.BufferAttribute(g.indexData, 1));

    const transparent = g.color.w < 0.999;
    const mat = new THREE.MeshLambertMaterial({
      color: new THREE.Color(DEFAULT_COLOR),
      transparent,
      opacity: transparent ? g.color.w : 1,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(bg, mat);
    mesh.applyMatrix4(new THREE.Matrix4().fromArray(g.matrix));
    mesh.userData.expressID = g.expressID;
    mesh.userData.baseOpacity = mat.opacity;
    root.add(mesh);
    if (!meshesById.has(g.expressID)) meshesById.set(g.expressID, []);
    meshesById.get(g.expressID).push(mesh);
  }
  fitCamera();
}

function fitCamera() {
  const box = new THREE.Box3().setFromObject(root);
  if (box.isEmpty()) return;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const r = Math.max(sphere.radius, 0.5);
  const fov = (camera.fov * Math.PI) / 180;
  const dist = (r / Math.sin(fov / 2)) * 1.15;
  const dir = new THREE.Vector3(1, 0.6, 1).normalize();
  camera.near = r / 100;
  camera.far = r * 100;
  camera.position.copy(sphere.center).addScaledVector(dir, dist);
  camera.updateProjectionMatrix();
  controls.target.copy(sphere.center);
  controls.update();
}

export function highlightFailing(expressIDs) {
  const failSet = new Set(expressIDs);
  for (const [id, meshes] of meshesById) {
    const fail = failSet.has(id);
    meshes.forEach((m) => {
      m.material.color.set(fail ? FAIL_COLOR : DEFAULT_COLOR);
      m.material.opacity = fail ? 1 : m.userData.baseOpacity;
      m.material.transparent = m.material.opacity < 0.999;
      m.userData.failing = fail;
    });
  }
}

export function focusElement(expressID) {
  const meshes = meshesById.get(expressID);
  if (!meshes || !meshes.length) return;
  const box = new THREE.Box3();
  meshes.forEach((m) => box.expandByObject(m));
  if (box.isEmpty()) return;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 1);
  const dir = new THREE.Vector3(1, 0.85, 1).normalize();
  controls.target.copy(center);
  camera.position.copy(center).addScaledVector(dir, maxDim * 4 + 2);
  controls.update();
  meshes.forEach((m) => m.material.emissive.set(0x3399ff));
  setTimeout(() => meshes.forEach((m) => m.material.emissive.set(0x000000)), 1000);
}

export function onPick(cb) { onPickCb = cb; }

function onPointerDown(ev) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(root.children, false);
  if (hits.length && onPickCb) {
    const id = hits[0].object.userData.expressID;
    if (id !== undefined) onPickCb(id);
  }
}
