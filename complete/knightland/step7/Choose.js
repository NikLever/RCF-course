import { TextureLoader, PlaneGeometry, MeshBasicMaterial, Mesh, 
         AnimationMixer, Group, DirectionalLight, Vector3, Quaternion } from "three"; 
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

export class Choose{
    constructor(game){
        const btnLeft = document.getElementById('arrow-left');
        btnLeft.addEventListener("click", this.updateAvatar.bind(this, -1));
        const btnRight = document.getElementById('arrow-right');
        btnRight.addEventListener("click", this.updateAvatar.bind(this, 1));
        const btnSelect = document.getElementById('choose-btn');
        btnSelect.addEventListener("click", this.selectAvatar.bind(this));

        this.characters = game.characters;
        this.index = 0;
        this.scene = game.scene;
        this.player = game.player;
        this.camera = game.camera;
        this.game = game;

        this.init(game.scene, game.camera);
    }

    cloneGLTF(gltf, childIndex){

        const child = gltf.scene.children[ childIndex ];
        this.name = child.name;

		const model = SkeletonUtils.clone( child );

        this.mixer = new AnimationMixer( model );

        this.animations = {};

        gltf.animations.forEach( anim => {
            if (anim.name.startsWith(this.name)) this.animations[anim.name] = anim;
        });

        this.action = "Talk";

        return model;
	}

    set action(name){
		if ( this.actionName == name ) return;
				
		const clip = this.animations[`${this.name}${name}`];

		if (clip!==undefined){
			const action = this.mixer.clipAction( clip );
			action.reset();
			this.actionName = name;
			action.play();
			if (this.curAction) this.curAction.stop();
			this.curAction = action;
		}
	}

    init(scene, camera){
        const light = new DirectionalLight(0xFFFFFF, 4);
        light.position.set(1,2,-1);
        scene.add(light);

        const pos = camera.getWorldPosition(new Vector3());
        const quat = camera.getWorldQuaternion( new Quaternion() );
        
        camera.removeFromParent();
        camera.position.copy(pos);
        camera.quaternion.copy(quat);

        const geometry = new PlaneGeometry(2.5, 2).rotateY(Math.PI);
        const tex = new TextureLoader().setPath("../assets/").load( 'choose.png' );
        const material = new MeshBasicMaterial({ map: tex, transparent: true });
        const mesh = new Mesh( geometry, material );
        mesh.position.copy(pos);
        mesh.translateZ(2.2);
        mesh.translateX(-0.1);
        mesh.translateY(-0.2);
        scene.add(mesh);
        this.mesh = mesh;
        
        this.avatar = new Group();
        this.avatar.position.copy(pos);
        this.avatar.translateZ(1.5);
        this.avatar.translateX(-0.05);//-0.1);
        this.avatar.translateY(-0.3);
        const scale = 0.3;
        this.avatar.scale.set(scale, scale, scale);
        scene.add(this.avatar);

        this.updateAvatar(0);
    }

    selectAvatar(){
        const input = document.querySelector('[name="name"]'); 

        if (input.value==null || input.value==""){
            input.style.border = "red solid 4px";
            const message = document.getElementById("instructions");
            message.innerText = "Please enter a username";
            message.style.color = "red"; 

            setTimeout( ()=>{
                input.style.border = "black solid 1px";
                message.innerText = "Use the arrow buttons to select an avatar. Enter your username then press the Select button.";
                message.style.color = "brown"; 
            }, 2000);

            return;
        }

        if (this.character){
            this.character.position.set( 0, 0, 0 );
            this.character.quaternion.copy(this.characters.scene.children[0].quaternion);
            this.action = "Idle";
            this.player.add(this.character);
            this.player.curAction = this.curAction;
            this.player.actionName = this.actionName;
            this.player.userName = input.value;
            this.player.name = this.name;
            this.player.animations = this.animations;
            this.player.mixer = this.mixer;
            this.player.visible = true;
            this.player.attach(this.camera);
            this.player.initSocket(this.game.socket);
            this.player.addNameTag( input.value );
            this.game.positionPlayer();
        }else{
            return;
        }
        const panel = document.getElementById("choose");
        panel.style.display = "none";
        this.mesh.visible = false;
        const logo = document.getElementById('logo');
        logo.style.top = "-200px";
        const selectBtn = document.getElementById('choose-btn');
        selectBtn.style.display = "none";
    }

    updateAvatar(inc){
        if (!this.characters) return;
        this.index += inc;
        if (this.index < 0){
            this.index += this.characters.scene.children.length;
        }else if (this.index >= this.characters.scene.children.length){
            this.index = 0;
        }
        if (this.character){
            if (this.curAction){
                this.curAction.stop();
                const clip = this.curAction.getClip();
                this.mixer.uncacheAction(clip);
                this.mixer.uncacheClip(clip);
                this.mixer.uncacheRoot(this.mixer.getRoot());
            }
            this.avatar.remove(this.character);
        }
        this.actionName = "";
        this.character = this.cloneGLTF( this.characters, this.index );
        this.character.rotateZ(Math.PI);
        this.avatar.add(this.character);
    }

    update(dt){
        if (!this.mesh.visible) return;
        if (this.mixer) this.mixer.update(dt);
    }
}