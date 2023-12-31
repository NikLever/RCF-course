import { Curve, Vector3 } from 'three'

export class CameraPath extends Curve {

	constructor( start = new Vector3(), end = new Vector3(), radius = 40, startTime ) {

		super();

		this.isCameraPath = true;

		this.type = 'CameraPath';

		this.start = start.clone();
		this.end = end.clone();
		this.radius = radius;
        this.startTime = startTime;

        this.v0 = new Vector3();
	}

	getPoint( t, optionalTarget = new Vector3() ) {

		const point = optionalTarget;

		const theta = t * Math.PI * 2;
        this.v0.x = Math.sin(theta) * this.radius * (1-t);
        this.v0.z = Math.cos(theta) * this.radius * (1-t);

        point.copy(this.start).lerp(this.end, t).add(this.v0);

		return point;
	}

	copy( source ) {

		super.copy( source );

		this.start.copy( source.start );
		this.end.copy( source.end);
		this.radius = source.radius;

		return this;

	}

	toJSON() {

		const data = super.toJSON();

		data.start = this.start.toArray();
		data.end = this.end.toArray();
		data.radius = this.radius;

		return data;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		this.start.fromArray( json.start );
		this.end.fromArray( json.end );
		this.radius = json.radius;

		return this;

	}

}