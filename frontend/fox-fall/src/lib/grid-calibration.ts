import { Vector } from '@packages/data/dist/artillery/vector';
import { Viewport } from '@packages/frontend-libs/dist/viewport/viewport';

export async function calibrateGrid(viewport: Viewport) {
	const calibrationPane = document.createElement('div');
	calibrationPane.style.setProperty('position', 'fixed');
	calibrationPane.style.setProperty('inset', '0');
	calibrationPane.style.setProperty('width', '100vw');
	calibrationPane.style.setProperty('height', '100vh');
	calibrationPane.style.setProperty('z-index', '1000000');
	calibrationPane.style.setProperty('font-size', '4vmin');
	calibrationPane.style.setProperty('display', 'flex');
	calibrationPane.style.setProperty('align-items', 'center');
	calibrationPane.style.setProperty('justify-content', 'center');
	calibrationPane.style.setProperty('text-align', 'center');
	calibrationPane.style.setProperty('filter', "url('#outline')");
	calibrationPane.style.setProperty('cursor', 'crosshair');
	calibrationPane.style.setProperty('opacity', '0.6');

	calibrationPane.innerText =
		'Calibrating grid. \n Drag from one corner of a cell to the other';

	let resolve: () => void;
	let reject: (e: unknown) => void;
	const promise = new Promise<void>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	let draggingData: {
		startPosition: Vector;
		endPosition: Vector;
		indicator: HTMLDivElement;
	} | null = null;
	calibrationPane.addEventListener('pointerdown', (event) => {
		event.preventDefault();
		event.stopPropagation();

		const indicator = document.createElement('div');
		indicator.style.setProperty('position', 'absolute');
		indicator.style.setProperty('left', `${event.clientX}px`);
		indicator.style.setProperty('top', `${event.clientY}px`);
		indicator.style.setProperty('border', `1px solid #fff`);
		indicator.style.setProperty('filter', "url('#outline')");
		indicator.style.setProperty('pointer-events', 'none');
		calibrationPane.appendChild(indicator);

		draggingData = {
			startPosition: Vector.fromCartesianVector({
				x: event.clientX,
				y: event.clientY,
			}),
			endPosition: Vector.fromCartesianVector({
				x: event.clientX,
				y: event.clientY,
			}),
			indicator,
		};

		calibrationPane.setPointerCapture(event.pointerId);
		onPointerMove(event);
	});

	const onPointerMove = (event: PointerEvent) => {
		if (draggingData == null) return;
		event.preventDefault();
		event.stopPropagation();

		draggingData.endPosition = Vector.fromCartesianVector({
			x: event.clientX,
			y: event.clientY,
		});

		const startX = Math.min(
			draggingData.startPosition.x,
			draggingData.endPosition.x
		);
		const endX = Math.max(
			draggingData.startPosition.x,
			draggingData.endPosition.x
		);
		const startY = Math.min(
			draggingData.startPosition.y,
			draggingData.endPosition.y
		);
		const endY = Math.max(
			draggingData.startPosition.y,
			draggingData.endPosition.y
		);

		draggingData.indicator.style.setProperty('left', `${startX}px`);
		draggingData.indicator.style.setProperty('width', `${endX - startX}px`);
		draggingData.indicator.style.setProperty('top', `${startY}px`);
		draggingData.indicator.style.setProperty('height', `${endY - startY}px`);
	};
	calibrationPane.addEventListener('pointermove', onPointerMove);

	calibrationPane.addEventListener('pointerup', (event) => {
		if (draggingData == null) return;
		event.preventDefault();
		event.stopPropagation();

		try {
			if (
				draggingData.endPosition.addVector(draggingData.startPosition.scale(-1))
					.distance <= 10
			) {
				throw new Error('Grid size too small');
			}

			viewport.withSmoothing(() => {
				viewport.resetRotation();

				const offset = viewport
					.toWorldOffset(draggingData!.endPosition)
					.addVector(
						viewport.toWorldOffset(draggingData!.startPosition).scale(-1)
					);
				viewport.zoomTo(
					(viewport.zoom * (Math.abs(offset.x) + Math.abs(offset.y))) / 250
				);

				const midpoint = viewport
					.toWorldPosition(
						draggingData!.endPosition.addVector(viewport.viewportSize.scale(-0.5))
					)
					.addVector(
						viewport.toWorldPosition(
							draggingData!.startPosition.addVector(
								viewport.viewportSize.scale(-0.5)
							)
						)
					)
					.scale(0.5);

				viewport.panBy(
					Vector.fromCartesianVector({
						x: Math.round(midpoint.x / 125) * 125 - midpoint.x,
						y: Math.round(midpoint.y / 125) * 125 - midpoint.y,
					})
				);
			});
			resolve();
		} catch(e) {
			reject(e);
		} finally {
			draggingData.indicator.remove();
			draggingData = null;

			calibrationPane.releasePointerCapture(event.pointerId);
		}
	});

	document.body.appendChild(calibrationPane);

	return promise.finally(() => {
		calibrationPane.remove();
	});
}
