import { Mesh, Raycaster, Vector3 } from 'three';

export class Player extends Mesh{
    constructor(geometry, material){
        super(geometry, material);

        this.raycaster = new Raycaster();
        this.down = new Vector3(0, -1, 0);
        this.tmpVec = new Vector3();
        this.tmpPos = new Vector3();

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

    onPath(){
        if (!this.userData.navmesh) return;

        this.getWorldPosition(this.tmpVec);
        this.tmpVec.y += 2;
        this.raycaster.set(this.tmpVec, this.down);
        const intersects = this.raycaster.intersectObject( this.userData.navmesh );

        if (intersects.length>0){
            this.position.y = intersects[0].point.y;
            return true;
        }

        return false;
    }

    update(dt){
        if ( this.userData.move ){

            //Get current position so we can restore it if player goes off path via a move
            this.tmpPos.copy(this.position);
            if ( this.userData.move.forward ){
                const speed = dt * 2 * this.userData.move.forward;
                this.translateZ( speed );
                if (!this.onPath()){
                    this.position.copy(this.tmpPos);
                }
            }

            if ( this.userData.move.turn ){
                const rot = dt * 2 * this.userData.move.turn;
                this.rotateY( rot );
            }
        }
    }
}