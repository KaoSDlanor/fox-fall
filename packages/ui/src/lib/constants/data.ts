export enum AMMO_TYPE {
	MORTAR = 'mortar',
	FIRE_ROCKET = '4c fire rocket',
	HIGH_EXPLOSIVE_ROCKET = '3c high explosive rocket',
	SHELL_120MM = '120mm',
	SHELL_150MM = '150mm',
	SHELL_300MM = '300mm',
}

export enum MORTAR_PLATFORM {
	PELTAST = 'HH-d peltast',
	CHARON = 'Type C charon',
	CREMARI = 'Cremari',
}

export enum FIRE_ROCKET_PLATFORM {
	DEIONEUS = 'T13 deionius',
}

export enum HIGH_EXPLOSIVE_ROCKET_PLATFORM {
	RETIARIUS = 'R-17 retiarius skirmisher',
	HADES_NET = 'DAE 3b-2 hades net',
}

export enum SHELL_120MM_PLATFORM {
	KORONIDES = '120-68 koronides field gun',
	TRIDENT = 'AC-b trident',
	CONQUEROR = 'Conqueror',
	TITAN = 'Titan',
}

export enum SHELL_150MM_PLATFORM {
	SARISSA = 'Lance-46 sarissa',
	TITAN = 'Titan',
	THUNDERBOLT = '50-500 thunderbolt',
}

export enum SHELL_300MM_PLATFORM {
	TEMPEST = 'Tempest cannon RA-2',
	STORM_CANNON = 'Storm cannon',
}

export type Platform<AT extends AMMO_TYPE> = AT extends AMMO_TYPE.MORTAR
	? MORTAR_PLATFORM
	: AT extends AMMO_TYPE.FIRE_ROCKET
		? FIRE_ROCKET_PLATFORM
		: AT extends AMMO_TYPE.HIGH_EXPLOSIVE_ROCKET
			? HIGH_EXPLOSIVE_ROCKET_PLATFORM
			: AT extends AMMO_TYPE.SHELL_120MM
				? SHELL_120MM_PLATFORM
				: AT extends AMMO_TYPE.SHELL_150MM
					? SHELL_150MM_PLATFORM
					: AT extends AMMO_TYPE.SHELL_300MM
						? SHELL_300MM_PLATFORM
						: never;

export type ArtillerySpecs = {
	MIN_RANGE: number;
	MAX_RANGE: number;
	RANGE_INCREMENT: number;
	MIN_SPREAD: number;
	MAX_SPREAD: number;
	WIND_OFFSET: number;
};

export type ArtilleryPlatform = ArtillerySpecs &
	(
		| {
				AMMO_TYPE: AMMO_TYPE.MORTAR;
				PLATFORM: MORTAR_PLATFORM;
		  }
		| {
				AMMO_TYPE: AMMO_TYPE.FIRE_ROCKET;
				PLATFORM: FIRE_ROCKET_PLATFORM;
		  }
		| {
				AMMO_TYPE: AMMO_TYPE.HIGH_EXPLOSIVE_ROCKET;
				PLATFORM: HIGH_EXPLOSIVE_ROCKET_PLATFORM;
		  }
		| {
				AMMO_TYPE: AMMO_TYPE.SHELL_120MM;
				PLATFORM: SHELL_120MM_PLATFORM;
		  }
		| {
				AMMO_TYPE: AMMO_TYPE.SHELL_150MM;
				PLATFORM: SHELL_150MM_PLATFORM;
		  }
		| {
				AMMO_TYPE: AMMO_TYPE.SHELL_300MM;
				PLATFORM: SHELL_300MM_PLATFORM;
		  }
	);

