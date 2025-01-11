import { WIND_OFFSET_PER_RANGE } from './constants';
import { getUnitResolvedVector, type UnitMap } from './unit';
import type { Vector } from './vector';

export const getFiringSolution = (
	unitMap: UnitMap,
	artilleryId: string,
	targetId: string,
	wind: Vector
) => {
	const resolvedVectorFrom = getUnitResolvedVector(unitMap, artilleryId);
	const resolvedVectorTo = getUnitResolvedVector(unitMap, targetId);
	const vectorToTarget = resolvedVectorFrom.getRelativeOffset(resolvedVectorTo);

	let firingVectorWithWind = vectorToTarget.clone();
	if (wind.distance !== 0) {
		const theta = wind.azimuth - vectorToTarget.azimuth;
		const windConstant = wind.distance * WIND_OFFSET_PER_RANGE;
		const quadA = windConstant * windConstant - 1;
		const quadB = -2 * vectorToTarget.distance * windConstant * Math.cos(theta);
		const quadC = vectorToTarget.distance * vectorToTarget.distance;
		const resolvedFiringDistance = (-quadB - Math.sqrt(quadB * quadB - 4 * quadA * quadC)) / (2 * quadA);

		if (resolvedFiringDistance == null) {
			throw new Error('Failed to calculate firing distance');
		}

		const resolvedWindOffset = resolvedFiringDistance * windConstant;
		firingVectorWithWind = vectorToTarget.addVector(
			wind.normalize().scale(-resolvedWindOffset)
		);
	}


	return {
		resolvedVectorFrom,
		resolvedVectorTo,
		firingVector: vectorToTarget,
		firingVectorWithWind,
	};
};

export const getWindEffect = (
	artilleryPosition: Vector,
	landingZonePosition: Vector,
	firingVectorWithWind: Vector
) => {
	const idealLandingZonePosition = firingVectorWithWind.addVector(artilleryPosition);

	const inaccuracy = idealLandingZonePosition.getRelativeOffset(
		landingZonePosition
	);

	return inaccuracy.scale(1 / (WIND_OFFSET_PER_RANGE * firingVectorWithWind.distance));
};
