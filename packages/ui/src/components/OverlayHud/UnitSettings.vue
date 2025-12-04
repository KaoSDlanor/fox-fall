<template>
	<FoxDialog
		v-show="artillery.overlayOpen.value || pinned"
		v-bind="$attrs"
		class="UnitSettings__dialog"
		v-model:visible="visible"
		v-model:pinned="pinned"
		:default-position-override="
			props.defaultPositionOverride ?? { top: 50, right: 0, centerY: true }
		"
		v-model:position-override="positionOverride"
		:disable-close="props.isBaseUnit && !props.unitId"
		:persist-position-id="props.persistPositionId"
		:aria-unit-id="props.unitId"
		:aria-unit-type="unit?.type"
	>
		<template #header>
			<span class="UnitSettings__header-content">
				<Component
					v-if="unit != null"
					:is="
						getUnitIcon(
							artillery.sharedState.currentState.value.unitMap,
							unit.id
						)
					"
					class="UnitSettings__icon"
				/>
				{{ unitLabel }}
			</span>
		</template>
		<template #header-actions>
			<PrimeButton
				v-if="!props.isBaseUnit"
				class="FoxDialog__header-action"
				severity="secondary"
				@pointerdown.stop="hideDetails = !hideDetails"
				:title="hideDetails ? 'Show details' : 'Hide details'"
			>
				<i
					class="pi"
					:class="{
						'pi-window-maximize': hideDetails,
						'pi-window-minimize': !hideDetails,
					}"
				/>
			</PrimeButton>
			<PrimeButton
				v-else-if="unit != null && !separatedUnits.has(unit.id)"
				class="FoxDialog__header-action"
				severity="secondary"
				@pointerdown.stop.prevent="separatedUnits.add(unit.id)"
				title="Open dedicated unit settings"
			>
				<i class="pi pi-window-maximize" />
			</PrimeButton>
		</template>
		<div class="UnitSettings__container">
			<template v-if="unit != null && !separatedUnits.has(unit.id)">
				<div class="UnitSettings__table">
					<template v-if="hideDetails">
						<div class="UnitSettings__row">
							<span>Distance:</span>
							<DistanceInput
								ref="distanceInput"
								autofocus
								:model-value="unit.vector.distance"
								@update:model-value="
									artillery.sharedState.produceUpdate(() => {
										artillery.sharedState.currentState.value.unitMap[
											unit!.id
										].vector.distance = $event;
										syncedRoom.updateUnit(unit!.id);
									})
								"
							/>
						</div>
						<div class="UnitSettings__row">
							<span>Azimuth:</span>
							<DirectionInput
								ref="azimuthInput"
								:model-value="wrapDegrees(unit.vector.azimuth)"
								@update:model-value="
									artillery.sharedState.produceUpdate(() => {
										artillery.sharedState.currentState.value.unitMap[
											unit!.id
										].vector.azimuth = wrapDegrees($event);
										syncedRoom.updateUnit(unit!.id);
									})
								"
							/>
						</div>
					</template>
					<template v-else>
						<div class="UnitSettings__row">
							<span>Type:</span>
							<FoxSelect
								class="UnitSettings__select"
								:model-value="unit.type"
								@update:model-value="
									artillery.sharedState.produceUpdate(() => {
										unit!.type = $event;
										syncedRoom.updateUnit(unit!.id);
									})
								"
								:disabled="props.readonly"
								:autofocus="!parent"
								enable-search
								:options="unitTypeOptions"
							/>
						</div>
						<template v-if="settings.userMode === UserMode.Advanced">
							<div
								class="UnitSettings__row"
								v-if="unit.type === UnitType.Artillery"
							>
								<span>Ammunition:</span>
								<AmmoSelect
									class="UnitSettings__select"
									:model-value="unit.ammunition"
									@update:model-value="
										artillery.sharedState.produceUpdate(() => {
											artillery.sharedState.currentState.value.unitMap[
												unit!.id
											].ammunition = $event;
											artillery.sharedState.currentState.value.unitMap[unit!.id]
												.ammunition &&
												!ARTILLERY_BY_SHELL[
													artillery.sharedState.currentState.value.unitMap[
														unit!.id
													].ammunition!
												]?.PLATFORM[
													artillery.sharedState.currentState.value.unitMap[
														unit!.id
													].platform!
												] &&
												(artillery.sharedState.currentState.value.unitMap[
													unit!.id
												].platform = undefined);
											syncedRoom.updateUnit(unit!.id);
										})
									"
									:disabled="props.readonly"
								/>
							</div>
							<div
								class="UnitSettings__row"
								v-if="unit.type === UnitType.Artillery"
							>
								<span>Platform:</span>
								<PlatformSelect
									class="UnitSettings__select"
									:ammo-type="unit.ammunition"
									:model-value="unit.platform"
									@update:model-value="
										artillery.sharedState.produceUpdate(() => {
											artillery.sharedState.currentState.value.unitMap[
												unit!.id
											].platform = $event;
											syncedRoom.updateUnit(unit!.id);
										})
									"
									:disabled="props.readonly"
								/>
							</div>
							<div
								class="UnitSettings__row"
								v-if="unit.type === UnitType.Spotter"
							>
								<span>Spotting type:</span>
								<FoxSelect
									class="UnitSettings__select"
									enable-search
									enable-clear
									:model-value="unit.spottingType"
									@update:model-value="
										artillery.sharedState.produceUpdate(() => {
											unit!.spottingType = $event;
											syncedRoom.updateUnit(unit!.id);
										})
									"
									:disabled="props.readonly"
									:options="spottingTypeOptions"
								>
									<template #placeholder>Select spotter type</template>
								</FoxSelect>
							</div>
							<div class="UnitSettings__row">
								<span>Sighted from:</span>
								<SelectOneUnit
									:key="props.unitId"
									class="UnitSettings__select"
									:black-list="{ id: [unit.id] }"
									:model-value="unit.parentId"
									:disabled="props.readonly"
									@update:model-value="
										artillery.sharedState.produceUpdate(() =>
											artillery.setUnitSource(unit!.id, $event)
										)
									"
								/>
							</div>
						</template>
						<div class="UnitSettings__row">
							<label>Name:</label>
							<FoxText
								:readonly="props.readonly"
								:model-value="unit.label ?? ''"
								@update:model-value="
									artillery.sharedState.produceUpdate(() => {
										unit!.label = $event ?? undefined;
										syncedRoom.updateUnit(unit!.id);
									})
								"
								@input="
									artillery.sharedState.produceUpdate(() =>
										syncedRoom.updateUnit(unit!.id)
									)
								"
							/>
						</div>
						<template v-if="parent">
							<div class="UnitSettings__row">
								<span class="UnitSettings__span">
									{{ parentLabel }} -> {{ unitLabel }}
								</span>
							</div>
							<div class="UnitSettings__row">
								<span>Distance:</span>
								<DistanceInput
									ref="distanceInput"
									autofocus
									:model-value="unit.vector.distance"
									@update:model-value="
										artillery.sharedState.produceUpdate(() => {
											artillery.sharedState.currentState.value.unitMap[
												unit!.id
											].vector.distance = $event;
											syncedRoom.updateUnit(unit!.id);
										})
									"
								/>
							</div>
							<div class="UnitSettings__row">
								<span>Azimuth:</span>
								<DirectionInput
									ref="azimuthInput"
									:model-value="wrapDegrees(unit.vector.azimuth)"
									@update:model-value="
										artillery.sharedState.produceUpdate(() => {
											artillery.sharedState.currentState.value.unitMap[
												unit!.id
											].vector.azimuth = wrapDegrees($event);
											syncedRoom.updateUnit(unit!.id);
										})
									"
								/>
							</div>
							<template v-if="unit.type !== UnitType.LandingZone">
								<span class="UnitSettings__span">
									{{ unitLabel }} -> {{ parentLabel }}
								</span>
								<div class="UnitSettings__row">
									<span>Distance:</span>
									<DistanceInput
										:model-value="unit.vector.distance"
										@update:model-value="
											artillery.sharedState.produceUpdate(() => {
												unit!.vector = Object.assign(
													Vector.fromAngularVector(unit!.vector),
													{ distance: $event }
												).angularVector;
												syncedRoom.updateUnit(unit!.id);
											})
										"
									/>
								</div>
								<div class="UnitSettings__row">
									<span>Azimuth:</span>
									<DirectionInput
										:model-value="wrapDegrees(unit.vector.azimuth + 180)"
										@update:model-value="
											artillery.sharedState.produceUpdate(() => {
												unit!.vector = Object.assign(
													Vector.fromAngularVector(unit!.vector),
													{ azimuth: wrapDegrees($event - 180) }
												).angularVector;
												syncedRoom.updateUnit(unit!.id);
											})
										"
									/>
								</div>
								<template v-if="settings.showXYOffsets">
									<div class="UnitSettings__row">
										<span>X:</span>
										<DistanceInput
											:model-value="-Vector.fromAngularVector(unit.vector).x"
											@update:model-value="
												artillery.sharedState.produceUpdate(() => {
													unit!.vector = Object.assign(
														Vector.fromAngularVector(unit!.vector),
														{ x: -$event }
													).angularVector;
													syncedRoom.updateUnit(unit!.id);
												})
											"
										/>
									</div>
									<div class="UnitSettings__row">
										<span>Y:</span>
										<DistanceInput
											:model-value="-Vector.fromAngularVector(unit.vector).y"
											@update:model-value="
												artillery.sharedState.produceUpdate(() => {
													unit!.vector = Object.assign(
														Vector.fromAngularVector(unit!.vector),
														{ y: -$event }
													).angularVector;
													syncedRoom.updateUnit(unit!.id);
												})
											"
										/>
									</div>
								</template>
							</template>
						</template>
						<template v-if="settings.showXYOffsets || !parent">
							<div class="UnitSettings__row">
								<span>X:</span>
								<DistanceInput
									:model-value="Vector.fromAngularVector(unit.vector).x"
									@update:model-value="
										artillery.sharedState.produceUpdate(() => {
											unit!.vector = Object.assign(
												Vector.fromAngularVector(unit!.vector),
												{ x: $event }
											).angularVector;
											syncedRoom.updateUnit(unit!.id);
										})
									"
								/>
							</div>
							<div class="UnitSettings__row">
								<span>Y:</span>
								<DistanceInput
									:model-value="Vector.fromAngularVector(unit.vector).y"
									@update:model-value="
										artillery.sharedState.produceUpdate(() => {
											unit!.vector = Object.assign(
												Vector.fromAngularVector(unit!.vector),
												{ y: $event }
											).angularVector;
											syncedRoom.updateUnit(unit!.id);
										})
									"
								/>
							</div>
						</template>
						<template v-if="unit.type === UnitType.LandingZone">
							<div class="UnitSettings__row">
								<span class="UnitSettings__span">Gun measurement:</span>
							</div>
							<div class="UnitSettings__row">
								<span>Distance:</span>
								<DistanceInput
									ref="landingZoneFiringSolutionDistanceInput"
									:model-value="langingZoneFiringSolution.distance"
									@update:model-value="
										langingZoneFiringSolution.distance = $event
									"
								/>
							</div>
							<div class="UnitSettings__row">
								<span>Azimuth:</span>
								<DirectionInput
									ref="landingZoneFiringSolutionAzimuthInput"
									:model-value="wrapDegrees(langingZoneFiringSolution.azimuth)"
									@update:model-value="
										langingZoneFiringSolution.azimuth = wrapDegrees($event)
									"
								/>
							</div>
						</template>
					</template>
				</div>
				<div class="UnitSettings__actions" v-if="!hideDetails">
					<PrimeButton
						class="UnitSettings__action"
						@click.stop="
							artillery.sharedState.produceUpdate(() => {
								unit!.canDrag = !unit!.canDrag;
								syncedRoom.updateUnit(unit!.id);
							})
						"
						:severity="unit.canDrag ? 'success' : 'danger'"
						title="Can drag"
					>
						<DragIcon />
					</PrimeButton>
					<PrimeButton
						class="UnitSettings__action"
						@click.stop="
							artillery.pinnedUnits.value.has(unit.id)
								? artillery.pinnedUnits.value.delete(unit.id)
								: artillery.pinnedUnits.value.add(unit.id)
						"
						severity="secondary"
						title="Pin"
					>
						<Component
							:is="
								artillery.pinnedUnits.value.has(unit.id)
									? PinIcon
									: PinOutlineIcon
							"
						/>
					</PrimeButton>
					<PrimeButton
						class="UnitSettings__action"
						:disabled="props.readonly"
						@click.stop="
							artillery.sharedState.produceUpdate(() =>
								artillery.removeUnit(unit!.id)
							)
						"
						severity="danger"
						title="Delete"
					>
						<TrashIcon />
					</PrimeButton>
				</div>
				<div
					class="UnitSettings__actions"
					v-if="
						unit.type === UnitType.LandingZone && artillery.overlayOpen.value
					"
				>
					<PrimeButton
						class="UnitSettings__action"
						@click.stop="
							artillery.sharedState.produceUpdate(() => submitWind())
						"
						title="Update wind"
					>
						<WindIcon />
					</PrimeButton>
				</div>
			</template>
			<template v-else-if="props.unitId != null">
				<span>
					<Component
						:is="
							getUnitIcon(
								artillery.sharedState.currentState.value.unitMap,
								props.unitId
							)
						"
						class="UnitSettings__icon"
					/>
					{{ unitLabel }} has it's own settings window
				</span>
				<PrimeButton
					class="UnitSettings__action"
					@click.stop="separatedUnits.delete(props.unitId)"
					:title="`Close dedicated unit settings for ${unitLabel}`"
				>
					<i class="pi pi-window-minimize" />
				</PrimeButton>
			</template>
			<template v-else> No unit selected </template>
		</div>
	</FoxDialog>

	<template v-for="unitId in separatedUnits" :key="unitId">
		<UnitSettings
			v-if="artillery.sharedState.currentState.value.unitMap[unitId] != null"
			:unit-id="unitId"
			:default-position-override="positionOverride"
			@update:visible="
				!$event &&
					separatedUnits.delete(unitId) &&
					artillery.selectedUnit.value === unitId &&
					(artillery.selectedUnit.value = null)
			"
		/>
	</template>
