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
    SRGBColorSpace
} from 'three';

export type SceneSubject = (
    canvas: HTMLElement,
    scene: Scene,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    gui: any
) => void | Promise<void> | { dispose?: () => void } | Promise<{ dispose?: () => void }>;

export function SceneManager(canvas: HTMLElement, initialSubject: SceneSubject, gui: any) {
    // ----- Renderer (mirrors your snippet) -----
    const renderer = new WebGLRenderer({
        antialias: true,
        alpha: true
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0xffffff, 0); // white, fully transparent
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 3; // default like your file

    // Mount & initial size
    canvas.appendChild(renderer.domElement);
    resizeToCanvas();

    // ----- Scene (with optional IBL helpers on recent three) -----
    const scene = new Scene();
    (scene as any).environmentBlurriness = 0;
    (scene as any).environmentIntensity = 1;

    // ----- Camera (mirrors your snippet’s defaults) -----
    const camera = new PerspectiveCamera(
        fovFromWidth(window.innerWidth), // 90 - (w/2000)*30, clamped
        aspect(canvas),
        0.1,
        100
    );
    camera.position.set(-7, (window.innerWidth / 1200) * 2 + 2, 10);

    // ----- GUI (tone mapping selector + exposure + camera controls) -----
    if (gui?.add) {
        gui.add(renderer, 'toneMapping', {
            No: NoToneMapping,
            Linear: LinearToneMapping,
            Reinhard: ReinhardToneMapping,
            Cineon: CineonToneMapping,
            ACESFilmic: ACESFilmicToneMapping
        });

        gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001);

        const camFolder = gui.addFolder?.('Camera');
        camFolder?.add(camera.position, 'x', -10, 10, 0.001);
        camFolder?.add(camera.position, 'y', -10, 10, 0.001);
        camFolder?.add(camera.position, 'z', -10, 10, 0.001);
        camFolder?.add(camera.rotation, 'x', -Math.PI, Math.PI, 0.001);
        camFolder?.add(camera.rotation, 'y', -Math.PI, Math.PI, 0.001);
        camFolder?.add(camera.rotation, 'z', -Math.PI, Math.PI, 0.001);
    }

    // ----- Subject lifecycle -----
    let currentCleanup: (() => void) | null = null;

    const applySubject = async (subject: SceneSubject) => {
        clearScene(scene);
        // run new subject; if it returns a disposer, keep it
        const ret = await subject(canvas, scene, camera, renderer, gui);
        if (ret && typeof ret === 'object' && typeof (ret as any).dispose === 'function') {
            currentCleanup = (ret as any).dispose.bind(ret);
        } else {
            currentCleanup = null;
        }
    };

    // boot with initial subject
    void applySubject(initialSubject);

    // ----- Render loop -----
    let raf = 0;
    const render = () => {
        renderer.render(scene, camera);
        raf = requestAnimationFrame(render);
    };
    render();

    // ----- Resize handling (mirrors your snippet’s formulas) -----
    const onWindowResize = () => {
        camera.fov = fovFromWidth(window.innerWidth);
        camera.aspect = aspect(canvas);
        camera.updateProjectionMatrix();
        resizeToCanvas();
        // Optional: keep camera Y in sync with width like your snippet
        camera.position.y = (window.innerWidth / 1200) * 2 + 2;
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
        // 90 - (w/2000)*30, clamped to sane bounds
        const f = 90 - (w / 2000) * 30;
        return Math.max(20, Math.min(100, f));
    }

    // helper to deep-clear scene (dispose geometries/materials/textures)
    function clearScene(s: Scene) {
        const children = [...s.children];
        for (const obj of children) {
            s.remove(obj);
            (obj as any).traverse?.((child: any) => {
                if (child.geometry) child.geometry.dispose?.();
                if (child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    for (const m of mats) {
                        for (const k in m) {
                            const v = (m as any)[k];
                            if (v && v.isTexture) v.dispose?.();
                        }
                        m.dispose?.();
                    }
                }
            });
        }
    }

    return {
        async setSubject(subject: SceneSubject) {
            try {
                currentCleanup?.();
            } catch {}
            await applySubject(subject);
        },
        // expose a few knobs if you want to tweak from outside
        setToneMapping(tm: number) {
            renderer.toneMapping = tm as any;
        },
        setExposure(e: number) {
            renderer.toneMappingExposure = e;
        },
        destroy() {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', onWindowResize);
            try {
                currentCleanup?.();
            } catch {}
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

export function getSceneManager(container: HTMLElement, subject: SceneSubject, gui: any) {
    if (!_mgr) _mgr = SceneManager(container, subject, gui);
    return _mgr;
}

export function destroyManager() {
    _mgr?.destroy?.();
    _mgr = null;
}

export function hasManager() {
    return !!_mgr;
}
