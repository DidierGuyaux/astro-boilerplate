// src/sceneManager.ts
import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    NoToneMapping,
    LinearToneMapping,
    ReinhardToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping,
    SRGBColorSpace,
    Object3D
  } from 'three';
  
  type SceneSubjectReturn = void | { dispose?: () => void };
  export type SceneSubject = (
    canvas: HTMLElement,
    scene: Scene,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    gui: any
  ) => SceneSubjectReturn | Promise<SceneSubjectReturn>;
  
  export function SceneManager(
    canvas: HTMLElement,
    initialSubject: SceneSubject,
    gui: any
  ) {
    // Renderer
    const renderer = new WebGLRenderer({ antialias: true, alpha: true, toneMappingExposure: 3 });
renderer.setClearColor(0xffffff, 0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
  
    // Scene
    const scene = new Scene();
    (scene as any).backgroundIntensity = 1;
    (scene as any).backgroundBlurriness = 0;
  
    // Camera
    const camera = new PerspectiveCamera(
        fovFromWidth(window.innerWidth),           // 90 - (w/2000)*30, clamped
        aspect(canvas),
        0.1,
        100
      );
      camera.position.set(-7, (window.innerWidth / 1200) * 2 + 2, 10);
  
    // Mount
    canvas.appendChild(renderer.domElement);
    resizeToCanvas();
  
    // GUI
    gui.add(renderer, 'toneMapping', {
      No: NoToneMapping,
      Linear: LinearToneMapping,
      Reinhard: ReinhardToneMapping,
      Cineon: CineonToneMapping,
      ACESFilmic: ACESFilmicToneMapping
    });
    gui.add(renderer, 'toneMappingExposure', 0, 10, 0.001);
  
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera.position, 'x', -10, 10, 0.001);
    cameraFolder.add(camera.position, 'y', -10, 10, 0.001);
    cameraFolder.add(camera.position, 'z', -10, 10, 0.001);
    cameraFolder.add(camera.rotation, 'x', -Math.PI, Math.PI, 0.001);
    cameraFolder.add(camera.rotation, 'y', -Math.PI, Math.PI, 0.001);
    cameraFolder.add(camera.rotation, 'z', -Math.PI, Math.PI, 0.001);
    gui.add(camera, 'fov', 20, 100, 0.1).onChange(() => camera.updateProjectionMatrix());
  
    // Loop
    let raf = 0;
    const render = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    render();
  
    // Resize
    const onWindowResize = () => {
        camera.fov = 80 - (window.innerWidth / 2000) * 30;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onWindowResize);
  
    function resizeToCanvas() {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
    }
    function aspect(el: HTMLElement) {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      return w / h;
    }
    function fovFromWidth(w: number) {
      return Math.max(20, Math.min(100, 80 - (w / 2000) * 30));
    }
  
    // ----- Subject management -----
    let currentCleanup: (() => void) | null = null;
  
    const applySubject = async (subject: SceneSubject) => {
      // clear previous content
      clearScene(scene);
      if (currentCleanup) {
        try { currentCleanup(); } catch {}
        currentCleanup = null;
      }
      // run new subject
      const ret = await subject(canvas, scene, camera, renderer, gui);
      if (ret && typeof ret === 'object' && typeof ret.dispose === 'function') {
        currentCleanup = ret.dispose;
      }
    };
  
    // Initialize with the provided subject
    void applySubject(initialSubject);
  
    // Helper to deep-clear scene objects/materials/textures
    function clearScene(s: Scene) {
      const toRemove: Object3D[] = [...s.children];
      for (const obj of toRemove) {
        s.remove(obj);
        obj.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose?.();
          if (child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            for (const m of mats) {
              for (const k in m) {
                const v = m[k];
                if (v && v.isTexture) v.dispose?.();
              }
              m.dispose?.();
            }
          }
        });
      }
    }
  
    return {
      // swap the content of the scene (e.g., on SWUP route change)
      async setSubject(subject: SceneSubject) {
        await applySubject(subject);
      },
      destroy() {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onWindowResize);
        try { currentCleanup?.(); } catch {}
        clearScene(scene);
        renderer.dispose();
        if (renderer.domElement.parentElement === canvas) {
          canvas.removeChild(renderer.domElement);
        }
      },
      scene,
      camera,
      renderer
    };
  }
  
  /* ----------------------- Singleton helpers (Option B2) ----------------------- */
  
  let _mgr: ReturnType<typeof SceneManager> | null = null;
  
  export function getSceneManager(
    container: HTMLElement,
    sceneSubject: SceneSubject,
    gui: any
  ) {
    if (!_mgr) _mgr = SceneManager(container, sceneSubject, gui);
    return _mgr;
  }
  
  export function destroyManager() {
    _mgr?.destroy?.();
    _mgr = null;
  }
  
  export function hasManager() {
    return !!_mgr;
  }
  