import { Cube } from './Cube.js';

export class Player extends Cube{
    constructor(scene, floorSize){
        super(scene);

        this.userData.floorSize = floorSize;
        this.addKeyboardControl();
    }

    addKeyboardControl(){
        this.userData.move = { forward: 0, turn: 0 };

        window.addEventListener('keydown', (evt) => {
            switch(evt.code){
                case 'KeyW':
                    this.userData.move.forward = -1;
                    break;
                case 'KeyS':
                    this.userData.move.forward = 1;
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

    update(dt){
        if ( this.userData.move ){
            if ( this.userData.move.forward ){
                const speed = dt * 2 * this.userData.move.forward;
                this.translateZ( speed );
                if (this.position.x > this.userData.floorSize) this.position.x = this.userData.floorSize;
                if (this.position.x < -this.userData.floorSize) this.position.x = -this.userData.floorSize;
                if (this.position.z > this.userData.floorSize) this.position.z = this.userData.floorSize;
                if (this.position.z < -this.userData.floorSize) this.position.z = -this.userData.floorSize;
            }

            if ( this.userData.move.turn ){
                const rot = dt * 2 * this.userData.move.turn;
                this.rotateY( rot );
            }
        }
    }
}