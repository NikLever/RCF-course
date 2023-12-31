import { Avatar } from "./Avatar.js"
import { CylinderGeometry, MeshBasicMaterial, Mesh } from "three";

export class Remote extends Avatar{
    constructor(scene, packet, characters){
        super(scene);

        this.cloneGLTF( characters, packet.m );
        this.addNameTag( packet.n );
        this.addCollider();

        this.userData.id = packet.id;

        this.remoteUpdate( packet );
    }

    addCollider(){
        //Used for selection of an remote avatar by raycasting

        const height = this.heights[this.name] - 0.1;
        const geometry = new CylinderGeometry( 0.3, 0.3, height, 6, 1, true );
        geometry.translate( 0, height/2, 0 );
        const material = new MeshBasicMaterial( { wireframe: true, visible: false });

        const collider = new Mesh( geometry, material );
        collider.name = 'collider';

        this.height = height;

        this.add(collider);
    }

    remoteUpdate(data){
        this.position.set( data.x, data.y, data.z );
        this.rotation.set( data.pb, data.h, data.pb );
        this.action = data.a;
        this.userData.updated = true;
    }
}