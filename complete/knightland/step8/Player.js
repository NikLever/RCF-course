import { Raycaster, Vector3, PointLight, Vector2, Quaternion, Euler } from 'three';
import { Avatar } from "./Avatar.js"

export class Player extends Avatar{
    constructor( scene, game ){
        super( scene );

        this.raycaster = new Raycaster();
        this.down = new Vector3(0, -1, 0);
        this.tmpVec = new Vector3();
        this.tmpPos = new Vector3();
        this.tmpPos2 = new Vector3();
        this.tmpQuat = new Quaternion();
        this.tmpEuler = new Euler();
        this.velocity = new Vector2();
        this.game = game;

        const light = new PointLight( 0xFFFFFF, 8 );
        light.position.set(-0.5, 1.5, -0.75);
        this.add(light);

        this.addKeyboardControl();
    }

    initSocket(socket){
        //console.log("PlayerLocal.initSocket");
        this.socket = socket;

        this.socket.emit('init', { 
            n: this.userName,
            m: this.name,
            x: this.position.x,
            y: this.position.y,
            z: this.position.z,
            h: this.rotation.y,
            pb: this.rotation.x
        });
    }

    updateSocket(){
        if (this.socket !== undefined){
            //this.tmpEuler.setFromQuaternion( this.getWorldQuaternion(this.tmpQuat));
            //console.log(`Player.updateSocket - a:${this.actionName}, h:${this.rotation.y.toFixed(1)}, p:${this.rotation.x.toFixed(1)}, b:${this.rotation.z.toFixed(1)}, x:${this.position.x.toFixed(1)}, y:${this.position.y.toFixed(1)}, z:${this.position.z.toFixed(1)})`);
            this.socket.emit('update', {
                a: this.actionName,
                x: this.position.x,
                y: this.position.y,
                z: this.position.z,
                h: this.rotation.y,
                pb: this.rotation.x
            })

        }
    }

    addKeyboardControl(){
        this.userData.move = { forward: 0, turn: 0 };

        window.addEventListener('keydown', (evt) => {
            if (evt.repeat) return;

            switch(evt.code){
                case 'KeyW':
                    this.forwardTime = Date.now();
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
            if (evt.repeat) return;

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

    checkRemoteCollision(){
        if (!this.game || !this.game.remotePlayers) return false;
        
        const pos = new Vector3();
        const remotePos = new Vector3();
        this.getWorldPosition(pos);

        let result = false;
        
        this.game.remotePlayers.forEach( remote => {
            remote.getWorldPosition(remotePos);
            if (remotePos.distanceToSquared(pos)<0.5){
                result = true;
                return;
            }
        });

        return result;
    }

    updateSeparation(dt){
        if (!this.game.remotePlayers) return;
        const pos3 = new Vector3();
        this.getWorldPosition(pos3);
        const pos2 = new Vector2( pos3.x, pos3.z );
        const a = new Vector2();
        const b = new Vector2();
        //separation code
        const close = new Vector2();
        this.game.remotePlayers.forEach( remote => {
            remote.getWorldPosition(pos3);
            a.copy(pos2);
            b.set(pos3.x, pos3.z);
            a.sub(b);
            const length = a.length();
            if (length < 2){
                this.userData.move.forward *= 0.97;
                close.add(a);
            }
        });

        if (close.length()>0){
            close.normalize();
            pos3.set(close.x, 0, close.y);
            this.worldToLocal(pos3);
            if (pos3.x>0){
                this.rotateY(dt*0.3);
            }else{
                this.rotateY(-dt*0.3);
            }
        }
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
                    if (this.checkRemoteCollision()){
                        this.userData.move.forward = 0;
                        this.action = "Idle";
                        this.position.copy(this.tmpPos);
                    }else{
                        if (this.forwardTime){
                            const elapsedTime = Date.now() - this.forwardTime;
                            //console.log(elapsedTime);
                            if (elapsedTime>800){
                                if (this.userData.move.forward<2.5){
                                    this.userData.move.forward *= 1.03;
                                    if (this.userData.move.forward>1.3){
                                        this.action = "Run";
                                    }
                                }
                            }else{
                                this.action = "Walk";
                            }
                        }else{
                            this.action = "Walk";
                        }
                        this.updateSeparation(dt);
                    }
                }else{
                    this.userData.move.forward = 0;
                    this.action = "Idle";
                    this.position.copy(this.tmpPos);
                }
            }else if (this.forwardTime){
                delete this.forwardTime;
            }

            if ( this.userData.move.turn ){
                if (this.actionName!="Run") this.action = "Walk";
                const rot = dt * 0.5 * this.userData.move.turn;
                this.rotateY( rot );
            }else if (!this.userData.move.forward){
                this.action = "Idle";
            }
        }

        if (this.helper) this.helper.update();

        this.updateSocket();
    }
}