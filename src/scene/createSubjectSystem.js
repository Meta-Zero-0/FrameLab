import { Group, Mesh, BoxGeometry, SphereGeometry, CylinderGeometry, MeshStandardMaterial, Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createSubjectSystem(root) {
  let model = root.children[0], kind = 'cube', region = 'full', imported = null;
  let head, shoulders, importedFile = null;
  const material = new MeshStandardMaterial({ color: '#c1784d', roughness: 0.65 });
  function part(group, geometry, position, scale = [1, 1, 1]) {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...position); mesh.scale.set(...scale); group.add(mesh); return mesh;
  }
  function build(type, pose) {
    const group = new Group(); head = shoulders = null;
    if (type === 'cube') part(group, new BoxGeometry(1, 1, 1), [0, .5, 0]);
    if (type === 'product') {
      part(group, new CylinderGeometry(.10, .12, .30, 48), [0, .15, 0]);
      part(group, new CylinderGeometry(.055, .10, .07, 48), [0, .335, 0]);
      part(group, new CylinderGeometry(.055, .055, .06, 48), [0, .40, 0]);
    }
    if (type === 'human') {
      const seated = pose === 'seated', offset = seated ? -.43 : 0;
      shoulders = new Group(); group.add(shoulders);
      part(shoulders, new SphereGeometry(1, 32, 20), [0, 1.32 + offset, 0], [.25, .30, .14]);
      part(shoulders, new CylinderGeometry(.065, .07, .12, 24), [0, 1.60 + offset, 0]);
      head = new Group(); shoulders.add(head);
      part(head, new SphereGeometry(1, 32, 24), [0, 1.76 + offset, 0], [.105, .14, .11]);
      part(head, new SphereGeometry(1, 16, 12), [0, 1.75 + offset, .115], [.025, .035, .035]);
      part(group, new SphereGeometry(1, 24, 16), [0, 1.02 + offset, 0], [.20, .16, .13]);
      function limb(a, b, radius) {
        const start = new Vector3(...a), end = new Vector3(...b);
        const mesh = part(group, new CylinderGeometry(radius, radius * .85, start.distanceTo(end), 20), start.clone().add(end).multiplyScalar(.5).toArray());
        mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), end.sub(start).normalize());
      }
      for (const side of [-1, 1]) {
        const armOut = pose === 'arms-out';
        limb([side * .22, 1.45 + offset, 0], [side * (armOut ? .80 : .31), (armOut ? 1.45 : .91) + offset, 0], .065);
        const hip = [side * .11, .99 + offset, 0];
        const knee = [side * .11, .52, seated ? .43 : 0];
        limb(hip, knee, .09); limb(knee, [side * .11, .10, seated ? .43 : 0], .065);
        part(group, new BoxGeometry(.14, .10, .25), [side * .11, .05, seated ? .49 : .06]);
      }
    }
    return group;
  }
  function dispose(object) {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    object.traverse(node => { if (node.geometry) geometries.add(node.geometry); for (const mat of Array.isArray(node.material) ? node.material : node.material ? [node.material] : []) { if (mat !== material) materials.add(mat); } });
    for (const mat of materials) { for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value); mat.dispose(); }
    for (const texture of textures) { texture.dispose(); texture.source?.data?.close?.(); }
    for (const geometry of geometries) geometry.dispose();
  }
  function select(type, pose = 'standing') {
    if (type === 'import' && !imported) return;
    if (model && model !== imported) dispose(model);
    root.clear(); kind = type;
    model = type === 'import' ? imported : build(type, pose);
    root.add(model); root.position.set(0, 0, 0); root.rotation.set(0, 0, 0); root.scale.setScalar(1);
    model.traverse(node => { if (node.isMesh) node.castShadow = node.receiveShadow = true; });
  }
  function bounds() {
    root.updateWorldMatrix(true, true);
    const box = new Box3().setFromObject(kind === 'human' && region !== 'full' ? (region === 'head' ? head : shoulders) : root);
    if (kind === 'human' && region === 'shoulders') box.min.y = new Box3().setFromObject(head).min.y - .23 * root.scale.y;
    return box;
  }
  function setRegion(value) { region = value; }
  function place(height, x, z, yaw) {
    root.scale.setScalar(1); root.rotation.y = 0; root.updateWorldMatrix(true, true);
    const box = new Box3().setFromObject(model), size = box.getSize(new Vector3());
    root.scale.setScalar(height / size.y); root.position.set(x, 0, z); root.rotation.y = yaw * Math.PI / 180;
  }
  async function importFile(file) {
    if (file.size > 50 * 1024 * 1024) throw new Error('Choose a GLB smaller than 50 MB.');
    const data = await file.arrayBuffer(), view = new DataView(data);
    if (data.byteLength < 20 || view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2 || view.getUint32(8, true) !== data.byteLength || view.getUint32(16, true) !== 0x4e4f534a) throw new Error('This is not a valid GLB 2 file.');
    const json = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 20, view.getUint32(12, true))));
    if ([...(json.buffers || []), ...(json.images || [])].some(item => item.uri && !item.uri.startsWith('data:'))) throw new Error('Export a self-contained GLB with embedded textures.');
    if ([...(json.extensionsUsed || []), ...(json.extensionsRequired || [])].some(name => /draco|meshopt|basisu/i.test(name))) throw new Error('Export without Draco, Meshopt or KTX2 compression for this importer.');
    const result = await new GLTFLoader().parseAsync(data, '');
    const next = new Group(); next.add(result.scene);
    const remove = []; next.traverse(node => { if (node.isCamera || node.isLight) remove.push(node); }); remove.forEach(node => node.removeFromParent());
    const box = new Box3().setFromObject(next), size = box.getSize(new Vector3());
    if (box.isEmpty() || ![size.x, size.y, size.z].every(Number.isFinite) || size.y <= 0) { dispose(next); throw new Error('The model needs visible geometry with a non-zero height.'); }
    const center = box.getCenter(new Vector3()); result.scene.position.sub(new Vector3(center.x, box.min.y, center.z));
    if (imported) { imported.removeFromParent(); dispose(imported); }
    if (model === imported) model = null;
    imported = next; importedFile = file; select('import');
    return size.y;
  }
  return { getImportedFile: () => importedFile, select, bounds, setRegion, place, importFile, height: () => new Box3().setFromObject(root).getSize(new Vector3()).y };
}


