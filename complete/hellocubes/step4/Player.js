import { Cube } from './Cube.js';
import { Vector3, Matrix4 } from 'three'

export class Player extends Cube{
    constructor(game, floorSize){
        super(game.scene);

        this.userData.floorSize = floorSize;
        this.addKeyboardControl();

        game.socket = this.initSocket();
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

    initSocket(){
        //console.log("PlayerLocal.initSocket");
        this.socket = io();

        this.socket.emit('init', { 
            color: this.material.color.getHex(),
            x: this.position.x,
            y: this.position.y,
            z: this.position.z,
            h: this.rotation.y
        });

        this.socket.on('setId', (data)=>{
            this.userData.id = data.id;
        })

        return this.socket;
    }
    
    updateSocket(){
        if (this.socket !== undefined){
            //console.log(`PlayerLocal.updateSocket - rotation(${this.object.rotation.x.toFixed(1)},${this.object.rotation.y.toFixed(1)},${this.object.rotation.z.toFixed(1)})`);
            this.socket.emit('update', {
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                h: this.rotation.y
            })
        }
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

            this.updateSocket();
        }
    }
}