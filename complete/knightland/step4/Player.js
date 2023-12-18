import { Group, Raycaster, Vector3, AnimationMixer, 
         TextureLoader, PlaneGeometry, MeshBasicMaterial, Mesh, 
         PointLight, PointLightHelper} from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class Player extends Group{
    constructor( scene ){
        super();

        this.scene = scene;
        this.raycaster = new Raycaster();
        this.down = new Vector3(0, -1, 0);
        this.tmpVec = new Vector3();
        this.tmpPos = new Vector3();
        this.tmpPos2 = new Vector3();
        this.layers.enable(1);

        const light = new PointLight( 0xFFFFFF, 4 );
        light.layers.enable(1);
        light.layers.disable(0);
        light.position.set(-0.5, 1.5, -0.75);
        this.add(light);

        this.createFloorShadow()

        this.addKeyboardControl();
    }

    addKeyboardControl(){
        this.userData.move = { forward: 0, turn: 0 };

        window.addEventListener('keydown', (evt) => {
            switch(evt.code){
                case 'KeyW':
                    this.userData.move.forward = 1;
                    break;
                case 'KeyS':
                    this.userData.move.forward = -1;
                    break;
                case 'KeyA':
                    this.userData.move.turn = 1;
                    break;
                case 'KeyD':
                    this.userData.move.turn = -1;
                    break;
            }
        });

        window.addEventListener('keyup', (evt) => {
            switch(evt.code){
                case 'KeyW':
                    this.userData.move.forward = 0;
                    this.action = "Idle";
                    break;
                case 'KeyS':
                    this.userData.move.forward = 0;
                    this.action = "Idle";
                    break;
                case 'KeyA':
                    this.userData.move.turn = 0;
                    break;
                case 'KeyD':
                    this.userData.move.turn = 0;
                    break;
            }
        });
    }

    createFloorShadow(){
        const tex = new TextureLoader().setPath('../assets/').load( 'floorshadow.png' );

        const material = new MeshBasicMaterial( { map: tex, transparent: true, opacity: 0.5 });
        const geometry = new PlaneGeometry(1,1).rotateX( -Math.PI/2 );

        const mesh = new Mesh( geometry, material );
        mesh.position.y = 0.01;

        this.add( mesh )
    }

    onPath(align = true, offset){
        if (!this.userData.navmesh) return;

        this.getWorldPosition(this.tmpVec);
        this.tmpVec.y += 2;
        this.raycaster.set(this.tmpVec, this.down);
        let intersects = this.raycaster.intersectObject( this.userData.navmesh );

        if (intersects.length>0){
            this.position.y = intersects[0].point.y;
            this.face = intersects[0].face;
            return true;
        }else if (align){
            //Restore position
            this.position.copy(this.tmpPos);
            //Move to left
            this.translateX(offset);
            this.getWorldPosition(this.tmpVec);
            this.tmpVec.y += 2;
            this.raycaster.set(this.tmpVec, this.down);
            let intersects = this.raycaster.intersectObject( this.userData.navmesh );

            const rot = (intersects.length>0) ? 0.01 : -0.01;
            this.rotateY(rot);
        }

        return false;
    }

    cloneGLTF(gltf, childName){
	
        this.name = childName;
        const child = gltf.scene.getObjectByName( childName );
		const model = SkeletonUtils.clone( child );

        this.mixer = new AnimationMixer( model );
        this.add(model);

        this.animations = {};

        gltf.animations.forEach( anim => {
            if (anim.name.startsWith(this.name)) this.animations[anim.name] = anim;
        });

        this.action = "Idle";
	}

    set action(name){
		if ( this.actionName == name ) return;
				
		const clip = this.animations[`${this.name}${name}`];

		if (clip!==undefined){
			const action = this.mixer.clipAction( clip );
			action.reset();
			this.actionName = name;
			action.play();
			if (this.curAction) this.curAction.crossFadeTo(action, 0.5);
			this.curAction = action;
		}
	}

    update(dt){
        if ( this.userData.move ){
            this.dt = dt;
            //Get current position so we can restore it if player goes off path via a move
            this.tmpPos.copy(this.position);
            if ( this.userData.move.forward ){
                const speed = dt * 2 * this.userData.move.forward;
                this.translateZ( speed );
                if (this.onPath(true, speed)){
                    this.action = "Walk";
                }else{
                    this.action = "Idle";
                    this.position.copy(this.tmpPos);
                }
            }

            if ( this.userData.move.turn ){
                const rot = dt * 2 * this.userData.move.turn;
                this.rotateY( rot );
            }
        }

        if (this.helper) this.helper.update();

        if (this.mixer) this.mixer.update(dt);
    }
}