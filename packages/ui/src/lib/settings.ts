import { ref } from 'vue';
import { isOverlay } from './constants';
import { AMMO_TYPE, Platform } from './constants/data';

export enum UserMode {
	Basic = 'basic',
	Advanced = 'advanced',
}

export enum BackdropMode {
	None = 'none',
	Map = 'map',
	Grid = 'overlay',
}

export enum MapSource {
	Vanilla = 'vanilla',
	ImprovedMapModRustardKnightEdit = 'improved-map-mod-rustard-knight-edit',
	ImprovedMapModRustardKnightEditHd = "improved-map-mod-rustard-knight-edit-hd"
}

export const settings = ref({
	lockPan: false,
	lockRotate: true,
	lockZoom: false,

	transparentOverlay: isOverlay,
	backdropMode: isOverlay ? BackdropMode.Grid : BackdropMode.Map,
	mapSource: MapSource.ImprovedMapModRustardKnightEdit,
	userMode: UserMode.Basic,
	globalAmmo: undefined as AMMO_TYPE | undefined,
	globalPlatform: undefined as Platform<AMMO_TYPE> | undefined,

	useNatoAlphabet: true,
	showTooltip: true,
	showWindMeters: false,
	toggleButtonScale: 1,
	unitIconScale: 1,
	unitSettingsScale: 1,
	gridDashLength: 3,
	gridDashGap: 0,
	gridLineWidth: 1,
	compassOpacity: 1,
	firingArcOpacity: 0,
	screenshotOpacity: 1,
	showMinMaxSpread: true,
	showXYOffsets: false,
	sync: null as {
		serverAddress: string,
		code: string,
	} | null,
});

export const saveSettings = () => {
	localStorage.setItem('settings', JSON.stringify(settings.value));
};

export const loadSettings = () => {
	const savedSettings = localStorage.getItem('settings');
	if (savedSettings != null) {
		Object.assign(settings.value, JSON.parse(savedSettings));
	}
	console.log(JSON.parse(JSON.stringify(settings.value)));
};
loadSettings();
