import { gsap } from 'gsap/dist/gsap';
import { $scroll, type IScrollValues } from '@scripts/stores/scroll.ts';
import {
    WebGLRenderer,
    Scene,
    PerspectiveCamera,
    Mesh,
    TextureLoader,
    MeshPhysicalMaterial,
    EquirectangularReflectionMapping,
    DirectionalLight,
    SphereGeometry,
    MeshBasicMaterial,
    PointLight,
    NoToneMapping,
    LinearToneMapping,
    ReinhardToneMapping,
    CineonToneMapping,
    ACESFilmicToneMapping
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'src/scripts/components/RGBELoader.js';
import GUI from 'lil-gui';

let mesh = null;
const gui = new GUI();
const renderer = new WebGLRenderer({ antialias: true, alpha: true, toneMappingExposure: 3 });
renderer.setClearColor(0xffffff, 0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
gui.add(renderer, 'toneMapping', {
    No: NoToneMapping,
    Linear: LinearToneMapping,
    Reinhard: ReinhardToneMapping,
    Cineon: CineonToneMapping,
    ACESFilmic: ACESFilmicToneMapping
});

renderer.toneMappingExposure = 3;
renderer.toneMappingExposure = ACESFilmicToneMapping;
gui.add(renderer, 'toneMappingExposure').min(0).max(10).step(0.001);

const scene = new Scene({ environmentBlurriness: 0, environmentIntensity: 1 });
const camera = new PerspectiveCamera(
    90 - (window.innerWidth / 2000) * 30,
    window.innerWidth / window.innerHeight
);
camera.position.set(-7, (window.innerWidth / 1200) * 2 + 2, 10);
const canva = document.getElementById('three-container');

const hdrEquirect = new RGBELoader().load(
    'src/assets/images/lzTT-empty_warehouse_01_2k.hdr',
    () => {
        hdrEquirect.mapping = EquirectangularReflectionMapping;
        scene.environment = hdrEquirect;
    }
);

//scene.add(new HemisphereLight(0xffffff, 0xffffff, 1));

// Lights

//scene.add( new AmbientLight( 0xf9b861, 6 ) );

function initMaterial() {
    new GLTFLoader().load('/assets/3d/elephant_marbled-metal_2x_contrast2.glb', (gltf) => {
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

        const normalMapTexture = new TextureLoader().load('src/assets/images/normal.jpg');

        const myNewMaterial = new MeshPhysicalMaterial({
            color: 0x7a9ad9,
            metalness: 0.2,
            roughness: 0.6,
            transmission: 0,
            iridescence: 1,
            iridescenceIOR: 0.9,
            ior: 1.35,
            reflectivity: 1,
            envMap: hdrEquirect,
            envMapIntensity: 0.5,
            clearcoat: 0.3,
            clearcoatRoughness: 0.1,
            transparent: true,
            emissive: 0xffffff,
            emissiveMap: elephtexture3,
            emissiveIntensity: 1,
            map: elephtexture
        });

        gui.add(myNewMaterial, 'metalness').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'roughness').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'transmission').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'iridescence').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'iridescenceIOR').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'ior').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'reflectivity').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'envMapIntensity').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'clearcoat').min(0).max(10).step(0.001);
        gui.add(myNewMaterial, 'clearcoatRoughness').min(0).max(10).step(0.001);

        const elephant = gltf.scene.children.find((mesh) => mesh.name === 'elephant_Low_Poly');

        const geometry = elephant.geometry.clone();

        mesh = new Mesh(geometry, myNewMaterial);

        camera.lookAt(mesh.position.x + 2, mesh.position.y + 0, mesh.position.z);

        mesh.scale.setScalar(0.07);
        gltf.scene.children.forEach((child) => {
            child.geometry.dispose();
            child.material.dispose();
        });

        scene.add(mesh);

        modelLoaded();
        const cameraFolder = gui.addFolder('Camera');
        cameraFolder.add(camera.position, 'x').min(-10).max(10).step(0.001);
        cameraFolder.add(camera.position, 'y').min(-10).max(10).step(0.001);
        cameraFolder.add(camera.position, 'z').min(-10).max(10).step(0.001);

        cameraFolder.add(camera.rotation, 'x').min(-180).max(180).step(0.001);
        cameraFolder.add(camera.rotation, 'y').min(-180).max(180).step(0.001);
        cameraFolder.add(camera.rotation, 'z').min(-180).max(180).step(0.001);
    });
}

function animate() {
    if (mesh) scene.environmentRotation.y = performance.now() / 50000;

    render();
}

function render() {
    renderer.render(scene, camera);
}

function modelLoaded(myNewMaterial) {
    gui.add(mesh.position, 'x').min(-10).max(10).step(0.001);
    gui.add(mesh.position, 'y').min(-10).max(10).step(0.001);
    gui.add(mesh.position, 'z').min(-10).max(10).step(0.001);
    gui.add(mesh.rotation, 'x').min(-10).max(10).step(0.001);
    gui.add(mesh.rotation, 'y').min(-10).max(10).step(0.001);
    gui.add(mesh.rotation, 'z').min(-10).max(10).step(0.001);
    const tl = gsap.timeline({
        paused: false,
        overwrite: false,
        ease: 'Power4.inOut',
        duration: 10
    });

    const master = gsap.timeline({
        paused: true,
        overwrite: false
    });
    tl.add('position', 0)
        .add('opacity', 0)
        .add('rotation', 2)
        .add('zIndex', 2)
        .add('depart', 2)
        .add('departScale', 2)
        .add('departPos', 2);

    tl.to(
        mesh.position,
        { delay: 0, duration: 1.5, y: -1.7, z: -0.2, ease: 'back.out', onComplete: animComplete },
        'position'
    )
        .to(canva, { delay: 0, duration: 2, autoAlpha: 1, opacity: 1 }, '<', 'opacity')
        .to(
            mesh.rotation,
            { delay: 0, duration: 2.7, y: 2, x: -0.8, z: -0.1, ease: 'circ.out' },
            '<',
            'rotation'
        );

    master
        .to(mesh.rotation, { y: -1.5, x: 0, z: 0, duration: 6, ease: 'sine.out' }, '>', 'depart')
        .to(
            mesh.scale,
            { y: 0.13, x: 0.13, z: 0.13, duration: 4, ease: 'back.out' },
            '<',
            'departScale'
        )
        .to(mesh.position, { y: -10, x: 3, duration: 4, ease: 'sine.out' }, '<', 'departPos');

    $scroll.listen(({ progress }: IScrollValues) => {
        master.seek(progress * 20);
    });

    function animComplete() {
        //section1.style.zIndex = '999'
    }
}

canva.style.opacity = '0';

initMaterial();

renderer.setAnimationLoop(animate);

animate();

document.getElementById('three-container').appendChild(renderer.domElement);

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.fov = 80 - (window.innerWidth / 2000) * 30;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}
