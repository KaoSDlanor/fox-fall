import { toDegrees, toRadians, wrapDegrees } from './angle';

export type AngularVector = {
	distance: number;
	azimuth: number;
};

export type CartesianVector = {
	x: number;
	y: number;
};

export const toCartesianVector = (
	angularVector: AngularVector
): CartesianVector => {
	return {
		x: angularVector.distance * Math.cos(toRadians(angularVector.azimuth - 90)),
		y: angularVector.distance * Math.sin(toRadians(angularVector.azimuth - 90)),
	};
};

export const toAngularVector = (
	cartesianVector: CartesianVector
): AngularVector => {
	const azimuth = wrapDegrees(
		toDegrees(Math.atan2(cartesianVector.y, cartesianVector.x)) + 90
	);
	const distance = Math.sqrt(
		Math.pow(cartesianVector.x, 2) + Math.pow(cartesianVector.y, 2)
	);

	return {
		distance,
		azimuth,
	};
};

// export const getRelativeAngularOffset = (
// 	angularVectorA: AngularVector,
// 	angularVectorB: AngularVector
// ): AngularVector => {
// 	const cartesianVectorA = toCartesianVector(angularVectorA);
// 	const cartesianVectorB = toCartesianVector(angularVectorB);
// 	const cartesianVector: CartesianVector = {
// 		x: cartesianVectorB.x - cartesianVectorA.x,
// 		y: cartesianVectorB.y - cartesianVectorA.y,
// 	};

// 	return toAngularVector(cartesianVector);
// };

export class Vector {
	constructor(
		protected _angularVector?: AngularVector,
		protected _cartesianVector?: CartesianVector
	) {
		if (_angularVector == null && _cartesianVector == null) {
			throw new Error('Must provide either an angular or cartesian vector');
		}
	}

	public static fromAngularVector(angularVector: AngularVector): Vector {
		return new Vector(JSON.parse(JSON.stringify(angularVector)));
	}

	public static fromCartesianVector(cartesianVector: CartesianVector): Vector {
		return new Vector(undefined, JSON.parse(JSON.stringify(cartesianVector)));
	}

	public static zero(): Vector {
		return Vector.fromCartesianVector({ x: 0, y: 0 });
	}

	public get angularVector(): AngularVector {
		if (this._angularVector == null) {
			this._angularVector = toAngularVector(this._cartesianVector!);
		}

		return this._angularVector;
	}
	public set angularVector(angularVector: AngularVector) {
		this._angularVector = angularVector;
		this._cartesianVector = undefined;
	}

	public get cartesianVector(): CartesianVector {
		if (this._cartesianVector == null) {
			this._cartesianVector = toCartesianVector(this._angularVector!);
		}

		return this._cartesianVector;
	}
	public set cartesianVector(cartesianVector: CartesianVector) {
		this._cartesianVector = cartesianVector;
		this._angularVector = undefined;
	}

	public get azimuth(): number {
		return this.angularVector.azimuth;
	}
	public set azimuth(azimuth: number) {
		this.angularVector = {
			distance: this.distance,
			azimuth,
		};
	}

	public get distance(): number {
		return this.angularVector.distance;
	}
	public set distance(distance: number) {
		this.angularVector = {
			distance,
			azimuth: this.azimuth,
		};
	}

	public get x(): number {
		return this.cartesianVector.x;
	}
	public set x(x: number) {
		this.cartesianVector = {
			x,
			y: this.y,
		};
	}

	public get y(): number {
		return this.cartesianVector.y;
	}
	public set y(y: number) {
		this.cartesianVector = {
			x: this.x,
			y,
		};
	}

	public clone() {
		return new Vector(this._angularVector, this._cartesianVector);
	}

	// protected getRelativeAngularOffset(vector: Vector): Vector {
	// 	return Vector.fromAngularVector(
	// 		getRelativeAngularOffset(this.angularVector, vector.angularVector)
	// 	);
	// }

	public getRelativeOffset(vector: Vector): Vector {
		return Vector.fromCartesianVector({
			x: vector.x - this.x,
			y: vector.y - this.y,
		});
	}

	public addVector(vector: Vector): Vector {
		return Vector.fromCartesianVector({
			x: this.x + vector.x,
			y: this.y + vector.y,
		});
	}

	public scale(scale: number): Vector {
		return Vector.fromCartesianVector({
			x: this.x * scale,
			y: this.y * scale,
		});
	}

	public normalize(): Vector {
		return this.scale(1 / this.distance);
	}

	public getAngleTo(vector: Vector): number {
		return wrapDegrees(vector.azimuth - this.azimuth);
	}

	public dotProduct(vector: Vector): number {
		return this.x * vector.x + this.y * vector.y;
	}
}
