import { gsap } from 'gsap/dist/gsap';
import { $scroll, type IScrollValues } from '@scripts/stores/scroll.ts';
import { 
Mesh,
TextureLoader,
MeshPhysicalMaterial,
EquirectangularReflectionMapping,
PlaneGeometry,
MeshBasicMaterial,
Vector3
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'src/scripts/components/RGBELoader.js';



export function elephantSubject (canva, scene, camera, renderer, gui) {


let mesh = null;
canva.style.opacity = "0";



//scene.add(new HemisphereLight(0xffffff, 0xffffff, 1));

// Lights

//scene.add( new AmbientLight( 0xf9b861, 6 ) );

function initMaterial() {
console.log('initMaterial')
    const hdrEquirect = new RGBELoader().load(
        "src/assets/images/lzTT-empty_warehouse_01_2k.hdr",  
        () => { 
          hdrEquirect.mapping = EquirectangularReflectionMapping;
          scene.environment = hdrEquirect
        }
      );

    new GLTFLoader().load('/assets/3d/elephant_marbled-metal_2x_contrast2.glb', (gltf) => {

        const elephtexture = new TextureLoader().load('public/assets/images/Thickness_map_2.jpg' ); 
        elephtexture.flipY=false;

        const elephtexture2 = new TextureLoader().load('public/assets/images/Thickness_map_color_clamped_contrast1.jpg' ); 
        elephtexture2.flipY=false;

        const elephtexture3 = new TextureLoader().load('public/assets/images/Thickness_map_color_2x.jpg' ); 
        elephtexture3.flipY=false;
        
        const normalMapTexture = new TextureLoader().load('src/assets/images/normal.jpg' ); 

    const myNewMaterial =  new MeshPhysicalMaterial( {
        color: 0x7a9ad9,
        metalness: 0.2,
        roughness: 0.6,
        transmission: 0,
        iridescence: 1,
        iridescenceIOR: 0.9,
        ior: 1.35,
        reflectivity: 1,
        thickness: 5,
        envMap: hdrEquirect,
        envMapIntensity: 0.5,
        clearcoat: 0.3,
        clearcoatRoughness: 0.1,
        transparent: true,
        emissive: 0xffffff,
        emissiveMap: elephtexture3,
        emissiveIntensity:1,
        map: elephtexture,
    } );
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




        const elephant = gltf.scene.children.find((mesh) => mesh.name === "elephant_Low_Poly");

            const geometry = elephant.geometry.clone();

            mesh = new Mesh(geometry, myNewMaterial);

            
           
            mesh.scale.setScalar(.07);

            gltf.scene.children.forEach((child) => {
              child.geometry.dispose();
              child.material.dispose();
            });
console.log(camera);
            scene.add(mesh);
 





            console.log(scene.children[0])
            modelLoaded();

            const textureLoader = new TextureLoader();

            const bgTexture = textureLoader.load("src/assets/images/blocks2.jpeg");
        
                   const bgGeometry = new PlaneGeometry(window.innerWidth, window.innerHeight);
                   const bgMaterial = new MeshBasicMaterial({ map: bgTexture });
                  //const bgGeometry = new PlaneGeometry(50, 50);
        
                  const bgMesh = new Mesh(bgGeometry, bgMaterial);
                bgMesh.lookAt(camera.position);
                  //bgMesh.rotation.set(-2, .8, .1);
                  //bgMesh.rotation.set(-2, .8, .1);
              
              
                  const offset = new Vector3(0,0,-10) 
              
                  //animation loop
                  bgMesh.position.copy(mesh.position.clone().add(offset))
                  //bgMesh.rotation.copy(camera.rotation);
                  scene.add(bgMesh);

        });

}

function animate() {

//if ( mesh ) scene.environmentRotation.y = performance.now() / 50000;

};


function modelLoaded() {
    
//    camera.lookAt(mesh.position.x + 2, mesh.position.y + 0, mesh.position.z);
console.log(camera)
    console.log('modelLoaded')
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

        tl
        .add("position", 0).add("opacity", 0).add("rotation", 2).add("zIndex", 2)
        .add("depart", 2).add("departScale", 2).add("departPos", 2)

        tl  
        .to(mesh.position, {delay: 0,  duration: 1.5, y: -1.7, z:-.2, ease: "back.out", onComplete: animComplete}, "position")
        .to(canva,{delay: 0, duration: 2,autoAlpha:1, opacity: 1, }, "<", "opacity")
        .to(mesh.rotation, {delay: 0,duration: 2.7, y: 2, x:-.8, z:-.1, ease: "circ.out" }, "<", "rotation")

        master.to(mesh.rotation, { y: -1.5, x:0, z:0, duration:6, ease: "sine.out"},">", "depart")
        .to(mesh.scale, { y: .13, x:.13, z:.13, duration:4, ease: "back.out"}, "<", "departScale")
        .to(mesh.position, { y: -10, x: 3,duration:4, ease: "sine.out"}, "<", "departPos")


$scroll.listen(({ progress }: IScrollValues) => {
    master.seek(progress * 20 );
    console.log(mesh.scale )
});

function animComplete () {
//section1.style.zIndex = '999'

}
gui.add(canva.style, 'opacity').min(0).max(1).step(0.001);

const meshFolder = gui.addFolder( 'Position of Mesh' );
meshFolder.add(mesh.position, 'x').min(-10).max(10).step(0.001);
meshFolder.add(mesh.position, 'y').min(-10).max(10).step(0.001);
meshFolder.add(mesh.position, 'z').min(-10).max(10).step(0.001);
}



//canva.style.opacity = "0";

initMaterial();

renderer.setAnimationLoop( animate );
//renderer.render( scene, camera );
animate();










}