</template>

<style lang="scss">
	@use '@/styles/constants' as constants;
	@use '@/styles/mixins/border' as border;

	.UnitSettings__dialog {
		display: grid;
		grid-auto-rows: auto;
		grid-template-columns: auto;
		align-items: inherit;
	}

	.UnitSettings__header-content {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5em;

		.UnitSettings__icon {
			width: 1em;
			height: 1em;
		}
	}

	.UnitSettings__container {
		display: flex;
		flex-direction: column;
		align-items: stretch;

		padding: 1em;
		gap: 0.5em;

		input {
			font-size: inherit;
		}

		.UnitSettings__table {
			display: grid;
			grid-template-columns: max-content 1fr;
			grid-auto-rows: min-content;
			align-items: center;

			gap: 0.5em;

			text-align: end;

			.UnitSettings__row {
				grid-column: 1 / -1;

				display: grid;
				grid-template-columns: subgrid;
				grid-template-rows: subgrid;
				align-items: inherit;
			}

			.UnitSettings__span {
				grid-column: 1 / -1;
				text-align: center;
			}

			.UnitSettings__select {
				text-align: initial;
			}
		}

		.UnitSettings__actions {
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			font-size: 125%;

			gap: 0.5em;

			.UnitSettings__action {
				flex: 1 0 auto;

				display: flex;
				flex-direction: row;
				align-items: center;
				justify-content: center;
				padding: 0.75em;

				color: inherit;
				font-size: inherit;

				.Unit__icon {
					width: 1em;
					height: 1em;
					background: currentColor;
					mask: var(--icon-url) no-repeat center;
				}
			}
		}
	}
