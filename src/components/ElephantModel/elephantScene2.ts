// src/scenes/elephantScene.ts
import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Mesh,
    Color,
    TextureLoader,
    EquirectangularReflectionMapping,
    DirectionalLight,
    SphereGeometry,
    MeshBasicMaterial,
    PointLight,
    LinearFilter,
    ACESFilmicToneMapping,
    CanvasTexture,
    SRGBColorSpace,
    Group
  } from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
  import { gsap } from 'gsap/dist/gsap';
  import { $scroll } from '@scripts/stores/scroll';
  import type { ScrollValues } from '@scripts/stores/scroll';
  import html2canvas from 'html2canvas';
  
  // 👇 import your custom refraction material
  import { makeRefractMaterial } from '/src/components/ElephantModel/RefractMat.ts';
  
  type SceneSubject = (
    canvas: HTMLElement,
    scene: Scene,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    gui: any
  ) => Promise<{ dispose?: () => void; snapPage?: () => void } | void>;
  
  export const elephantScene: SceneSubject = async (canvas, scene, camera, renderer, gui) => {
    let pageCanvas: HTMLCanvasElement | null = null;
    let pageTex: CanvasTexture | null = null;
    let elephantGroup: Group | Mesh | null = null;
    let refractMat: ReturnType<typeof makeRefractMaterial> | null = null;
  
    // ---- SNAPSHOT (viewport-only) → hidden CanvasTexture (NOT scene.background)
    async function snapPageToTexture() {
      renderer.domElement.style.visibility = 'hidden';
  
      const w = window.innerWidth;
      const h = window.innerHeight;
  
      pageCanvas = await html2canvas(document.body, {
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
        x: window.scrollX,
        y: window.scrollY,
        width: w,
        height: h,
        scale: Math.min(window.devicePixelRatio, 2)
      });
  
      renderer.domElement.style.visibility = '';
  
      // Keep the snapshot completely hidden from layout/paint
      Object.assign(pageCanvas.style, {
        position: 'fixed',
        top: '0px',
        left: '0px',
        opacity: '0',
        display: 'none',
        pointerEvents: 'none',
        zIndex: '-9999'
      } as CSSStyleDeclaration);
  
      if (!pageTex) {
        pageTex = new CanvasTexture(pageCanvas);
        pageTex.colorSpace = SRGBColorSpace;
        pageTex.minFilter = LinearFilter;
        pageTex.magFilter = LinearFilter;
        pageTex.generateMipmaps = false;
      } else {
        pageTex.image = pageCanvas;
        pageTex.needsUpdate = true;
      }
  
      // Feed the shader (if already created)
      if (refractMat) {
        const rw = renderer.domElement.clientWidth || w;
        const rh = renderer.domElement.clientHeight || h;
        refractMat.uniforms.tBackdrop.value = pageTex;
        refractMat.setResolution(rw, rh);
      }
  
      // Remove from DOM tree
      pageCanvas.remove();
    }
  
    // Optional: small delay if your page is still animating in
    await snapPageToTexture();
  
    console.log('[elephantScene] START');
  
    // ---- Renderer knobs
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0xffffff, 0); // transparent canvas
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.852;
  
    // ---- Lights
    const dir = new DirectionalLight(0xffffff, 2.0);
    dir.position.set(0.0, 0.5, 0.5).normalize();
    scene.add(dir);
  
    const warmBall = new Mesh(new SphereGeometry(4, 8, 8), new MeshBasicMaterial({ color: 0xf9b861 }));
    warmBall.add(new PointLight(0xc1c1c1, 120, 300, 80));
    warmBall.position.set(0, -50, 350);
    scene.add(warmBall);
  
    const rimBall = new Mesh(new SphereGeometry(4, 8, 8), new MeshBasicMaterial({ color: 0xef53d0 }));
    rimBall.add(new PointLight(0xc1c100, 10, 1500, 0));
    rimBall.position.set(-100, 20, -260);
    scene.add(rimBall);
  
    // ---- Environment (for subtle reflections; refraction comes from pageTex)
    const hdrEquirect = await new RGBELoader().loadAsync('/src/assets/images/lzTT-empty_warehouse_01_2k.hdr');
    hdrEquirect.mapping = EquirectangularReflectionMapping;
    scene.environment = hdrEquirect;
  
    // ---- GLTF
    const gltf = await new GLTFLoader().loadAsync('/assets/3d/elephant_marbled-metal_2x_contrast2.glb');
  
    // Build refraction material now that we have pageTex
    // (If pageTex is null for any reason, make a 1x1 empty so shader has a sampler)
    if (!pageTex) {
      const dummy = document.createElement('canvas');
      dummy.width = dummy.height = 1;
      pageTex = new CanvasTexture(dummy);
      pageTex.colorSpace = SRGBColorSpace;
    }
    refractMat = makeRefractMaterial(pageTex);
    refractMat.setResolution(
      renderer.domElement.clientWidth || window.innerWidth,
      renderer.domElement.clientHeight || window.innerHeight
    );
  
    // Find the elephant mesh and apply the custom shader
    const namedChild = gltf.scene.children.find((c: any) => c.name === 'elephant_Low_Poly') as any;
    let mesh: Mesh | null = null;
  
    if (namedChild?.geometry) {
      mesh = new Mesh(namedChild.geometry.clone(), refractMat);
      elephantGroup = mesh;
    } else {
      gltf.scene.traverse((o: any) => {
        if (o.isMesh) o.material = refractMat!;
      });
      mesh = gltf.scene as unknown as Mesh;
      elephantGroup = mesh;
    }
  
    // Add + position
    if (mesh) {
      mesh.scale.setScalar(0.07);
      scene.add(mesh);
      camera.lookAt(mesh.position.x + 2, mesh.position.y + 0, mesh.position.z);
  
      const w = window.innerWidth;
      camera.fov = Math.max(20, Math.min(100, 90 - (w / 2000) * 30));
      camera.aspect =
        (renderer.domElement.clientWidth || w) /
        (renderer.domElement.clientHeight || window.innerHeight);
      camera.updateProjectionMatrix();
  
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
  
    // ---- GSAP intro + scroll scrub (unchanged)
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
      .to(elephantGroup!.position, { duration: 1.5, y: -1.7, z: -0.2, ease: 'back.out' }, 'position')
      .to(canvas, { duration: 2, autoAlpha: 1, opacity: 1 }, '<')
      .to(elephantGroup!.rotation as any, { duration: 2.7, y: 2, x: -0.8, z: -0.1, ease: 'circ.out' }, '<');
  
    tlMaster
      .to(elephantGroup!.rotation as any, { y: -1.5, x: 0, z: 0, duration: 6, ease: 'sine.out' }, '>', 'depart')
      .to(elephantGroup!.scale as any, { x: 0.13, y: 0.13, z: 0.13, duration: 4, ease: 'back.out' }, '<', 'departScale')
      .to(elephantGroup!.position as any, { y: -10, x: 3, duration: 4, ease: 'sine.out' }, '<', 'departPos');
  
    let unlisten: (() => void) | undefined;
    try {
      const maybeUnsub = $scroll.listen(({ progress }: ScrollValues) => {
        tlMaster.seek(progress * 20);
      });
      if (typeof maybeUnsub === 'function') unlisten = maybeUnsub;
    } catch {}
  
    // ---- Keep the screenshot texture fresh (cheap)
    const updateRender = () => {
      if (pageTex) pageTex.needsUpdate = true;
    };
    gsap.ticker.add(updateRender);
  
    // ---- Resize: keep camera + shader resolution in sync
    const onResize = () => {
      const rw = renderer.domElement.clientWidth || window.innerWidth;
      const rh = renderer.domElement.clientHeight || window.innerHeight;
      if (refractMat) refractMat.setResolution(rw, rh);
  
      const w = window.innerWidth;
      camera.fov = Math.max(20, Math.min(100, 90 - (w / 2000) * 30));
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh, false);
    };
    window.addEventListener('resize', onResize);
  
    return {
      // let Transitions / Swup call this whenever layout changes
      snapPage: snapPageToTexture,
  
      dispose() {
        unlisten?.();
        gsap.ticker.remove(updateRender);
        window.removeEventListener('resize', onResize);
  
        scene.remove(dir, warmBall, rimBall);
        if (elephantGroup) scene.remove(elephantGroup);
  
        // Dispose materials/geometries/textures
        elephantGroup && (elephantGroup as any).traverse?.((o: any) => {
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
  
        hdrEquirect.dispose();
        pageTex?.dispose();
      }
    };
  };
  