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

export function SceneManager(canvas, sceneSubject, gui) {
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
    sceneSubject(canvas, scene, camera, renderer, gui);

    //camera.lookAt(mesh.position.x + 2, mesh.position.y + 0, mesh.position.z);
    //renderer.setAnimationLoop( animate );
    renderer.render(scene, camera);

    window.addEventListener('resize', onWindowResize);

    function onWindowResize() {
        console.log('resizig');

        camera.fov = 80 - (window.innerWidth / 2000) * 30;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight, false);
    }

    gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001);

    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera.position, 'x').min(-10).max(10).step(0.001);
    cameraFolder.add(camera.position, 'y').min(-10).max(10).step(0.001);
    cameraFolder.add(camera.position, 'z').min(-10).max(10).step(0.001);

    cameraFolder.add(camera.rotation, 'x').min(-180).max(180).step(0.001);
    cameraFolder.add(camera.rotation, 'y').min(-180).max(180).step(0.001);
    cameraFolder.add(camera.rotation, 'z').min(-180).max(180).step(0.001);
    gui.add(camera, 'fov').min(0).max(10).step(0.001);
}
