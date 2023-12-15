import { Mesh, Raycaster, Vector3 } from 'three';
import { alignMeshToEdge } from './EdgeUtils.js';

export class Player extends Mesh{
    constructor(geometry, material){
        super(geometry, material);

        this.raycaster = new Raycaster();
        this.down = new Vector3(0, -1, 0);
        this.tmpVec = new Vector3();
        this.tmpPos = new Vector3();
        this.faceVertices = [ new Vector3(), new Vector3(), new Vector3() ];
        this.tmpPos2 = new Vector3();
        this.face;

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
                    break;
                case 'KeyS':
                    this.userData.move.forward = 0;
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

    update(dt){
        if ( this.userData.move ){
            this.dt = dt;
            //Get current position so we can restore it if player goes off path via a move
            this.tmpPos.copy(this.position);
            if ( this.userData.move.forward ){
                const speed = dt * 2 * this.userData.move.forward;
                this.translateZ( speed );
                if (!this.onPath(true, speed)) this.position.copy(this.tmpPos);
            }

            if ( this.userData.move.turn ){
                const rot = dt * 2 * this.userData.move.turn;
                this.rotateY( rot );
            }
        }
    }
}