</style>

<script setup lang="ts">
	import PrimeButton from 'primevue/button';
	import { computed, markRaw, ref, shallowRef, watch } from 'vue';
	import { wrapDegrees } from '@packages/data/dist/artillery/angle';
	import {
		ARTILLERY_BY_SHELL,
		SPOTTING_BY_TYPE,
		SPOTTING_TYPE,
	} from '@packages/data/dist/artillery/unit/constants';
	import { UnitType } from '@packages/data/dist/artillery/unit';
	import { Vector } from '@packages/data/dist/artillery/vector';
	import FoxDialog, { type PositionOverride } from '@/components/FoxDialog.vue';
	import DragIcon from '@/components/icons/DragIcon.vue';
	import PinIcon from '@/components/icons/PinIcon.vue';
	import PinOutlineIcon from '@/components/icons/PinOutlineIcon.vue';
	import TrashIcon from '@/components/icons/TrashIcon.vue';
	import WindIcon from '@/components/icons/WindIcon.vue';
	import AmmoSelect from '@/components/inputs/AmmoSelect.vue';
	import DirectionInput from '@/components/inputs/DirectionInput/DirectionInput.vue';
	import DistanceInput from '@/components/inputs/DistanceInput.vue';
	import FoxSelect from '@/components/inputs/FoxSelect.vue';
	import FoxText from '@/components/inputs/FoxText.vue';
	import PlatformSelect from '@/components/inputs/PlatformSelect.vue';
	import SelectOneUnit from '@/components/inputs/select-unit/SelectOneUnit.vue';
	import { ICONS } from '@/lib/constants/icons';
	import { UNIT_ICON_BY_TYPE } from '@/lib/constants/unit';
	import { artillery, syncedRoom } from '@/lib/globals';
	import { settings, UserMode } from '@/lib/settings';
	import {
		getAvailableUnitTypes,
		getUnitIcon,
		getUnitLabel,
		getUnitResolvedVector,
		setUnitResolvedVector,
	} from '@/lib/unit';
	import { useFieldGroup } from '@/mixins/form';
	import { useScopePerSetEntry } from '@/mixins/scope';

	const distanceInput = shallowRef<InstanceType<typeof DistanceInput>>(null!);
	const azimuthInput = shallowRef<InstanceType<typeof DirectionInput>>(null!);
	const landingZoneFiringSolutionDistanceInput = shallowRef<
		InstanceType<typeof DistanceInput> | null | undefined
	>(null);
	const landingZoneFiringSolutionAzimuthInput = shallowRef<
		InstanceType<typeof DirectionInput> | null | undefined
	>(null);

	const visible = defineModel('visible', { type: Boolean, default: true });
	const pinned = defineModel('pinned', { type: Boolean });
	const hideDetails = defineModel('hideDetails', { type: Boolean });
	const langingZoneFiringSolution = ref(
		Vector.fromCartesianVector({ x: 0, y: 0 })
	);
	const positionOverride = ref<PositionOverride | undefined>(undefined);

	const props = defineProps<{
		unitId?: string;
		persistPositionId?: string;
		defaultPositionOverride?: PositionOverride;
		isBaseUnit?: boolean;
		readonly?: boolean;
	}>();

	const unit = computed(() => {
		if (props.unitId == null) return null;
		return artillery.sharedState.currentState.value.unitMap[props.unitId];
	});

	const unitLabel = computed(() => {
		if (unit.value == null) return 'Unit settings';
		return getUnitLabel(
			artillery.sharedState.currentState.value.unitMap,
			unit.value.id
		);
	});

	const unitTypeOptions = computed(() => {
		const output: Map<UnitType, { label: string; icon?: any; order: number }> =
			new Map();
		for (const [index, type] of (
			getAvailableUnitTypes() as UnitType[]
		).entries()) {
			output.set(type, {
				label: UnitType[type],
				icon: markRaw(UNIT_ICON_BY_TYPE[type]),
				order: index,
			});
		}
		return output;
	});

	const spottingTypeOptions = computed(() => {
		const output: Map<
			SPOTTING_TYPE,
			{ label: string; icon?: any; order: number }
		> = new Map();
		for (const [index, type] of (
			Object.keys(SPOTTING_BY_TYPE) as SPOTTING_TYPE[]
		)
			.sort()
			.entries()) {
			output.set(type, { label: type, icon: ICONS[type], order: index });
		}
		return output;
	});

	const parent = computed(() =>
		unit.value?.parentId != null
			? artillery.sharedState.currentState.value.unitMap[unit.value.parentId]
			: undefined
	);
	const parentLabel = computed(() =>
		parent.value == null
			? 'Unknown'
			: getUnitLabel(
					artillery.sharedState.currentState.value.unitMap,
					parent.value.id
				)
	);

	const submitWind = () => {
		if (unit.value == null) return;

		if (unit.value.targetId == null) {
			unit.value.targetId = Object.values(
				artillery.sharedState.currentState.value.unitMap
			).find((unit) => unit.type === UnitType.Target)?.id;
		}

		artillery.sharedState.produceUpdate(() =>
			artillery.editWind(
				unit.value!.id,
				langingZoneFiringSolution.value,
				!pinned.value
			)
		);

		if (unit.value.targetId != null) {
			setUnitResolvedVector(
				artillery.sharedState.currentState.value.unitMap,
				unit.value.id,
				getUnitResolvedVector(
					artillery.sharedState.currentState.value.unitMap,
					unit.value.targetId
				)
			);
		}
	};

	watch(
		artillery.selectedFiringVector,
		(value) => {
			if (value == null) return;
			langingZoneFiringSolution.value = value.clone();
		},
		{ immediate: true }
	);

	watch(
		() => pinned.value,
		(value) => {
			if (!value) {
				hideDetails.value = false;
			}
		}
	);
	useFieldGroup({
		inputs: computed(() => [distanceInput.value, azimuthInput.value]),
		onLastSubmit() {
			unit.value?.type === UnitType.LandingZone &&
				artillery.sharedState.produceUpdate(() => submitWind());
			artillery.checkWindowFocus();
		},
	});

	useFieldGroup({
		inputs: computed(() =>
			[
				landingZoneFiringSolutionDistanceInput.value,
				landingZoneFiringSolutionAzimuthInput.value,
			].filter((input) => input != null)
		),
		onLastSubmit() {
			artillery.sharedState.produceUpdate(() => submitWind());
			artillery.checkWindowFocus();
		},
	});

	const separatedUnits = ref<Set<string>>(new Set());

	useScopePerSetEntry(
		separatedUnits,
		(unitId) => {
			watch(
				() => artillery.sharedState.currentState.value.unitMap[unitId],
				(unit) => {
					if (unit == null) {
						separatedUnits.value.delete(unitId);
					}
				},
				{
					immediate: true,
					flush: 'sync',
				}
			);
		},
		'sync'
	);
</script>
