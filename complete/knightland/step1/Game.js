import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'


export class Game{
	constructor(){
        this.debug = false;

        this.initScene();

        controls = new OrbitControls( this.camera, this.renderer.domElement );
        controls.target.y = 1;
        controls.update();
        
        window.addEventListener('resize', this.resize.bind(this) );

        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	

    random( min, max ){
        return Math.random() * (max-min) + min;
    }
    
    setEnvironment(){
        const loader = new RGBELoader();
        const pmremGenerator = new THREE.PMREMGenerator( this.renderer );
        pmremGenerator.compileEquirectangularShader();
        
        loader.load( '../assets/venice_sunset_1k.hdr', ( texture ) => {
          const envMap = pmremGenerator.fromEquirectangular( texture ).texture;
          pmremGenerator.dispose();
    
          this.scene.environment = envMap;
    
        }, undefined, (err)=>{
            console.error( 'An error occurred setting the environment.' + err.message );
        } );
      }
        
      loadGLTF(name){
        const loader = new GLTFLoader( ).setPath('../assets/');
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath( '../../../node_modules/three/examples/jsm/libs/draco/' );
        loader.setDRACOLoader( dracoLoader );
    
        // Load a glTF resource
        loader.load(
          // resource URL
          `${name}.glb`,
          // called when the resource is loaded
          gltf => {
                    
            this.scene.add( gltf.scene );
                    
            //loadingBar.visible = false;
            
            //update();
          },
          // called while loading is progressing
          xhr => {
    
            //loadingBar.progress = (xhr.loaded / xhr.total);
            
          },
          // called when loading has errors
          err => {
    
            console.error( err.message );
    
          }  
        );
      }

    initScene(){

        const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 200 );

		this.camera.position.set( 0, 3, 5 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x0a0a0a );
		this.scene.fog = new THREE.Fog( 0x0a0a0a, 50, 100 );

		this.scene.add( new THREE.HemisphereLight( 0xffffff, 0x404040, 1.5) );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );

        const light = new THREE.DirectionalLight(0xFFFFFF, 3);
        light.position.set(1,3,3);
        this.scene.add(light);
        
		container.appendChild( this.renderer.domElement );

        this.setEnvironment();

        this.loadGLTF('knightland');
    } 

    render(){
        this.renderer.render( this.scene, this.camera );
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}