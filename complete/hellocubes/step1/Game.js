import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GUI } from "three/addons/libs/lil-gui.module.min.js"

export class Game{
    constructor(){
        this.init();
    }

    init(){
        this.scene = new THREE.Scene();
        
        this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
        this.camera.position.set(4, 3, 6);

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild( this.renderer.domElement );
        
        const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 0.3);
        this.scene.add(ambient);
        
        const light = new THREE.DirectionalLight(0xFFFFFF, 3);
        light.position.set( 4, 5, 3);
        light.castShadow = true;
        this.scene.add(light);
        
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        window.addEventListener( 'resize', this.resize.bind(this), false);
    
        this.scene.background = new THREE.Color(0x999999);

        this.createFloor();
        this.createCube();
        
        this.update();
    }
      
    createFloor(){
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry( 20, 20, 1, 1 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshStandardMaterial( { color: 0xdddddd } )
        );
        floor.receiveShadow = true;
        this.scene.add( floor );
    }

    createCube(){
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry().translate(0, 0.5, 0),
            new THREE.MeshStandardMaterial( { color: Math.floor( Math.random() * (1 << 24) ) })
        );
        cube.castShadow = true;
        this.scene.add( cube );
    }

    update(){
        requestAnimationFrame( this.update.bind(this) );
        this.renderer.render( this.scene, this.camera );  
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}