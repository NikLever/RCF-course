import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { Player } from './Player.js'
import { Remote } from './Remote.js'
import { Choose } from './Choose.js'
import { CameraPath } from './CameraPath.js'
import { LoadingBar } from '../../../libs/LoadingBar.js'
import { SpeechBubble } from './SpeechBubble.js'

const states = {
  CHOOSE: 1,
  CAMERAPATH: 2,
  DEFAULT: 3,
  CHAT: 4,
  GAME: 5
}

export class Game{
	constructor(){
        this.debug = false;

        this.state = states.CHOOSE;

        this.clock = new THREE.Clock();

        this.loadingBar = new LoadingBar();

        this.initScene();

        this.tmpQuat = new THREE.Quaternion(); 
        this.tmpVec3 = new THREE.Vector3();
        
        this.mouseDown = false;
        this.prevMousePos = new THREE.Vector2();
        this.tmpVec2 = new THREE.Vector2();

        this.selectedRemote = null;
        this.chatPanel = document.getElementById('chat');
        this.raycaster = new THREE.Raycaster();
        this.pointer = new THREE.Vector2();

        window.addEventListener('mousedown', (evt) => {
            this.tmpQuat.copy(this.camera.quaternion);
            this.prevMousePos.set( evt.clientX, evt.clientY );
            this.mouseDown = true;

            //Check if we've touched a remote players collider
            const colliders = this.remotePlayers.map( remote => {
              return remote.getObjectByName('collider');
            });

            this.pointer.x = ( evt.clientX / window.innerWidth ) * 2 - 1;
            this.pointer.y = - ( evt.clientY / window.innerHeight ) * 2 + 1;

            this.raycaster.setFromCamera(this.pointer, this.camera);

            const intersects = this.raycaster.intersectObjects( colliders );

            if (intersects.length>0){
              if (this.chatData){
                this.endChat();
              }else{
                if (this.chatPanel) this.chatPanel.style.opacity = 1;
                this.chatData = this.initChat(intersects[0].object.parent);
              }
            }
            
        });

        window.addEventListener('mouseup', () => {
            this.camera.quaternion.copy(this.tmpQuat);
            this.mouseDown = false;
        });

        window.addEventListener('mousemove', (evt) => {
            if (this.mouseDown){
                this.tmpVec2.set( evt.clientX, evt.clientY ).sub( this.prevMousePos );
                console.log(this.tmpVec2);
                this.camera.rotateY( (this.tmpVec2.x > 0) ? 0.03 : -0.03 );
                //this.camera.rotateX( (this.tmpVec2.y > 0) ? 0.01 : -0.01 );
                this.prevMousePos.set( evt.clientX, evt.clientY );
            }
        })

        window.addEventListener('resize', this.resize.bind(this) );

        const msgForm = document.getElementById("msg-form");
        const msg = document.getElementById("msg");

        msgForm.addEventListener('submit', (e) => {
          e.preventDefault();
          if (msg.value) {
            this.socket.emit('chat message', { id: this.chatData.id, message: msg.value });
            msg.value = '';
          }
        });

        msg.addEventListener('change', () => {
          if (this.chatData) this.chatData.changeTime = Date.now();
        })

        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	

  endChat(){
    delete this.chatData;
    this.state = states.DEFAULT;
    if (this.chatPanel) this.chatPanel.style.opacity = 0;
  }

  initChat( remote ){
    this.tmpVec3.copy( remote.position ).sub( this.player.position );

    const v0 = new THREE.Vector3(0, 1, 0);
    v0.cross( this.tmpVec3 ).normalize().multiplyScalar(this.tmpVec3.length()*1.5);

    const target = this.player.position.clone().add( this.tmpVec3.multiplyScalar(0.5 ));
    target.y += 2;

    const origin = target.clone().add(v0);

    if (this.chatPanel) this.chatPanel.style.opacity = 1;

    return { origin, target, id: remote.userData.id, changeTime: Date.now() };
  }

    random( min, max ){
        return Math.random() * (max-min) + min;
    }
    
    setEnvironment(){
        const loader = new RGBELoader();
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        loader.load( 'assets/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();
    
          this.scene.environment = envMap;
    
        }, (xhr)=>{
          this.loadingBar.update('envmap', xhr.loaded, xhr.total );
        }, (err)=>{
            console.error( 'An error occurred setting the environment.' + err.message );
        } );
      }
        
