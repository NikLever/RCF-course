import { Cube } from "./Cube.js";
import { Color } from "three"

export class Remote extends Cube{
    constructor(scene, packet){
        super(scene);

        this.material.color = new Color( packet.color );
        this.material.needsUpdate = true;

        this.userData.id = packet.id;

        this.update( packet );
    }

    update(data){
        this.position.set( data.x, data.y, data.z );
        this.rotation.y = data.heading;
        this.userData.updated = true;
    }
}