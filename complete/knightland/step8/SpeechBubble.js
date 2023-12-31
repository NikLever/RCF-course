import { PlaneGeometry, MeshBasicMaterial, TextureLoader, Mesh, CanvasTexture } from "three";

export class SpeechBubble extends Mesh{
	constructor(msg, size=1){
        super();

		this.config = { font:'Calibri', size:24, padding:10, colour:'#222', width:256, height:256 };
		
		this.geometry = new PlaneGeometry(size, size);
		this.material = new MeshBasicMaterial()
		
		const loader = new TextureLoader();
		loader.load(
			// resource URL
			`../assets/speech.png`,

			// onLoad callback
			( texture ) => {
				// in this example we create the material when the texture is loaded
				this.img = texture.image;
				this.material.map = texture;
				this.material.transparent = true;
				this.material.needsUpdate = true;
				if (msg!==undefined) this.update(msg);
			},

			// onProgress callback currently not supported
			undefined,

			// onError callback
			( err ) => {
				console.error( 'An error happened.' );
			}
		);
	}

	set remote( rem ){
		rem.add(this);
		this.position.y = (rem.height) ? rem.height : 2;
		this.visible = true;
	}
	
	set message(msg){
		let context = this.context;
		
		if (this.userData.context===undefined){
			const canvas = this.createOffscreenCanvas(this.config.width, this.config.height);
			this.context = canvas.getContext('2d');
			context = this.context;
			context.font = `${this.config.size}pt ${this.config.font}`;
			context.fillStyle = this.config.colour;
			context.textAlign = 'center';
			this.material.map = new CanvasTexture(canvas);
		}
		
		const bg = this.img;
		context.clearRect(0, 0, this.config.width, this.config.height);
		context.drawImage(bg, 0, 0, bg.width, bg.height, 0, 0, this.config.width, this.config.height);
		this.wrapText(msg, context);
		
		this.material.map.needsUpdate = true;
	}
	
	createOffscreenCanvas(w, h) {
		const canvas = document.createElement('canvas');
		canvas.width = w;
		canvas.height = h;
		return canvas;
	}
	
	wrapText(text, context){
		const words = text.split(' ');
        let line = '';
		const lines = [];
		const maxWidth = this.config.width - 2*this.config.padding;
		const lineHeight = this.config.size + 8;
		
		words.forEach( function(word){
			const testLine = `${line}${word} `;
        	const metrics = context.measureText(testLine);
        	const testWidth = metrics.width;
			if (testWidth > maxWidth) {
				lines.push(line);
				line = `${word} `;
			}else {
				line = testLine;
			}
		});
		
		if (line != '') lines.push(line);
		
		let y = (this.config.height - lines.length * lineHeight)/2;
		
		lines.forEach( function(line){
			context.fillText(line, 128, y);
			y += lineHeight;
		});
	}

	update(pos){
		if (pos) this.lookAt(pos);
	}
}