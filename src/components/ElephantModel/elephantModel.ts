import { gsap } from 'gsap/dist/gsap';
import { $scroll, type IScrollValues } from '@scripts/stores/scroll.ts';


// Inititialize Three.js
import { 
WebGLRenderer,
Scene,
PerspectiveCamera,
HemisphereLight,
DirectionalLight,
SphereGeometry,
MeshPhysicalMaterial,
MeshBasicMaterial,
Mesh,
PointLight,
WebGLRenderTarget,
Vector2,
TextureLoader,
RepeatWrapping,
PlaneGeometry,
UniformsUtils,
RGBAFormat,
LinearFilter,
Vector3,
EquirectangularReflectionMapping,
ColorManagement,
ACESFilmicToneMapping } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { SubsurfaceScatteringShader } from 'src/scripts/components/SubsurfaceScatteringShader.js';
import { HDRJPGLoader } from '@monogrid/gainmap-js'

import { RGBELoader } from 'src/scripts/components/RGBELoader.js';


//import { Power4 } from 'gsap';
var ratioNumWidth = window.innerWidth;
var ratioNumHeight = window.innerHeight;
const toneMap = ACESFilmicToneMapping;
const renderer = new WebGLRenderer({antialias:false, alpha: true, toneMapping: toneMap  });
renderer.setClearColor( 0x000000, 0 )
const scene = new Scene();
const camera = new PerspectiveCamera(80 - ( ratioNumWidth /  2000) * 30, window.innerWidth / window.innerHeight);
camera.position.set(-7, (( ratioNumWidth /  1200) * 2) +2, 10);
scene.background = null;
scene.environmentBlurriness = 0;
scene.environmentIntensity = 1;
const canva = document.getElementById('three-container');
const modelLoader = new GLTFLoader();
let bgMesh;
let bgGeometry;
let bgMaterial;


canva.style.opacity = "0";

new HDRJPGLoader(renderer).load('/assets/images/billiard_hall_4k.jpg', (texture) => {
    texture.renderTarget.texture.mapping = EquirectangularReflectionMapping
    scene.environment = texture.renderTarget.texture
    
  })



let mesh;
ColorManagement.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize( window.innerWidth, window.innerHeight );
composer.setSize( window.innerWidth *2, window.innerHeight *2);
renderer.outputColorSpace = "srgb"; // optional with post-processing




renderer.setAnimationLoop( animate );
scene.add(new HemisphereLight(0xffffff, 0xffffff, 1));



// Lights

//scene.add( new AmbientLight( 0xf9b861, 6 ) );

			const directionalLight = new DirectionalLight( 0xffffff, 2.5 );
			directionalLight.position.set( 0.0, 0.5, 0.5 ).normalize();
			scene.add( directionalLight );
            directionalLight.visible = true;

			const pointLight1 = new Mesh( new SphereGeometry( 4, 8, 8 ), new MeshBasicMaterial( { color: 0xf9b861 } ) );
			pointLight1.add( new PointLight( 0xc1c1c1, 200, 300, 80 ) );
			scene.add( pointLight1 );
			pointLight1.position.x = 0;
			pointLight1.position.y = - 50;
			pointLight1.position.z = 350;
            pointLight1.visible = true;

			const pointLight2 = new Mesh( new SphereGeometry( 4, 8, 8 ), new MeshBasicMaterial( { color: 0xef53d0 } ) );
			pointLight2.add( new PointLight( 0xc1c100, 15, 1500, 0 ) );
			scene.add( pointLight2 );
			pointLight2.position.x = - 100;
			pointLight2.position.y = 20;
			pointLight2.position.z = - 260;
            pointLight2.visible = true;


initMaterial();

