import { computed } from 'vue';
import KAnim from '@kaosdlanor/kanim';
import { useWindowSize } from '@vueuse/core';
import { toRadians, wrapDegrees } from '@packages/data/dist/artillery/angle';
import { Vector } from '@packages/data/dist/artillery/vector';
import { runGlobal } from '@/lib/globalScope';

const { distanceScale, viewportSize } = runGlobal(() => {
	const { height, width } = useWindowSize();

	return {
		distanceScale: computed(() => {
			return Math.min(height.value, width.value) / 250;
		}),
		viewportSize: computed(() => {
			return Vector.fromCartesianVector({
				x: width.value,
				y: height.value,
			});
		}),
	};
});

export class Viewport {
	constructor(
		public position: Vector,
		public rotation: number,
		public zoom: number
	) {}

	get distanceScale(): number {
		return distanceScale.value;
	}

	get viewportSize(): Vector {
		return viewportSize.value;
	}

	get resolvedZoom(): number {
		return this.zoom * this.distanceScale;
	}
	set resolvedZoom(value: number) {
		this.zoom = value / this.distanceScale;
	}

	toWorldOffset(vector: Vector): Vector {
		const transformed = vector.scale(1 / this.resolvedZoom);
		transformed.azimuth -= this.rotation;
		return transformed;
	}

	toWorldPosition(vector: Vector): Vector {
		return this.toWorldOffset(vector.addVector(this.position.scale(-1)));
	}

	toScreenOffset(vector: Vector): Vector {
		const transformed = vector.clone();
		transformed.azimuth += this.rotation;
		return transformed.scale(this.resolvedZoom);
	}

	toScreenPosition(vector: Vector): Vector {
		return this.toScreenOffset(vector).addVector(this.position);
	}

	rotateBy(rotationDelta: number, center: Vector = Vector.zero()): void {
		this.rotation = wrapDegrees(this.rotation + rotationDelta);

		this.position.cartesianVector = {
			x:
				center.x +
				(this.position.x - center.x) * Math.cos(toRadians(rotationDelta)) -
				(this.position.y - center.y) * Math.sin(toRadians(rotationDelta)),
			y:
				center.y +
				(this.position.y - center.y) * Math.cos(toRadians(rotationDelta)) +
				(this.position.x - center.x) * Math.sin(toRadians(rotationDelta)),
		};
	}

	rotateTo(newRotation: number): void {
		return this.rotateBy(newRotation - this.rotation);
	}

	resetRotation(): void {
		this.rotation = this.rotation > 180 ? 360 : 0;
	}

	panBy(panDelta: Vector): void {
		this.position = this.position.addVector(
			this.toScreenOffset(panDelta).scale(-1)
		);
	}

	panTo(newPosition: Vector): void {
		this.position = this.toScreenOffset(newPosition).scale(-1);
	}

	zoomBy(zoomDelta: number, globalPinPosition: Vector = Vector.zero()): void {
		const viewportPinPosition = this.toWorldPosition(globalPinPosition);

		this.zoom = Math.max(0.001, this.zoom + zoomDelta);

		const cursorDelta = this.toScreenPosition(viewportPinPosition).addVector(
			globalPinPosition.scale(-1)
		);

		this.position = this.position.addVector(cursorDelta.scale(-1));
	}

	zoomTo(newZoom: number, globalPinPosition?: Vector): void {
		return this.zoomBy(newZoom - this.zoom, globalPinPosition);
	}

	async withSmoothing(callback: () => void, duration = 250): Promise<void> {
		const currentPosition = this.position.clone();
		const currentZoom = this.zoom;
		const currentRotation = this.rotation;

		callback();

		const newPosition = this.position.clone();
		const newZoom = this.zoom;
		const newRotation = this.rotation;

		await Promise.all([
			KAnim.animate({
				element: this.position,
				property: 'x',
				from: currentPosition.x,
				to: newPosition.x,
				duration,
				easing: 'easeInOutQuad',
			}),
			KAnim.animate({
				element: this.position,
				property: 'y',
				from: currentPosition.y,
				to: newPosition.y,
				duration,
				easing: 'easeInOutQuad',
			}),
			KAnim.animate({
				element: this,
				property: 'zoom',
				from: currentZoom,
				to: newZoom,
				duration,
				easing: 'easeInOutQuad',
			}),
			KAnim.animate({
				element: this,
				property: 'rotation',
				from: currentRotation,
				to: newRotation,
				duration,
				easing: 'easeInOutQuad',
			}),
		]);
	}

	clone(): Viewport {
		return new Viewport(this.position.clone(), this.rotation, this.zoom);
	}
}

export { distanceScale };
