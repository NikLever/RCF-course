import * as THREE from "three"
import { Player } from "./Player.js"

export class Game{
    constructor(){
        this.init();
    }

    init(){
        this.scene = new THREE.Scene();

        this.clock = new THREE.Clock();
        
        this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
        this.camera.position.set(1, 3, 6);

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
        
        window.addEventListener( 'resize', this.resize.bind(this), false);
    
        this.scene.background = new THREE.Color(0x999999);

        const floorSize = 10;

        this.createFloor( floorSize );

        this.move = { forward: 0, turn: 0 };

        this.player = new Player(this.scene, floorSize);
        this.attachCamera( this.player );

        this.vec = new THREE.Vector3();
        this.quat = new THREE.Quaternion();
        
        this.update();
    }

    attachCamera( cube ){
        this.camera.lookAt(cube.position);
        this.dummyCam = new THREE.Object3D();
        this.dummyCam.position.copy(this.camera.position);
        this.dummyCam.quaternion.copy(this.camera.quaternion);
        cube.attach( this.dummyCam );
    }

    createFloor( size ){
        this.floorSize = size;

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry( size * 2, size * 2, 1, 1 ).rotateX( - Math.PI / 2 ),
            new THREE.MeshStandardMaterial( { color: 0xdddddd } )
        );
        floor.receiveShadow = true;
        this.scene.add( floor );
    }

    update(){
        requestAnimationFrame( this.update.bind(this) );

        const dt = this.clock.getDelta();

        if (this.player) this.player.update(dt);

        if (this.dummyCam){
            this.camera.position.lerp(this.dummyCam.getWorldPosition(this.vec), dt * 2);
            this.camera.quaternion.slerp(this.dummyCam.getWorldQuaternion(this.quat), dt * 2);
        }

        this.renderer.render( this.scene, this.camera );  
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}