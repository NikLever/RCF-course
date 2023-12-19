import { Raycaster, Vector3, PointLight } from 'three';
import { Avatar } from "./Avatar.js"

export class Player extends Avatar{
    constructor( scene ){
        super( scene );

        this.raycaster = new Raycaster();
        this.down = new Vector3(0, -1, 0);
        this.tmpVec = new Vector3();
        this.tmpPos = new Vector3();
        this.tmpPos2 = new Vector3();

        const light = new PointLight( 0xFFFFFF, 8 );
        light.position.set(-0.5, 1.5, -0.75);
        this.add(light);

        this.addKeyboardControl();
    }

    initSocket(socket){
        //console.log("PlayerLocal.initSocket");
        this.socket = socket;

        this.socket.emit('init', { 
            m: this.name,
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
            //console.log(`Player.updateSocket - a:${this.actionName}, h:${this.rotation.y.toFixed(1)}, x:${this.position.x.toFixed(1)}, y:${this.position.y.toFixed(1)}, z:${this.position.z.toFixed(1)})`);
            this.socket.emit('update', {
                a: this.actionName,
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                h: this.rotation.y
            })
        }
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
                    this.action = "Idle";
                    break;
                case 'KeyS':
                    this.userData.move.forward = 0;
                    this.action = "Idle";
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
        super.update(dt);

        if ( this.userData.move ){
            this.dt = dt;
            //Get current position so we can restore it if player goes off path via a move
            this.tmpPos.copy(this.position);
            if ( this.userData.move.forward ){
                const speed = dt * 2 * this.userData.move.forward;
                this.translateZ( speed );
                if (this.onPath(true, speed)){
                    this.action = "Walk";
                }else{
                    this.action = "Idle";
                    this.position.copy(this.tmpPos);
                }
            }

            if ( this.userData.move.turn ){
                this.action = "Walk";
                const rot = dt * 1 * this.userData.move.turn;
                this.rotateY( rot );
            }else if (!this.userData.move.forward){
                this.action = "Idle";
            }
        }

        if (this.helper) this.helper.update();

        this.updateSocket();
    }
}