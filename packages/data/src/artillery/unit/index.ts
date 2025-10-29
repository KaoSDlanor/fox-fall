import type { Vector } from '../vector';
import type { AMMO_TYPE, Platform, SPOTTING_TYPE } from './constants';

export enum UnitType {
	Artillery = 0,
	Spotter = 1,
	Location = 2,
	Target = 3,
	LandingZone = 4,
}

export const unitTypeOrder = [
	UnitType.Artillery,
	UnitType.Spotter,
	UnitType.Location,
	UnitType.Target,
	UnitType.LandingZone,
];

export type Unit = {
	id: string;
	label?: string;
	type: UnitType;
	vector: Vector;
	parentId?: string;
	canDrag?: boolean;
	selectUnitOnDeletion?: string;
	ammunition?: AMMO_TYPE;
	platform?: Platform<AMMO_TYPE>;
	spottingType?: SPOTTING_TYPE;
};

export type UnitMap = {
	[unitId: string]: Unit;
};