export const ARTILLERY_BY_SHELL = {
	[AMMO_TYPE.MORTAR]: {
		[MORTAR_PLATFORM.CHARON]: {
			AMMO_TYPE: AMMO_TYPE.MORTAR,
			PLATFORM: MORTAR_PLATFORM.CHARON,
			MIN_RANGE: 75,
			MAX_RANGE: 100,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 2.5,
			MAX_SPREAD: 9.45,
			WIND_OFFSET: 0,
		},
		[MORTAR_PLATFORM.CREMARI]: {
			AMMO_TYPE: AMMO_TYPE.MORTAR,
			PLATFORM: MORTAR_PLATFORM.CREMARI,
			MIN_RANGE: 45,
			MAX_RANGE: 80,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 5.5,
			MAX_SPREAD: 12,
			WIND_OFFSET: 0,
		},
		[MORTAR_PLATFORM.PELTAST]: {
			AMMO_TYPE: AMMO_TYPE.MORTAR,
			PLATFORM: MORTAR_PLATFORM.PELTAST,
			MIN_RANGE: 45,
			MAX_RANGE: 80,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 2.5,
			MAX_SPREAD: 9.45,
			WIND_OFFSET: 0,
		},
	},

	[AMMO_TYPE.FIRE_ROCKET]: {
		[FIRE_ROCKET_PLATFORM.DEIONEUS]: {
			AMMO_TYPE: AMMO_TYPE.FIRE_ROCKET,
			PLATFORM: FIRE_ROCKET_PLATFORM.DEIONEUS,
			MIN_RANGE: 250,
			MAX_RANGE: 300,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 30,
			MAX_SPREAD: 41.5,
			WIND_OFFSET: 0,
		},
	},

	[AMMO_TYPE.HIGH_EXPLOSIVE_ROCKET]: {
		[HIGH_EXPLOSIVE_ROCKET_PLATFORM.HADES_NET]: {
			AMMO_TYPE: AMMO_TYPE.HIGH_EXPLOSIVE_ROCKET,
			PLATFORM: HIGH_EXPLOSIVE_ROCKET_PLATFORM.HADES_NET,
			MIN_RANGE: 200,
			MAX_RANGE: 425,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 25,
			MAX_SPREAD: 41.5,
			WIND_OFFSET: 0,
		},
		[HIGH_EXPLOSIVE_ROCKET_PLATFORM.RETIARIUS]: {
			AMMO_TYPE: AMMO_TYPE.HIGH_EXPLOSIVE_ROCKET,
			PLATFORM: HIGH_EXPLOSIVE_ROCKET_PLATFORM.RETIARIUS,
			MIN_RANGE: 225,
			MAX_RANGE: 350,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 25,
			MAX_SPREAD: 41.5,
			WIND_OFFSET: 0,
		},
	},

	[AMMO_TYPE.SHELL_120MM]: {
		[SHELL_120MM_PLATFORM.CONQUEROR]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_120MM,
			PLATFORM: SHELL_120MM_PLATFORM.CONQUEROR,
			MIN_RANGE: 100,
			MAX_RANGE: 200,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 2.5,
			MAX_SPREAD: 8.5,
			WIND_OFFSET: 0,
		},
		[SHELL_120MM_PLATFORM.KORONIDES]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_120MM,
			PLATFORM: SHELL_120MM_PLATFORM.KORONIDES,
			MIN_RANGE: 100,
			MAX_RANGE: 250,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 22.5,
			MAX_SPREAD: 30,
			WIND_OFFSET: 0,
		},
		[SHELL_120MM_PLATFORM.TITAN]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_120MM,
			PLATFORM: SHELL_120MM_PLATFORM.TITAN,
			MIN_RANGE: 100,
			MAX_RANGE: 200,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 2.5,
			MAX_SPREAD: 8.5,
			WIND_OFFSET: 0,
		},
		[SHELL_120MM_PLATFORM.TRIDENT]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_120MM,
			PLATFORM: SHELL_120MM_PLATFORM.TRIDENT,
			MIN_RANGE: 200,
			MAX_RANGE: 425,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 2.5,
			MAX_SPREAD: 8.5,
			WIND_OFFSET: 0,
		},
	},

	[AMMO_TYPE.SHELL_150MM]: {
		[SHELL_150MM_PLATFORM.SARISSA]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_150MM,
			PLATFORM: SHELL_150MM_PLATFORM.SARISSA,
			MIN_RANGE: 120,
			MAX_RANGE: 250,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 25,
			MAX_SPREAD: 35,
			WIND_OFFSET: 0,
		},
		[SHELL_150MM_PLATFORM.THUNDERBOLT]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_150MM,
			PLATFORM: SHELL_150MM_PLATFORM.THUNDERBOLT,
			MIN_RANGE: 200,
			MAX_RANGE: 350,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 32.5,
			MAX_SPREAD: 40,
			WIND_OFFSET: 0,
		},
		[SHELL_150MM_PLATFORM.TITAN]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_150MM,
			PLATFORM: SHELL_150MM_PLATFORM.TITAN,
			MIN_RANGE: 100,
			MAX_RANGE: 225,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 2.5,
			MAX_SPREAD: 8.5,
			WIND_OFFSET: 0,
		},
	},

	[AMMO_TYPE.SHELL_300MM]: {
		[SHELL_300MM_PLATFORM.STORM_CANNON]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_300MM,
			PLATFORM: SHELL_300MM_PLATFORM.STORM_CANNON,
			MIN_RANGE: 400,
			MAX_RANGE: 1000,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 50,
			MAX_SPREAD: 50,
			WIND_OFFSET: 0,
		},
		[SHELL_300MM_PLATFORM.TEMPEST]: {
			AMMO_TYPE: AMMO_TYPE.SHELL_300MM,
			PLATFORM: SHELL_300MM_PLATFORM.TEMPEST,
			MIN_RANGE: 350,
			MAX_RANGE: 500,
			RANGE_INCREMENT: 0,
			MIN_SPREAD: 50,
			MAX_SPREAD: 50,
			WIND_OFFSET: 0,
		},
	},
} satisfies {
	[AT in AMMO_TYPE]: {
		[PF in Platform<AT>]: ArtilleryPlatform;
	};
};