      loadEnvironment(){
        const loader = new GLTFLoader( ).setPath('../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../../../node_modules/three/examples/jsm/libs/draco/' );
        loader.setDRACOLoader( dracoLoader );
    
        // Load a glTF resource
        loader.load(
          // resource URL
          `knightland.glb`,
          // called when the resource is loaded
          gltf => {
                    
            this.scene.add( gltf.scene );
            
            gltf.scene.traverse( child => {
                if (child.isMesh){
                    child.material.depthTest = true;
                    child.material.depthWrite = true;
                    child.material.metalness = 0;
                    child.material.roughness = 1;
                }
                if (child.name == "CamStart"){
                    const pos = new THREE.Vector3();
                    child.getWorldPosition(pos);
                    this.camera.position.copy(pos);
                }else if (child.name == "CamTarget"){
                    this.player = new Player( this.scene, this );
                    this.player.visible = false;
                    const pos = new THREE.Vector3();
                    child.getWorldPosition(pos);
                    //this.scene.add(this.player);
                    this.player.position.copy(pos);
                    pos.y += 2;
                    this.camera.lookAt(pos);
                    this.player.attach(this.camera);
                    if (this.navmesh) this.player.userData.navmesh = this.navmesh;
                    this.player.userData.camera = this.camera;
                }else if (child.name == "NavMesh"){
                    this.navmesh = child;
                    child.material.visible = false;
                    if (this.player) this.player.userData.navmesh = this.navmesh;
                }
            });

            this.loadCharacters();
          },
          // called while loading is progressing
          (xhr)=>{
            this.loadingBar.update('environment', xhr.loaded, xhr.total );
          },
          // called when loading has errors
          err => {
    
            console.error( err.message );
    
          }  
        );
      }

      loadCharacters(){
        const loader = new GLTFLoader( ).setPath('../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../../../node_modules/three/examples/jsm/libs/draco/' );
        loader.setDRACOLoader( dracoLoader );
    
        // Load a glTF resource
        loader.load(
          // resource URL
          `characters.glb`,
          // called when the resource is loaded
          gltf => {             
                this.characters = gltf;  
                const names = [ 'Archer', 'Knight', 'Mage', 'Paladin', 'Peasant', 'Soldier' ];
                const name = names[ Math.floor( Math.random() * names.length ) ];          
                //if (this.player) this.player.cloneGLTF(gltf, name );
                this.choose = new Choose(this);
                this.initSocket();
                this.loadingBar.visible = false;
                const overlay = document.getElementById("overlay");
                if (overlay){
                  overlay.addEventListener("transitionend", () => {
                    console.log("Game: overlay transition ended");
                    overlay.style.display = "none";
                  });
                  overlay.style.opacity = 0;
                }
          },
          // called while loading is progressing
          (xhr)=>{
            this.loadingBar.update('characters', xhr.loaded, xhr.total );
          },
          // called when loading has errors
          err => {
    
            console.error( err.message );
    
          }  
        );
      }

    positionPlayer(){
      const posAttr = this.navmesh.geometry.getAttribute("position");
      const pos = new THREE.Vector3();
      const index = Math.floor(Math.random() * posAttr.count);
      pos.x = posAttr.getX(index);
      pos.y = posAttr.getY(index);
      pos.z = posAttr.getZ(index);
      this.navmesh.localToWorld(pos);
      //this.player.worldToLocal(pos);
      this.player.position.copy(pos);
    }

