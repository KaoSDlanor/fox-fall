import { type Ref, ref, watchEffect } from 'vue';
import { useScopePerKey } from '@kaosdlanor/vue-reactivity';
import { useEventListener } from '@vueuse/core';
import { getFiringSolution, getWindEffect } from '@/lib/firing-calculations';
import { settings } from '@/lib/settings';
import {
	type Unit,
	type UnitMap,
	createUnit,
	UnitType,
	getUnitResolvedVector,
} from '@/lib/unit';
import { Vector } from '@/lib/vector';
import { Viewport } from '@/lib/viewport';
import { useViewportControl } from './viewport-control';

type ArtilleryOptions = {
	containerElement?: Ref<HTMLElement | null>;
	onUnitUpdated?: (unitId: string) => unknown;
	onWindUpdated?: () => unknown;
};
export const useArtillery = (options: ArtilleryOptions = {}) => {
	const cursor = ref(Vector.fromCartesianVector({ x: 0, y: 0 }));
	const readyToFire = ref(false);
	const wind = ref(Vector.fromAngularVector({ azimuth: 0, distance: 0 }));
	const unitMap = ref<UnitMap>({});
	const unitSelector = ref<{
		selectUnit: (unitId?: string | null) => unknown;
		prompt?: string;
	} | null>(null);
	const selectedUnit = ref<Unit['id'] | null>(null);
	const pinnedUnits = ref<Set<Unit['id']>>(new Set());
	const highlightedUnits = ref<Set<Unit['id']>>(new Set());

	const containerElement = options.containerElement ?? ref(null);
	const viewport = ref(
		new Viewport(
			Vector.fromCartesianVector({
				x: 0,
				y: 0,
			}),
			0,
			1
		)
	);

	viewport.value.panTo(Vector.fromCartesianVector({ x: 0, y: 0 }));

	const viewportControl = useViewportControl({
		containerElement,
		viewport,
	});

	const addUnit = (
		type: UnitType,
		event?: PointerEvent,
		vector?: Ref<Vector>,
		parentUnitId?: string
	) => {
		if (vector == null) {
			vector = ref(
				Vector.fromAngularVector({
					azimuth: 0,
					distance: 42,
				})
			);
			if (parentUnitId == null) {
				vector.value = viewport.value.toWorldPosition(Vector.zero());
			}
		}

		const parentUnit = parentUnitId ? unitMap.value[parentUnitId] : undefined;
		const newUnit = createUnit(type, vector, parentUnitId);

		if (event) {
			newUnit.value.vector = viewport.value.toWorldPosition(
				Vector.fromCartesianVector({
					x: event.clientX,
					y: event.clientY,
				})
			);
			if (parentUnit) {
				newUnit.value.vector = newUnit.value.vector.addVector(
					getUnitResolvedVector(unitMap.value, parentUnit.id).scale(-1)
				);
			}
		}

		unitMap.value[newUnit.value.id] = newUnit.value;
		selectedUnit.value = newUnit.value.id;
		options.onUnitUpdated?.(newUnit.value.id);

		return newUnit;
	};

	const removeUnit = (unitId: string) => {
		const unit = unitMap.value[unitId];
		if (unit == null) return;

		if (selectedUnit.value === unitId && unit.parentId != null) {
			selectedUnit.value = unit.parentId;
		}
		if (pinnedUnits.value.has(unitId)) {
			pinnedUnits.value.delete(unitId);
		}
		if (highlightedUnits.value.has(unitId)) {
			highlightedUnits.value.delete(unitId);
		}

		for (const otherUnit of Object.values(unitMap.value)) {
			if (otherUnit.parentId === unitId) {
				if (selectedUnit.value === unitId) {
					selectedUnit.value = otherUnit.id;
				}
				setUnitSource(otherUnit.id, unit.parentId);
			}
		}
		if (selectedUnit.value === unitId) {
			selectedUnit.value = null;
		}
		delete unitMap.value[unitId];
		options.onUnitUpdated?.(unitId);
	};

	const setUnitSource = async (unitId: string, newParentId?: string) => {
		try {
			const unit = unitMap.value[unitId];
			if (unit == null) return;

			let currentlyCheckingParent = newParentId;
			while (currentlyCheckingParent != null) {
				if (currentlyCheckingParent === unitId) {
					setUnitSource(newParentId!, undefined);
				}
				currentlyCheckingParent =
					unitMap.value[currentlyCheckingParent]?.parentId;
			}

			unit.vector = getUnitResolvedVector(unitMap.value, unitId);
			if (newParentId != null) {
				unit.vector = unit.vector.addVector(
					getUnitResolvedVector(unitMap.value, newParentId).scale(-1)
				);
			}
			unit.parentId = newParentId;
			options.onUnitUpdated?.(unitId);
		} catch (e) {
			alert(`Failed to set unit source: ${e}`);
		}
	};

	const editWind = async (landingZoneId: string) => {
		try {
			const unit = unitMap.value[landingZoneId];
			if (unit == null) return;
			if (unit.type !== UnitType.LandingZone) {
				throw new Error('Only landing zones can update wind');
			}

			const targets = Object.keys(unitMap.value).filter(
				(unitId) => unitMap.value[unitId].type === UnitType.Target
			);
			let targetId: string;
			if (targets.length === 1) {
				targetId = targets[0];
			} else {
				targetId = await new Promise<string>((resolve, reject) => {
					unitSelector.value = {
						selectUnit: (unitId) => {
							unitSelector.value = null;
							if (unitId == null) {
								reject(new Error('User declined to select a unit'));
							} else if (unitMap.value[unitId].type !== UnitType.Target) {
								reject(new Error('Selected unit is not a target'));
							} else {
								resolve(unitId);
							}
						},
						prompt: 'Select target',
					};
				});
			}

			const guns = Object.keys(unitMap.value).filter(
				(unitId) => unitMap.value[unitId].type === UnitType.Artillery
			);
			let gunId: string;
			if (guns.length === 1) {
				gunId = guns[0];
			} else {
				gunId = await new Promise<string>((resolve, reject) => {
					unitSelector.value = {
						selectUnit: (unitId) => {
							unitSelector.value = null;
							if (unitId == null) {
								reject(new Error('User declined to select a unit'));
							} else if (unitMap.value[unitId].type !== UnitType.Artillery) {
								reject(new Error('Selected unit is not an artillery'));
							} else {
								resolve(unitId);
							}
						},
						prompt: 'Select artillery',
					};
				});
			}

			const landingZonePosition = getUnitResolvedVector(unitMap.value, landingZoneId);
			const { resolvedVectorFrom: gunPosition, firingVectorWithWind } = getFiringSolution(unitMap.value, gunId, targetId, wind.value);
			wind.value = getWindEffect(gunPosition, landingZonePosition, firingVectorWithWind);
			options.onWindUpdated?.();

			removeUnit(landingZoneId);
		} catch (e) {
			alert(`Failed to update wind: ${e}`);
		}
	};

	const resetWind = () => {
		wind.value = Vector.fromAngularVector({ azimuth: 0, distance: 0 });
		options.onWindUpdated?.();
	};

	const resetViewport = () => {
		if (!settings.value.lockRotate) viewport.value.resetRotation();

		const unitVectors = Object.values(unitMap.value).map((unit) => {
			return getUnitResolvedVector(unitMap.value, unit.id);
		});

		const center = unitVectors
			.reduce(
				(sum, vector) => {
					return sum.addVector(vector);
				},
				Vector.fromCartesianVector({ x: 0, y: 0 })
			)
			.scale(1 / (unitVectors.length || 1));

		if (!settings.value.lockZoom && !settings.value.lockPan) {
			if (unitVectors.length > 1) {
				const maxOffset = Math.max(
					0,
					...unitVectors.map((vector) => {
						return Math.abs(vector.addVector(center.scale(-1)).distance);
					})
				);

				viewport.value.zoomTo(0.8 / (maxOffset / 100));
			} else {
				viewport.value.zoomTo(1);
			}
		}

		if (!settings.value.lockPan) viewport.value.panTo(center);
	};

	useScopePerKey(unitMap, (key) => {
		watchEffect(() => {
			const unit = unitMap.value[key];
			if (unit?.parentId == null) return;
			const parent = unitMap.value[unit.parentId];
			if (parent == null) {
				removeUnit(unit.id);
			}
		});
	});

	useEventListener('keydown', (event) => {
		if (event.key === 'Tab' && event.ctrlKey) {
			const unitIdList = Object.keys(unitMap.value);

			if (selectedUnit.value == null) {
				selectedUnit.value =
					unitIdList[event.shiftKey ? unitIdList.length - 1 : 0];
				return;
			}

			const selectedUnitIndex = unitIdList.indexOf(selectedUnit.value);
			if (selectedUnitIndex === -1) return;

			if (event.shiftKey) {
				selectedUnit.value =
					unitIdList[
						(selectedUnitIndex - 1 + unitIdList.length) % unitIdList.length
					];
			} else {
				selectedUnit.value =
					unitIdList[(selectedUnitIndex + 1) % unitIdList.length];
			}
		}
	});

	return {
		addUnit,
		removeUnit,
		setUnitSource,
		editWind,
		resetWind,
		resetViewport,

		cursor,
		wind,
		unitMap,
		readyToFire,
		unitSelector,
		selectedUnit,
		pinnedUnits,
		highlightedUnits,
		containerElement,
		viewport,
		viewportControl,
	};
};
