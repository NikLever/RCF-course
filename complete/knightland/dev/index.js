import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import GUI from "three/addons/libs/lil-gui.module.min.js";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { XRHandModelFactory } from "three/addons/webxr/XRHandModelFactory.js";
 
/**
 * Base
 */
// Debug
const gui = new GUI();
 
// Canvas
const canvas = document.querySelector("canvas.webgl");
 
// Scene
const scene = new THREE.Scene();
 
let hand1, hand2;
let controller1, controller2;
let controllerGrip1, controllerGrip2;
 
/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
 
// Directional light
const directionalLight = new THREE.DirectionalLight(0x00fffc, 0.9);
directionalLight.position.set(1, 0.25, 0);
scene.add(directionalLight);
 
// Hemisphere light
const hemisphereLight = new THREE.HemisphereLight(0xff0000, 0x0000ff, 3);
scene.add(hemisphereLight);
 
// Point light
const pointLight = new THREE.PointLight(0xff9000, 1.5);
pointLight.position.set(1, -0.5, 1);
scene.add(pointLight);
 
// Rect area light
const rectAreaLight = new THREE.RectAreaLight(0x4e00ff, 6, 1, 1);
rectAreaLight.position.set(-1.5, 0, 1.5);
rectAreaLight.lookAt(new THREE.Vector3());
scene.add(rectAreaLight);
 
// Spot light
const spotLight = new THREE.SpotLight(
  0x78ff00,
  4.5,
  10,
  Math.PI * 0.1,
  0.25,
  1
);
spotLight.position.set(0, 2, 3);
spotLight.target.position.x = -0.75;
scene.add(spotLight);
 
spotLight.target.position.x = -0.75;
scene.add(spotLight.target);
 
// Helpers
const hemisphereLightHelper = new THREE.HemisphereLightHelper(
  hemisphereLight,
  0.2
);
scene.add(hemisphereLightHelper);
 
const directionalLightHelper = new THREE.DirectionalLightHelper(
  directionalLight,
  0.2
);
scene.add(directionalLightHelper);
 
const pointLightHelper = new THREE.PointLightHelper(pointLight, 0.2);
scene.add(pointLightHelper);
 
const spotLightHelper = new THREE.SpotLightHelper(spotLight);
scene.add(spotLightHelper);
 
const rectAreaLightHelper = new RectAreaLightHelper(rectAreaLight);
scene.add(rectAreaLightHelper);
 
/**
 * Objects
 */
// Material
const material = new THREE.MeshStandardMaterial();
material.roughness = 0.4;
 
// Objects
const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), material);
sphere.position.x = -1.5;
 
const cube = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.75, 0.75), material);
 
const torus = new THREE.Mesh(
  new THREE.TorusGeometry(0.3, 0.2, 32, 64),
  material
);
torus.position.x = 1.5;
 
const plane = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), material);
plane.rotation.x = -Math.PI * 0.5;
plane.position.y = -0.65;
 
scene.add(sphere, cube, torus, plane);
 
/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};
 
window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
 
  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
 
  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType( 'local' );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
 
/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.x = 1;
camera.position.y = 1;
camera.position.z = 2;
scene.add(camera);
 
// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
 
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(VRButton.createButton(renderer));
 
  // controllers
 
    controller1 = renderer.xr.getController( 0 );
    scene.add( controller1 );
 
    controller2 = renderer.xr.getController( 1 );
    scene.add( controller2 );
 
    const controllerModelFactory = new XRControllerModelFactory();
    const handModelFactory = new XRHandModelFactory();
 
    // Hand 1
    controllerGrip1 = renderer.xr.getControllerGrip( 0 );
    controllerGrip1.add( controllerModelFactory.createControllerModel( controllerGrip1 ) );
    scene.add( controllerGrip1 );
 
    hand1 = renderer.xr.getHand( 0 );
    hand1.addEventListener( 'pinchstart', onPinchStartLeft );
    hand1.addEventListener( 'pinchend', () => {
 
        scaling.active = false;
 
    } );
    hand1.add( handModelFactory.createHandModel( hand1 ) );
 
    scene.add( hand1 );
 
    // Hand 2
    controllerGrip2 = renderer.xr.getControllerGrip( 1 );
    controllerGrip2.add( controllerModelFactory.createControllerModel( controllerGrip2 ) );
    scene.add( controllerGrip2 );
 
    hand2 = renderer.xr.getHand( 1 );
    hand2.addEventListener( 'pinchstart', onPinchStartRight );
    hand2.addEventListener( 'pinchend', onPinchEndRight );
    hand2.add( handModelFactory.createHandModel( hand2 ) );
    scene.add( hand2 );
 
    //
 
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType( 'local' );
renderer.xr.cameraAutoUpdate = true;
 
