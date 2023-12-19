import { Avatar } from "./Avatar.js"

export class Remote extends Avatar{
    constructor(scene, packet, characters){
        super(scene);

        this.cloneGLTF( characters, packet.m );

        this.userData.id = packet.id;

        this.remoteUpdate( packet );
    }

    remoteUpdate(data){
        this.position.set( data.x, data.y, data.z );
        this.rotation.y = data.h;
        this.action = data.a;
        this.userData.updated = true;
    }
}