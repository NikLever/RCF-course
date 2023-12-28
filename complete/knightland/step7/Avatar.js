import { Group, AnimationMixer, TextureLoader, PlaneGeometry, MeshBasicMaterial, Mesh } from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { NameTag } from './NameTag.js';

export class Avatar extends Group{
    constructor( scene ){
        super();

        this.scene = scene;
        scene.add(this);

        this.heights = { Archer: 1.9, Knight: 1.8, Mage: 2.1, Paladin: 1.7, Peasant: 1.9, Soldier: 2.0 }

        this.createFloorShadow();
    }

    createFloorShadow(){
        const tex = new TextureLoader().setPath('../assets/').load( 'floorshadow.png' );

        const material = new MeshBasicMaterial( { map: tex, transparent: true, opacity: 0.5 });
        const geometry = new PlaneGeometry(1,1).rotateX( -Math.PI/2 );

        const mesh = new Mesh( geometry, material );
        mesh.position.y = 0.01;

        this.add( mesh )
    }

    addNameTag(name){
        this.nameTag = new NameTag(name);
        this.nameTag.position.y = this.heights[this.name];
        this.add( this.nameTag );
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

    update(dt, camera){
        if (this.mixer) this.mixer.update(dt);
        if (this.nameTag && camera) this.nameTag.update( camera.position );
    }
}