const geometry = new THREE.BufferGeometry().setFromPoints( [ new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, - 1 ) ] );
 
const line = new THREE.Line( geometry );
line.name = 'line';
line.scale.z = 5;
 
controller1.add( line.clone() );
controller2.add( line.clone() );
/**
 * Animate
 */
const clock = new THREE.Clock();
 
function onPinchEndRight( event ) {
 
    const controller = event.target;
 
    if ( controller.userData.selected !== undefined ) {
 
        const object = controller.userData.selected;
        object.material.emissive.b = 0;
        scene.attach( object );
 
        controller.userData.selected = undefined;
        grabbing = false;
 
    }
 
    scaling.active = false;
 
}
 
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
 
  // Update objects
  sphere.rotation.y = 0.1 * elapsedTime;
  cube.rotation.y = 0.1 * elapsedTime;
  torus.rotation.y = 0.1 * elapsedTime;
 
  sphere.rotation.x = 0.15 * elapsedTime;
  cube.rotation.x = 0.15 * elapsedTime;
  torus.rotation.x = 0.15 * elapsedTime;
 
  // Update controls
  controls.update();
 
  // Render
  renderer.xr.updateCamera(camera);
  renderer.render(scene, camera);
 
//   const indexTip1Pos = hand1.joints[ 'index-finger-tip' ].position;
//          const indexTip2Pos = hand2.joints[ 'index-finger-tip' ].position;
//          const distance = indexTip1Pos.distanceTo( indexTip2Pos );
//          const newScale = scaling.initialScale + distance / scaling.initialDistance - 1;
//          scaling.object.scale.setScalar( newScale );
  // Call tick again on the next frame
 // window.requestAnimationFrame(tick);
};
 
function onPinchStartLeft( event ) {
 
    const controller = event.target;
 
    if ( grabbing ) {
 
        const indexTip = controller.joints[ 'index-finger-tip' ];
        const sphere = collideObject( indexTip );
 
        if ( sphere ) {
 
            const sphere2 = hand2.userData.selected;
            console.log( 'sphere1', sphere, 'sphere2', sphere2 );
            if ( sphere === sphere2 ) {
 
                scaling.active = true;
                scaling.object = sphere;
                scaling.initialScale = sphere.scale.x;
                scaling.initialDistance = indexTip.position.distanceTo( hand2.joints[ 'index-finger-tip' ].position );
                return;
 
            }
 
        }
 
    }
 
    const geometry = new THREE.BoxGeometry( SphereRadius, SphereRadius, SphereRadius );
    const material = new THREE.MeshStandardMaterial( {
        color: Math.random() * 0xffffff,
        roughness: 1.0,
        metalness: 0.0
    } );
    const spawn = new THREE.Mesh( geometry, material );
    spawn.geometry.computeBoundingSphere();
 
    const indexTip = controller.joints[ 'index-finger-tip' ];
    spawn.position.copy( indexTip.position );
    spawn.quaternion.copy( indexTip.quaternion );
 
    spheres.push( spawn );
 
    scene.add( spawn );
 
}
 
function onPinchStartRight( event ) {
 
    const controller = event.target;
    const indexTip = controller.joints[ 'index-finger-tip' ];
    const object = collideObject( indexTip );
    if ( object ) {
 
        grabbing = true;
        indexTip.attach( object );
        controller.userData.selected = object;
        console.log( 'Selected', object );
 
    }
 
}
 
 
renderer.setAnimationLoop(tick);