    initSocket(){
        const socket = io();

        this.remotePlayers = [];

        if (socket){

          //this.player.initSocket(socket);

          this.socket = socket;

          this.socket.on('setId', (data)=>{
            this.player.userData.id = data.id;
          });

            //The socket is initialized in the Player constructor
            this.socket.on('remoteData', (data) => {
                //Create and delete remote players
                //console.log( `remoteData: ${JSON.stringify(data)}`);
                this.remotePlayers.forEach( player => player.userData.updated = false );
                data.forEach( packet => {
                    if (packet.id != this.player.userData.id){
                        const result = this.remotePlayers.filter( (remote) => remote.userData.id == packet.id );
                        if (result.length > 0){
                            const remote = result[0];
                            remote.remoteUpdate(packet);
                        }else{
                            const remote = new Remote(this.scene, packet, this.characters);
                            this.remotePlayers.push(remote);
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

            this.socket.on('chat message', (data) => {
              const remote = this.getRemoteById(data.id);

              if (this.speechBubble && remote) {
                if (this.chatPanel) this.chatPanel.style.opacity = 1;
                this.chatData = this.initChat(remote);
                this.speechBubble.remote = remote;
                this.state = states.CHAT;
                this.speechBubble.message = data.message;
                this.speechTime = Date.now();
              }
            });
        }
    }

    getRemoteById( id ){
      const result = this.remotePlayers.filter( remote => remote.userData.id == id );
      if (result.length>0) return result[0];
    }

    deletePlayer( player ){
      const index = this.remotePlayers.indexOf(player);
      if (index!=-1){
          this.remotePlayers.splice(index, 1);
          this.scene.remove(player);
      }
    }

    initScene(){

        const container = document.createElement( 'div' );
		    document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		    this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 200 );
		    this.camera.position.set( 0, 10, 0 );
        
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog( 0xddddee, 50, 100 );

        this.scene.add( new THREE.HemisphereLight( 0xffffff, 0x404040, 2) );
          
        this.renderer = new THREE.WebGLRenderer({ antialias: true } );
        this.renderer.setPixelRatio( window.devicePixelRatio );
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        const light = new THREE.DirectionalLight(0xFFFFFF, 2);
        light.position.set(1,3,3);
        this.scene.add(light);
        
		    container.appendChild( this.renderer.domElement );

        this.setEnvironment();

        this.loadEnvironment();

        this.loadSkybox();

        this.speechBubble = new SpeechBubble( "Hello", 1 );
    } 

    loadSkybox(){
        this.scene.background = new THREE.CubeTextureLoader()
	        .setPath( `../assets/paintedsky/` )
            .load( [
                'px.jpg',
                'nx.jpg',
                'py.jpg',
                'ny.jpg',
                'pz.jpg',
                'nz.jpg'
            ], () => {
                //this.renderer.setAnimationLoop(this.render.bind(this));
            } );
    }

    initCameraPath(){
      this.cameraPath = new CameraPath( new THREE.Vector3(this.camera.position.x, 35, this.camera.position.z), this.camera.position, 40, Date.now() );
      this.state = states.CAMERAPATH;
      this.tmpVec3.copy( this.player.position );
      this.tmpVec3.y += 2;
    }

    render(){
        this.renderer.render( this.scene, this.camera );
        const dt = this.clock.getDelta();
        if (this.player) this.player.update(dt);
        if (this.remotePlayers){
          this.remotePlayers.forEach( remote => { remote.update(dt, this.camera); });
        }
        switch(this.state){
          case states.CHOOSE:
            if (this.choose) this.choose.update(dt);
            break;
          case states.CAMERAPATH:
            if (this.cameraPath && this.cameraPath.startTime){
              const elapsedTime = Date.now() - this.cameraPath.startTime;
              if (elapsedTime < 6000){
                this.cameraPath.getPoint( elapsedTime/6000, this.camera.position );
              }else{
                this.camera.position.copy(this.cameraPath.end );
                this.state = states.DEFAULT;
              }
              this.camera.lookAt( this.tmpVec3 );
            }else{
              this.state = states.DEFAULT;
            }
            break;
          case states.CHAT:
            if (this.chatData){
              this.camera.position.lerp( this.chatData.origin, 0.1 );
              this.tmpQuat.clone( this.camera.quaternion );
              this.camera.lookAt( this.chatData.target );
            }
            break;
        }

        if (this.chatData){
          const elapsedTime = Date.now() - this.chatData.changeTime;
          if (elapsedTime>3000){
            if (this.speechBubble) this.speechBubble.visible = false;
            this.endChat();
          }else if (this.speechBubble && this.speechBubble.visible){
            this.speechBubble.update(this.camera.position);
          }
        }
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}