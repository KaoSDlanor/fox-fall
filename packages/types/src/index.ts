export enum UpdateType {
	full = 'full',
	readyToFire = 'readyToFire',
	unit = 'unit',
	wind = 'wind',
}

export type RoomUpdate =
	| {
			type: UpdateType.full;
			eventFrom?: string;
			readyToFire?: boolean;
			units: Record<string, unknown>;
			wind?: unknown;
	  }
	| {
			type: UpdateType.readyToFire;
			eventFrom?: string;
			value: boolean;
	  }
	| {
			type: UpdateType.unit;
			eventFrom?: string;
			unitId: string;
			value: unknown;
	  }
	| {
			type: UpdateType.wind;
			eventFrom?: string;
			value: unknown;
	  };