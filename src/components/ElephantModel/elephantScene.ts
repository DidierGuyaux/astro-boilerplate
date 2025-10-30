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
    SRGBColorSpace,
    // Removed: CanvasTexture, LinearFilter, Vector2, Group
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { gsap } from 'gsap/dist/gsap';
import { $scroll } from '@scripts/stores/scroll';
import type { ScrollValues } from '@scripts/stores/scroll'; // Using ScrollValues type

type SceneSubject = (
    canvas: HTMLElement,
    scene: Scene,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer,
    gui: any
) => Promise<{ 
    dispose?: () => void; 
    animateOut?: (duration: number) => Promise<void>; // 🚀 Expose animateOut
} | void>; 

export const elephantScene: SceneSubject = async (canvas, scene, camera, renderer, gui) => {
    let mesh: Mesh | null = null;
    // Base Y-position for the model from the intro timeline
    const initialYPosition = -1.7; 

    // --- Core Animate Out Logic ---
    function animateOut(duration: number = 0.5): Promise<void> {
        if (!mesh) return Promise.resolve();

        // Animate the model's Y position high up, quickly out of the camera's view.
        return new Promise(resolve => {
            gsap.to(mesh!.position, {
                y: 10, // Move model 10 units up (off-screen)
                duration: duration,
                ease: "power2.in",
                onComplete: () => {
                    // Hide the mesh and reset position for when the page reloads
                    mesh!.visible = false;
                    mesh!.position.y = initialYPosition;
                    resolve();
                }
            });
        });
    }
    // --- End Animate Out Logic ---
    
    console.log('[elephantScene] START');
    // --- Renderer knobs
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setClearColor(0xffffff, 0); 
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.852; 

    // --- Lights
    const dir = new DirectionalLight(0xffffff, 2.0);
    dir.position.set(0.0, 0.5, 0.5).normalize();
    scene.add(dir);

    const warmBall = new Mesh(
        new SphereGeometry(4, 8, 8),
        new MeshBasicMaterial({ color: 0xf9b861 })
    );
    warmBall.add(new PointLight(0xc1c1c1, 120, 300, 80));
    warmBall.position.set(0, -50, 350);
    scene.add(warmBall);

    const rimBall = new Mesh(
        new SphereGeometry(4, 8, 8),
        new MeshBasicMaterial({ color: 0xef53d0 })
    );
    rimBall.add(new PointLight(0xc1c100, 10, 1500, 0));
    rimBall.position.set(-100, 20, -260);
    scene.add(rimBall);

    // --- Environment
    const hdrEquirect = await new RGBELoader().loadAsync(
        '/src/assets/images/lzTT-empty_warehouse_01_2k.hdr'
    );
    hdrEquirect.mapping = EquirectangularReflectionMapping;
    scene.environment = hdrEquirect;

    // --- Load textures
    const texLoader = new TextureLoader();
    const thicknessMap = texLoader.load('/assets/images/Thickness_map_2.jpg');
    const emissiveMapClamp = texLoader.load(
        '/assets/images/Thickness_map_color_clamped_contrast1.jpg'
    );
    const emissiveMap2x = texLoader.load('/assets/images/Thickness_map_color_2x.jpg');

    thicknessMap.colorSpace = SRGBColorSpace;
    emissiveMapClamp.colorSpace = SRGBColorSpace;
    emissiveMap2x.colorSpace = SRGBColorSpace;

    const elephtexture = texLoader.load('public/assets/images/Thickness_map_2.jpg');
    elephtexture.flipY = false;
    const elephtexture3 = texLoader.load(
        'public/assets/images/Thickness_map_color_2x.jpg'
    );
    elephtexture3.flipY = false;

    // Material setup
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

    // GLTF Loading
    const gltf = await new GLTFLoader().loadAsync(
        '/assets/3d/elephant_marbled-metal_2x_contrast2.glb'
    );

    const namedChild = gltf.scene.children.find((c: any) => c.name === 'elephant_Low_Poly') as any;
    if (namedChild?.geometry) {
        const geo = namedChild.geometry.clone();
        mesh = new Mesh(geo, mat);
    } else {
        gltf.scene.traverse((o: any) => {
            if (o.isMesh) o.material = mat;
        });
        mesh = gltf.scene as unknown as Mesh;
    }

    // Add and position
    if (mesh) {
        mesh.scale.setScalar(0.07);
        scene.add(mesh);
        camera.lookAt(mesh.position.x + 2, mesh.position.y + 0, mesh.position.z);
        camera.fov = 80 - (window.innerWidth / 2000) * 30;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Camera FOV mapping
    const w = window.innerWidth;
    camera.fov = Math.max(20, Math.min(100, 90 - (w / 2000) * 30));
    camera.aspect =
        (renderer.domElement.clientWidth || w) /
        (renderer.domElement.clientHeight || window.innerHeight);
    camera.updateProjectionMatrix();

    // GUI controls (omitted for brevity)

    // --- Intro + scroll scrub 
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
        // Set final intro position and start animation
        .to(mesh!.position, { duration: 1.5, y: initialYPosition, z: -0.2, ease: 'back.out' }, 'position')
        .to(canvas, { duration: 2, autoAlpha: 1, opacity: 1 }, '<')
        .to(
            mesh!.rotation as any,
            { duration: 2.7, y: 2, x: -0.8, z: -0.1, ease: 'circ.out' },
            '<'
        );

    tlMaster
        .to(
            mesh!.rotation as any,
            { y: -1.5, x: 0, z: 0, duration: 6, ease: 'sine.out' },
            '>',
            'depart'
        )
        .to(
            mesh!.scale as any,
            { x: 0.13, y: 0.13, z: 0.13, duration: 4, ease: 'back.out' },
            '<',
            'departScale'
        )
        .to(
            mesh!.position as any,
            { y: -10, x: 3, duration: 4, ease: 'sine.out' },
            '<',
            'departPos'
        );

    let unlisten: (() => void) | undefined;
    try {
        const maybeUnsub = $scroll.listen(({ progress }: ScrollValues) => {
            tlMaster.seek(progress * 20);
        });
        if (typeof maybeUnsub === 'function') unlisten = maybeUnsub;
    } catch {
        /* noop */
    }

    // --- Return exposed functions and disposer ---
    return {
        animateOut, // 🚀 Exposed function for exit animation
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
            elephtexture.dispose();
            elephtexture3.dispose();

            hdrEquirect.dispose();
        }
    };
};