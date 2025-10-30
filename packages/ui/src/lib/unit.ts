import { type Ref, ref } from 'vue';
import {
	ARTILLERY_BY_PLATFORM,
	ArtilleryPlatform,
} from '@packages/data/dist/artillery/unit/constants';
import {
	type Unit,
	type UnitMap,
	UnitType,
} from '@packages/data/dist/artillery/unit';
import { Vector } from '@packages/data/dist/artillery/vector';
import { generateId } from '@packages/data/dist/id';
import { natoAlphabet } from '@/lib/names';
import { settings, UserMode } from '@/lib/settings';

export const getAvailableUnitTypes = (): UnitType[] => {
	if (settings.value.userMode === UserMode.Basic) {
		return [
			UnitType.Artillery,
			UnitType.Location,
			UnitType.Target,
			UnitType.LandingZone,
		];
	} else {
		return [
			UnitType.Artillery,
			UnitType.Spotter,
			UnitType.Location,
			UnitType.Target,
			UnitType.LandingZone,
		];
	}
};

export const createUnit = (
	type: UnitType,
	vector: Ref<Vector>,
	parentId?: string,
	specs?: Pick<Unit, 'ammunition' | 'platform' | 'spottingType'>
): Ref<Unit> => {
	return ref({
		id: generateId(),
		type,
		vector: vector.value.angularVector,
		canDrag: parentId == null,
		parentId,
		ammunition: specs?.ammunition,
		platform: specs?.platform,
		spottingType: specs?.spottingType,
	});
};

export const getUnitResolvedVector = (
	unitMap: UnitMap,
	unitId: string
): Vector => {
	const unit = unitMap[unitId];

	if (unit == null) {
		return Vector.fromCartesianVector({ x: 0, y: 0 });
	}

	if (unit.parentId != null)
		return Vector.fromAngularVector(unit.vector).addVector(getUnitResolvedVector(unitMap, unit.parentId));

	return Vector.fromAngularVector(unit.vector).addVector(Vector.zero());
};

export const getUnitDefaultLabel = (
	unitMap: UnitMap,
	unitId: string
): string => {
	const unitNumber = Object.keys(unitMap).indexOf(unitId);
	const natoName = settings.value.useNatoAlphabet
		? natoAlphabet[unitNumber]
		: undefined;
	return natoName || String(unitNumber + 1);
};

export const getUnitLabel = (unitMap: UnitMap, unitId: string): string => {
	const unit = unitMap[unitId];

	if (unit == null) {
		return 'Unknown';
	}

	return unit.label || getUnitDefaultLabel(unitMap, unitId);
};

const _getUnitSpecs = (
	unitMap: UnitMap,
	unitId: string
): ArtilleryPlatform | null => {
	if (unitMap[unitId].platform == null) {
		return null;
	}

	return ARTILLERY_BY_PLATFORM[unitMap[unitId].platform] ?? null;
};

export const getUnitSpecs = (
	unitMap: UnitMap,
	unitId: string
): ArtilleryPlatform | null => {
	const unit = unitMap[unitId];

	if (unit.type !== UnitType.Artillery) {
		return null;
	}

	if (settings.value.userMode === UserMode.Advanced) {
		return _getUnitSpecs(unitMap, unitId);
	}

	return null;
};
