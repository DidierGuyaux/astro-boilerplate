// src/scripts/classes/ThreeScene.ts

import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    NoToneMapping,
    LinearToneMapping,
    ReinhardToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping
} from 'three';

export class ThreeScene {
    // Placeholder properties for your THREE.js objects
    // static scene: THREE.Scene;
    // static currentModel: any = null;
    static isInitialized: boolean = false;

    // Define which pages show which models (use URL paths as keys)
    static SCENE_CONFIGS: { [url: string]: string } = {
        '/': 'elephant_model.glb', // Homepage shows the elephant
        '/index': 'elephant_model.glb', // Assuming '/index' also leads to the elephant
        '/about': 'no_model', // About page hides the model
        '/post': 'no_model' // Post page hides the model
    };

    static init(canvas, gui) {
        if (this.isInitialized) return;

        const container = document.getElementById('three-container');
        if (!container) return;

        const toneMapping = ACESFilmicToneMapping;

        const renderer = new WebGLRenderer({
            antialias: true,
            alpha: true,
            toneMapping: ACESFilmicToneMapping
        });
        renderer.setClearColor(0x666666, 0.5);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight, false);

        gui.add(renderer, 'toneMapping', {
            No: NoToneMapping,
            Linear: LinearToneMapping,
            Reinhard: ReinhardToneMapping,
            Cineon: CineonToneMapping,
            ACESFilmic: ACESFilmicToneMapping
        });

        renderer.toneMappingExposure = 1;

        const scene = new Scene({ environmentBlurriness: 0, environmentIntensity: 1 });
        const camera = new PerspectiveCamera(
            80 - (window.innerWidth / 2000) * 30,
            window.innerWidth / window.innerHeight
        );
        camera.position.set(-7, 5.215, 10);
        camera.rotation.set(-0.48069929742360806, -0.6735230539916102, -0.31448718472714915);

        canvas.appendChild(renderer.domElement);

        renderer.render(scene, camera);

        window.addEventListener('resize', onWindowResize);

        function onWindowResize() {
            console.log('resizig');

            camera.fov = 80 - (window.innerWidth / 2000) * 30;

            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();

            renderer.setSize(window.innerWidth, window.innerHeight, false);
        }

        // 1. Initialize the Three.js scene (renderer, camera, lights, etc.)
        // ... Core THREE.js setup ...

        this.isInitialized = true;

        // 2. Load the initial model for the current page
        this.loadPageModel(window.location.pathname);
    }

    // --- Core Model Management ---

    static loadModel(modelName: string, sceneSubject) {
        // 1. Dispose and remove the current model from the scene (CRITICAL for memory)
        if (this.currentModel) {
            // this.scene.remove(this.currentModel);
            // this.currentModel = null;
        }

        // 2. Load the new model if one is specified
        if (modelName !== 'no_model') {
            // this.currentModel = loadAndAdd(modelName);
            // this.currentModel.visible = true; // Ensure it's visible after load
            console.log(`ThreeScene: Loaded and set model: ${modelName}`);
        } else {
            console.log('ThreeScene: Clearing scene. No model required.');
        }
    }

    static loadPageModel(url: string) {
        // Normalize URL to check against configs
        const normalizedUrl = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
        const modelName = this.SCENE_CONFIGS[normalizedUrl] || 'no_model';

        this.loadModel(modelName);

        // Update visibility based on the loaded model
        // Hypothetical: this.currentModel.visible = (modelName !== 'no_model');
    }

    // --- Swup Hooks (Called by Transitions.ts) ---

    // Optional: Use this for a visual out-animation of the model
    static onTransitionOut() {
        console.log('ThreeScene: Transition out - model is preserving state.');
    }

    // Called when old content is replaced by new content
    static onContentReplace(url: string) {
        // This is the ideal moment to swap the model before the new page renders
        this.loadPageModel(url);
    }

    // Called when the new page is loaded and ready
    static onNavigateIn() {
        // 1. Determine if the model should be visible (e.g., check SCENE_CONFIGS)
        const normalizedUrl = url.endsWith('/') && url.length > 1 ? url.slice(0, -1) : url;
        const modelName = this.SCENE_CONFIGS[normalizedUrl] || 'no_model';

        // 2. Set visibility (e.g., if you are hiding the canvas or model)
        if (this.currentModel && modelName !== 'no_model') {
            // this.currentModel.visible = true;
        }

        // 3. Re-engage any continuous animation or scroll-tracking logic
        // (e.g., make sure your RAF loop or scroll listeners are running again).
        // e.g., this.startAnimationLoop();
        console.log(`ThreeScene: Model visibility re-checked for ${url}.`);
    }
}
