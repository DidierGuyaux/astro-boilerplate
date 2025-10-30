// src/scenes/elephantScene.ts
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  TextureLoader,
  MeshPhysicalMaterial,
  EquirectangularReflectionMapping,
  DirectionalLight,
  SphereGeometry,
  MeshBasicMaterial,
  PointLight,
  ACESFilmicToneMapping,
  Vector2, // (not used now, kept if you expand)
  SRGBColorSpace,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { gsap } from 'gsap/dist/gsap';
import { $scroll } from '@scripts/stores/scroll.ts';
import type { IScrollValues } from '@scripts/stores/scroll.ts';

type SceneSubject = (
  canvas: HTMLElement,
  scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  gui: any
) => Promise<{ dispose?: () => void } | void>;

export const elephantScene: SceneSubject = async (canvas, scene, camera, renderer, gui) => {
  console.log('[elephantScene] START');
  // --- Renderer knobs (SceneManager already handles toneMapping; we only tweak exposure here if desired)
  // renderer.toneMapping = ACESFilmicToneMapping; // already set in SceneManager
  // inside elephantScene(...)
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0xffffff, 0);        // white, fully transparent
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.852;            // default like your file


  // --- Lights (keep minimal + pretty, like your snippet)
  const dir = new DirectionalLight(0xffffff, 2.0);
  dir.position.set(0.0, 0.5, 0.5).normalize();
  scene.add(dir);

  // Optional warm key & rim like your previous setups
  const warmBall = new Mesh(new SphereGeometry(4, 8, 8), new MeshBasicMaterial({ color: 0xf9b861 }));
  warmBall.add(new PointLight(0xc1c1c1, 120, 300, 80));
  warmBall.position.set(0, -50, 350);
  scene.add(warmBall);

  const rimBall = new Mesh(new SphereGeometry(4, 8, 8), new MeshBasicMaterial({ color: 0xef53d0 }));
  rimBall.add(new PointLight(0xc1c100, 10, 1500, 0));
  rimBall.position.set(-100, 20, -260);
  scene.add(rimBall);

  // --- Environment (RGBE) – your snippet sets scene.environment directly
  // Move assets to /public/assets/... and reference as /assets/...
  const hdrEquirect = await new RGBELoader().loadAsync('/src/assets/images/lzTT-empty_warehouse_01_2k.hdr');
  hdrEquirect.mapping = EquirectangularReflectionMapping;
  scene.environment = hdrEquirect;

  // --- Load textures
  const texLoader = new TextureLoader();
  // Use /assets/... (never prefix with "public/")
  const thicknessMap    = texLoader.load('/assets/images/Thickness_map_2.jpg');
  const emissiveMapClamp= texLoader.load('/assets/images/Thickness_map_color_clamped_contrast1.jpg');
  const emissiveMap2x   = texLoader.load('/assets/images/Thickness_map_color_2x.jpg');
  // const normalMap     = texLoader.load('/assets/images/normal.jpg'); // if you want it later

  // Three r152+ uses colorSpace
  thicknessMap.colorSpace     = SRGBColorSpace;
  emissiveMapClamp.colorSpace = SRGBColorSpace;
  emissiveMap2x.colorSpace    = SRGBColorSpace;

  // GLTF
  const gltf = await new GLTFLoader().loadAsync('/assets/3d/elephant_marbled-metal_2x_contrast2.glb');

  const elephtexture = new TextureLoader().load('public/assets/images/Thickness_map_2.jpg');
        elephtexture.flipY = false;

        const elephtexture2 = new TextureLoader().load(
            'public/assets/images/Thickness_map_color_clamped_contrast1.jpg'
        );
        elephtexture2.flipY = false;

        const elephtexture3 = new TextureLoader().load(
            'public/assets/images/Thickness_map_color_2x.jpg'
        );
        elephtexture3.flipY = false;
 
  // Material cloned from your snippet (with envMap from scene HDR)
  const mat = new MeshPhysicalMaterial({
    color: 0x7a9ad9,
    metalness: 0.535,
    roughness: 0.289,
    transmission: 0,
    iridescence: 1.395,
    iridescenceIOR: 1.15,
    ior: 1,
    reflectivity: 0.5349,
    envMap: hdrEquirect,
    envMapIntensity: 0.535,
    clearcoat: 1.027,
    clearcoatRoughness: 0,
    transparent: true,
    emissive: 0xffffff,
    emissiveMap: elephtexture3,
    emissiveIntensity: 1.5,
    map: elephtexture
  });

  // Find named mesh and rebuild as a single Mesh like your snippet
  const namedChild = gltf.scene.children.find((c: any) => c.name === 'elephant_Low_Poly') as any;
  let mesh: Mesh | null = null;
  if (namedChild?.geometry) {
    const geo = namedChild.geometry.clone();
    mesh = new Mesh(geo, mat);
  } else {
    // Fallback: apply material to all meshes in the scene
    gltf.scene.traverse((o: any) => { if (o.isMesh) o.material = mat; });
    mesh = (gltf.scene as unknown) as Mesh;
  }

  // Add and position like your snippet
  if (mesh) {
    mesh.scale.setScalar(0.07);
    scene.add(mesh);
    camera.lookAt(mesh.position.x + 2, mesh.position.y + 0, mesh.position.z);
    camera.fov = 80 - (window.innerWidth / 2000) * 30;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    
        renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Camera FOV mapping from your snippet (90 - (w/2000)*30)
  const w = window.innerWidth;
  camera.fov = Math.max(20, Math.min(100, 90 - (w / 2000) * 30));
  camera.aspect = (renderer.domElement.clientWidth || w) / (renderer.domElement.clientHeight || window.innerHeight);
  camera.updateProjectionMatrix();

  // GUI controls similar to your file
  const mFolder = gui?.addFolder?.('Material');
  mFolder?.add(mat, 'metalness', 0, 10, 0.001);
  mFolder?.add(mat, 'roughness', 0, 10, 0.001);
  mFolder?.add(mat, 'transmission', 0, 10, 0.001);
  mFolder?.add(mat, 'iridescence', 0, 10, 0.001);
  mFolder?.add(mat, 'iridescenceIOR', 0, 10, 0.001);
  mFolder?.add(mat, 'ior', 0, 10, 0.001);
  mFolder?.add(mat, 'reflectivity', 0, 10, 0.001);
  mFolder?.add(mat, 'envMapIntensity', 0, 10, 0.001);
  mFolder?.add(mat, 'clearcoat', 0, 10, 0.001);
  mFolder?.add(mat, 'clearcoatRoughness', 0, 10, 0.001);

  const camFolder = gui?.addFolder?.('Camera');
  camFolder?.add(camera.position, 'x', -10, 10, 0.001);
  camFolder?.add(camera.position, 'y', -10, 10, 0.001);
  camFolder?.add(camera.position, 'z', -10, 10, 0.001);
  camFolder?.add(camera.rotation, 'x', -Math.PI, Math.PI, 0.001);
  camFolder?.add(camera.rotation, 'y', -Math.PI, Math.PI, 0.001);
  camFolder?.add(camera.rotation, 'z', -Math.PI, Math.PI, 0.001);

  // --- Intro + scroll scrub (no composer; SceneManager renders the frame loop)
  canvas.style.opacity = '0';

  const tlIntro = gsap.timeline({ paused: false, ease: 'Power4.inOut', duration: 10 });
  const tlMaster = gsap.timeline({ paused: true });

  tlIntro
    .add('position', 0)
    .add('opacity', 0)
    .add('rotation', 2)
    .add('depart', 2)
    .add('departScale', 2)
    .add('departPos', 2)
    .to(mesh!.position, { duration: 1.5, y: -1.7, z: -0.2, ease: 'back.out' }, 'position')
    .to(canvas, { duration: 2, autoAlpha: 1, opacity: 1 }, '<')
    .to(mesh!.rotation as any, { duration: 2.7, y: 2, x: -0.8, z: -0.1, ease: 'circ.out' }, '<');

  tlMaster
    .to(mesh!.rotation as any, { y: -1.5, x: 0, z: 0, duration: 6, ease: 'sine.out' }, '>', 'depart')
    .to(mesh!.scale as any, { x: 0.13, y: 0.13, z: 0.13, duration: 4, ease: 'back.out' }, '<', 'departScale')
    .to(mesh!.position as any, { y: -10, x: 3, duration: 4, ease: 'sine.out' }, '<', 'departPos');

  let unlisten: (() => void) | undefined;
  try {
    const maybeUnsub = $scroll.listen(({ progress }: IScrollValues) => {
      tlMaster.seek(progress * 20);
    });
    if (typeof maybeUnsub === 'function') unlisten = maybeUnsub;
  } catch { /* noop */ }

  // --- Return disposer so SceneManager can cleanly swap scenes
  return {
    dispose() {
      unlisten?.();

      // remove objects
      scene.remove(dir, warmBall, rimBall);
      if (mesh) scene.remove(mesh);

      // dispose mesh geo + materials + textures
      if (mesh) {
        (mesh as any).traverse?.((o: any) => {
          if (o.isMesh) {
            o.geometry?.dispose?.();
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m: any) => {
              for (const k in m) {
                const v = m[k];
                if (v && v.isTexture) v.dispose?.();
              }
              m.dispose?.();
            });
          }
        });
        if ((mesh as any).geometry) (mesh as any).geometry.dispose?.();
        const m = (mesh as any).material;
        (Array.isArray(m) ? m : [m]).forEach((mm: any) => mm?.dispose?.());
      }

      thicknessMap.dispose();
      emissiveMapClamp.dispose();
      emissiveMap2x.dispose();
      // normalMap?.dispose?.();

      hdrEquirect.dispose();
    }
  };
};
