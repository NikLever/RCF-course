import { Mesh,
         BoxGeometry,
         MeshStandardMaterial } from "three";

export class Cube extends Mesh{
    constructor(scene){
        super();
        this.geometry = new BoxGeometry().translate(0, 0.5, 0),
        this.material = new MeshStandardMaterial( { color: Math.floor( Math.random() * (1 << 24) ) });
        this.materialNeedsUpdate = true;
        this.castShadow = true;
        scene.add( this );
    }
}