function initMaterial() {

    const loader = new TextureLoader();
    const imgTexture = loader.load( '/assets/images/white.jpg' );
    imgTexture.colorSpace = 4;

    const thicknessTexture = loader.load( '/assets/images/Thickness_map_2.jpg' );
    imgTexture.wrapS = imgTexture.wrapT = RepeatWrapping;
    

    const shader = SubsurfaceScatteringShader;
    const uniforms = UniformsUtils.clone( shader.uniforms );

    uniforms[ 'map' ].value = imgTexture;

    uniforms[ 'diffuse' ].value = new Vector3( 1.0, 0.2, 0.2 );
    uniforms[ 'shininess' ].value = 500;

    uniforms[ 'thicknessMap' ].value = thicknessTexture;
    uniforms[ 'thicknessColor' ].value = new Vector3( 0.1, 0.3, 0.0 );
    uniforms[ 'thicknessDistortion' ].value = 0.59;
    uniforms[ 'thicknessAmbient' ].value = 3;
    uniforms[ 'thicknessAttenuation' ].value = 0.95;
    uniforms[ 'thicknessPower' ].value = 10.9;
    uniforms[ 'thicknessScale' ].value = 29.7;

    const hdrEquirect = new RGBELoader().load(
        "src/assets/images/lzTT-empty_warehouse_01_2k.hdr",  
        () => { 
          hdrEquirect.mapping = EquirectangularReflectionMapping; 
        }
      );



    modelLoader.load('/assets/3d/elephant_marbled-metal_2x.glb', ({ scene: model }, ) => { 
        const material = new MeshPhysicalMaterial( {
          //  uniforms: uniforms,
        //    vertexShader: shader.vertexShader,
       //     fragmentShader: shader.fragmentShader,
       //     lights: true,
            envMap: hdrEquirect,
            envMapIntensity: 1.3,
            clearcoat: 0.5,
            clearcoatRoughness: 0.1,
            roughness: 0.2,
            transmission: 1,
            ior: 1.5,
            reflectivity: 0.5,
            thickness: 3.7,
            transparent:true,
            emissiveIntensity: 1,
            iridescence: 1,
            iridescenceIOR: 0.7,
        } );
        mesh = model;
        model.scale.setScalar(1.8);
        camera.lookAt(model.position.x + 2, model.position.y + 0, model.position.z);
        model.material = material;
        material.needsUpdate = true;
        model.material.emissiveIntensity = 0;
        scene.add(model);





        const textureLoader = new TextureLoader();

        const bgTexture = textureLoader.load("src/assets/images/blocks2.jpeg");

               bgGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight);
               bgMaterial = new MeshBasicMaterial({ map: bgTexture });
              //const bgGeometry = new PlaneGeometry(50, 50);

              bgMesh = new Mesh(bgGeometry, bgMaterial);
            bgMesh.lookAt(camera.position);
              //bgMesh.rotation.set(-2, .8, .1);
              //bgMesh.rotation.set(-2, .8, .1);
          
          
              const offset = new Vector3(0,0,-10) 
          
              //animation loop
              bgMesh.position.copy(mesh2.position.clone().add(offset))
              //bgMesh.rotation.copy(camera.rotation);
              scene.add(bgMesh);
          
          
              
        modelLoaded();
    });
}

function animate() {
 // renderer.render(scene, camera);
  //render();
  
  //controls.update();
  composer.render();
  
};

function render() {
if ( mesh ) scene.environmentRotation.y = performance.now() / 50000;
    renderer.render( scene, camera );
}

animate();

document.getElementById('three-container').appendChild(renderer.domElement);

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
    ratioNumWidth = window.innerWidth; 
    ratioNumHeight = window.innerHeight; 
    
        camera.fov = 80 - ( ratioNumWidth /  2000) * 30;
       
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, ratioNumHeight  );
    composer.setSize( window.innerWidth, ratioNumHeight  );
}





function modelLoaded() {


    
  
    
    
const tl = gsap.timeline({
    paused:false,
    overwrite:false,
    ease: "Power4.inOut",
    duration: 10,
});

const master = gsap.timeline({
    paused:true,
    overwrite:false,
});

const section1 = document.getElementById("section_1");
        //tl.from(mesh.rotation, 
        //    { y: 2, x:-.3, z:-.2})
    
            tl
            .add("position", 0).add("opacity", 0).add("rotation", 2).add("zIndex", 2)
            .add("depart", 2).add("departScale", 2).add("departPos", 2)
        //    .add("fin", 0)
    
        tl  
        .to(mesh.position, {delay: 0,  duration: 1.5, y: -1.7, z:-.2, ease: "back.out", onComplete: animComplete}, "position")
        .to(canva,{delay: 0, duration: 1,autoAlpha:1, opacity: 1, }, "<", "opacity")
        .to(mesh.rotation, {delay: 0,duration: 2.7, y: 2, x:-.8, z:-.1, ease: "circ.out" }, "<", "rotation")
      //  .to(section1, {delay: 0,zIndex:999 }, ">", 1, "zIndex")
        
         //   .to(mesh.position, { y: 0, x:0, z:0, duration:20, ease: "Power4.inOut"},">", "fin")
         //   onComplete: tl.remove("afterTransition")
        // tl.tweenFromTo('position', 'rotation');

         
        master.to(mesh.rotation, { y: -1.5, x:0, z:0, duration:6, ease: "sine.out"},">", "depart")
        .to(mesh.scale, { y: 3.8, x:3.8, z:3.8, duration:4, ease: "back.out"}, "<", "departScale")
        .to(mesh.position, { y: -10, x: 3,duration:4, ease: "sine.out"}, "<", "departPos")
       // .to(canva, { filter: "brightness(0.8) contrast(0.9) saturate(0.3)", duration:4, ease: "power2.in"}, "<", "departCanva")

       //gsap.to(mesh.position, {delay: 0,  duration: 1.5, y: -1.7, z:-.2, ease: "back", onComplete: scrubScroll() });

        //tl.fromTo(mesh.rotation, { y: 2, x:-.3, z:-.2}, { y: 0, x:0,z:0 });
        //scrubScroll()

$scroll.listen(({ progress }: IScrollValues) => {
    master.seek(progress * 20 );
});


function animComplete () {
//section1.style.zIndex = '999'

}
}


