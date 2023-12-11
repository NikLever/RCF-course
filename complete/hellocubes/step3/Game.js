import * as THREE from "three"
import { Player } from "./Player.js"
import { Remote } from "./Remote.js";

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

        this.player = new Player( this, floorSize );
        this.attachCamera( this.player );

        this.remotePlayers = [];

        if (this.socket){
            //The socket is initialized in the Player constructor
            this.socket.on('remoteData', (data) => {
                //Create and delete remote players
                //console.log( `remoteData: ${JSON.stringify(data)}`);
                this.remotePlayers.forEach( player => player.userData.updated = false );
                data.forEach( packet => {
                    if (packet.id != this.player.userData.id){
                        const result = this.remotePlayers.filter( (player) => player.userData.id == packet.id );
                        if (result.length > 0){
                            const player = result[0];
                            player.update(packet);
                        }else{
                            const player = new Remote(this.scene, packet);
                            this.remotePlayers.push(player);
                        }
                    }
                });

                const markForDeletion = [];

                this.remotePlayers.forEach( player => {
                    if (!player.userData.updated) markForDeletion.push(player)
                });

                while( markForDeletion.length > 0){
                    const player = markForDeletion.pop();
                    this.deletePlayer( player );
                }
            });

            this.socket.on('deletePlayer', (data) => {
                console.log( `deletePlayer: ${data.id}`);
                const result = this.remotePlayers.filter( (player) => player.userData.id == data.id );
                if (result.length > 0){
                    this.deletePlayer( result[0] );
                }
            } );
        }

        this.vec = new THREE.Vector3();
        this.quat = new THREE.Quaternion();
        
        this.update();
    }

    deletePlayer( player ){
        const index = this.remotePlayers.indexOf(player);
        if (index!=-1){
            this.remotePlayers.splice(index, 1);
            this.scene.remove(player);
            player.geometry.dispose();
            player.material.dispose();
        }
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