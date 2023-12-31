import { Mesh, CanvasTexture, MeshBasicMaterial, PlaneGeometry } from 'three'

export class NameTag extends Mesh{
    constructor(name){
        super();

        this.init(name);
    }

    init(name){
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 32;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#D9BB57";
        ctx.fillRect(0, 0, 128, 32);
        ctx.font = "20px AngelWish";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = "#584712";
        ctx.fillText(name, 64, 16);

        const tex = new CanvasTexture(canvas);
        this.material = new MeshBasicMaterial( { map: tex });
        this.geometry = new PlaneGeometry( 0.6, 0.15 ).rotateY(Math.PI);;

        this.material.needsUpdate = true;
    }

    update( pos ){
        this.lookAt(pos);
    }
}