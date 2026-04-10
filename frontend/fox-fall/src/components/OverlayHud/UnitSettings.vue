<template>
	<FoxDialog
		v-bind="$attrs"
		class="UnitSettings__dialog"
		:visible="(visible && artillery.overlayOpen.value) || pinned"
		@update:visible="visible = $event"
		v-model:pinned="pinned"
		:default-position-override="
			props.defaultPositionOverride ?? { top: 50, right: 0, centerY: true }
		"
		v-model:position-override="positionOverride"
		:disable-close="props.isBaseUnit && !props.unitId"
		:disable-pin="props.isBaseUnit"
		:persist-position-id="props.persistPositionId"
		:disable-roll-up="props.isBaseUnit"
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
				v-if="!props.isBaseUnit && unit?.parentId != null"
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
			<template v-if="unit != null && !isSupercededBySeparatedWindow">
				<div class="UnitSettings__table">
					<template v-if="hideDetails">
						<div class="UnitSettings__row">
							<span>Distance:</span>
							<DistanceInput
								ref="distanceInput"
								autofocus
								:model-value="unit.vector.distance"
								@update:model-value="
									artillery.sharedState.produceUpdate(() =>
										withHandling(() => {
											artillery.sharedState.currentState.value.unitMap[
												unit!.id
											].vector.distance = $event;
											syncedRoom.updateUnit(unit!.id);
										})
									)
								"
							/>
						</div>
						<div class="UnitSettings__row">
							<span>Azimuth:</span>
							<DirectionInput
								ref="azimuthInput"
								:model-value="wrapDegrees(unit.vector.azimuth)"
								@update:model-value="
									artillery.sharedState.produceUpdate(() =>
										withHandling(() => {
											artillery.sharedState.currentState.value.unitMap[
												unit!.id
											].vector.azimuth = wrapDegrees($event);
											syncedRoom.updateUnit(unit!.id);
										})
									)
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
									artillery.sharedState.produceUpdate(() =>
										withHandling(() => {
											unit!.type = $event;
											syncedRoom.updateUnit(unit!.id);
										})
									)
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
										artillery.sharedState.produceUpdate(() =>
											withHandling(() => {
												artillery.sharedState.currentState.value.unitMap[
													unit!.id
												].ammunition = $event;
												artillery.sharedState.currentState.value.unitMap[
													unit!.id
												].ammunition &&
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
										)
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
										artillery.sharedState.produceUpdate(() =>
											withHandling(() => {
												artillery.sharedState.currentState.value.unitMap[
													unit!.id
												].platform = $event;
												syncedRoom.updateUnit(unit!.id);
											})
										)
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
										artillery.sharedState.produceUpdate(() =>
											withHandling(() => {
												unit!.spottingType = $event;
												syncedRoom.updateUnit(unit!.id);
											})
										)
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
											withHandling(() =>
												artillery.setUnitSource(unit!.id, $event)
											)
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
									artillery.sharedState.produceUpdate(() =>
										withHandling(() => {
											unit!.label = $event ?? undefined;
											syncedRoom.updateUnit(unit!.id);
										})
									)
								"
								@input="
									artillery.sharedState.produceUpdate(() =>
										withHandling(() => syncedRoom.updateUnit(unit!.id))
									)
								"
							/>
						</div>
						<template v-if="parent">
							<Tabs
								class="UnitSettings__span"
								v-model:value="spottingDirection"
							>
								<TabList>
									<Tab as="div" :value="1">
										<Component
											:is="
												getUnitIcon(
													artillery.sharedState.currentState.value.unitMap,
													parent.id
												)
											"
											class="UnitSettings__icon"
										/>
										{{ parentLabel }} ->
										<Component
											:is="
												getUnitIcon(
													artillery.sharedState.currentState.value.unitMap,
													unit.id
												)
											"
											class="UnitSettings__icon"
										/>
										{{ unitLabel }}
									</Tab>
									<Tab as="div" :value="-1">
										<Component
											:is="
												getUnitIcon(
													artillery.sharedState.currentState.value.unitMap,
													unit.id
												)
											"
											class="UnitSettings__icon"
										/>
										{{ unitLabel }} ->
										<Component
											:is="
												getUnitIcon(
													artillery.sharedState.currentState.value.unitMap,
													parent.id
												)
											"
											class="UnitSettings__icon"
										/>
										{{ parentLabel }}
									</Tab>
								</TabList>
							</Tabs>
							<div class="UnitSettings__row">
								<span>Distance:</span>
								<DistanceInput
									ref="distanceInput"
									autofocus
									:model-value="unit.vector.distance"
									@update:model-value="
										artillery.sharedState.produceUpdate(() =>
											withHandling(() => {
												artillery.sharedState.currentState.value.unitMap[
													unit!.id
												].vector.distance = $event;
												syncedRoom.updateUnit(unit!.id);
											})
										)
									"
								/>
							</div>
							<div class="UnitSettings__row">
								<span>Azimuth:</span>
								<DirectionInput
									ref="azimuthInput"
									:model-value="
										wrapDegrees(
											unit.vector.azimuth + (spottingDirection < 0 ? 180 : 0)
										)
									"
									@update:model-value="
										artillery.sharedState.produceUpdate(() =>
											withHandling(() => {
												artillery.sharedState.currentState.value.unitMap[
													unit!.id
												].vector.azimuth = wrapDegrees(
													$event - (spottingDirection < 0 ? 180 : 0)
												);
												syncedRoom.updateUnit(unit!.id);
											})
										)
									"
								/>
							</div>
						</template>
						<template v-if="settings.showXYOffsets">
							<div class="UnitSettings__row">
								<span>X:</span>
								<DistanceInput
									:model-value="
										Vector.fromAngularVector(unit.vector).x * spottingDirection
									"
									@update:model-value="
										artillery.sharedState.produceUpdate(() =>
											withHandling(() => {
												unit!.vector = Object.assign(
													Vector.fromAngularVector(unit!.vector),
													{ x: $event * spottingDirection }
												).angularVector;
												syncedRoom.updateUnit(unit!.id);
											})
										)
									"
								/>
							</div>
							<div class="UnitSettings__row">
								<span>Y:</span>
								<DistanceInput
									:model-value="
										Vector.fromAngularVector(unit.vector).y * spottingDirection
									"
									@update:model-value="
										artillery.sharedState.produceUpdate(() =>
											withHandling(() => {
												unit!.vector = Object.assign(
													Vector.fromAngularVector(unit!.vector),
													{ y: $event * spottingDirection }
												).angularVector;
												syncedRoom.updateUnit(unit!.id);
											})
										)
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
							artillery.sharedState.produceUpdate(() =>
								withHandling(() => {
									unit!.canDrag = !unit!.canDrag;
									syncedRoom.updateUnit(unit!.id);
								})
							)
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
								withHandling(() => artillery.removeUnit(unit!.id))
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
					v-if="unit.type === UnitType.LandingZone && !hideDetails"
				>
					<PrimeButton
						class="UnitSettings__action"
						@click.stop="
							artillery.sharedState.produceUpdate(() =>
								withHandling(() => submitWind())
							)
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
</template>

<style lang="scss">
	@use '@packages/frontend-libs/src/styles/constants' as constants;
	@use '@packages/frontend-libs/src/styles/mixins/border' as border;

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

				&.UnitSettings__action-inverted {
					background: white;
					color: black;
				}

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
	import Tab from 'primevue/tab';
	import Tabs from 'primevue/tabs';
	import TabList from 'primevue/tablist';
	import { computed, markRaw, ref, shallowRef, watch } from 'vue';
	import { wrapDegrees } from '@packages/data/dist/artillery/angle';
	import {
		ARTILLERY_BY_SHELL,
		SPOTTING_BY_TYPE,
		SPOTTING_TYPE,
	} from '@packages/data/dist/artillery/unit/constants';
	import { UnitType } from '@packages/data/dist/artillery/unit';
	import { Vector } from '@packages/data/dist/artillery/vector';
	import { withHandling } from '@packages/frontend-libs/dist/error';
	import FoxDialog, {
		type PositionOverride,
	} from '@packages/frontend-libs/dist/FoxDialog.vue';
	import DragIcon from '@packages/frontend-libs/dist/icons/DragIcon.vue';
	import PinIcon from '@packages/frontend-libs/dist/icons/PinIcon.vue';
	import PinOutlineIcon from '@packages/frontend-libs/dist/icons/PinOutlineIcon.vue';
	import TrashIcon from '@packages/frontend-libs/dist/icons/TrashIcon.vue';
	import WindIcon from '@packages/frontend-libs/dist/icons/WindIcon.vue';
	import DirectionInput from '@packages/frontend-libs/dist/inputs/DirectionInput/DirectionInput.vue';
	import DistanceInput from '@packages/frontend-libs/dist/inputs/DistanceInput.vue';
	import FoxSelect from '@packages/frontend-libs/dist/inputs/FoxSelect.vue';
	import FoxText from '@packages/frontend-libs/dist/inputs/FoxText.vue';
	import { ICONS } from '@packages/frontend-libs/dist/icons';
	import AmmoSelect from '@/components/inputs/AmmoSelect.vue';
	import PlatformSelect from '@/components/inputs/PlatformSelect.vue';
	import SelectOneUnit from '@/components/inputs/select-unit/SelectOneUnit.vue';
	import { injectUnitSettingsOpen } from '@/contexts/unit-settings-open';
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

	const distanceInput = shallowRef<InstanceType<typeof DistanceInput>>(null!);
	const azimuthInput = shallowRef<InstanceType<typeof DirectionInput>>(null!);
	const landingZoneFiringSolutionDistanceInput = shallowRef<
		InstanceType<typeof DistanceInput> | null | undefined
	>(null);
	const landingZoneFiringSolutionAzimuthInput = shallowRef<
		InstanceType<typeof DirectionInput> | null | undefined
	>(null);

	const visible = defineModel('visible', { type: Boolean, default: true });
	const pinned = defineModel('pinned', { type: Boolean, default: false });
	const hideDetails = defineModel('hideDetails', { type: Boolean });
	const langingZoneFiringSolution = ref(
		Vector.fromCartesianVector({ x: 0, y: 0 })
	);
	const positionOverride = ref<PositionOverride | undefined>(undefined);
	const spottingDirection = ref(1);

	const separatedUnits = injectUnitSettingsOpen();
	const isSupercededBySeparatedWindow = computed(
		() =>
			props.isBaseUnit &&
			unit.value != null &&
			separatedUnits.value.has(unit.value.id)
	);

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
			withHandling(() =>
				artillery.editWind(
					unit.value!.id,
					langingZoneFiringSolution.value,
					!pinned.value
				)
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
		() => unit.value?.parentId,
		(parentId) => {
			if (parentId == null) {
				hideDetails.value = false;
			}
		}
	);
	useFieldGroup({
		inputs: computed(() => [distanceInput.value, azimuthInput.value]),
		onLastSubmit() {
			unit.value?.type === UnitType.LandingZone &&
				artillery.sharedState.produceUpdate(() =>
					withHandling(() => submitWind())
				);
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
			artillery.sharedState.produceUpdate(() =>
				withHandling(() => submitWind())
			);
			artillery.checkWindowFocus();
		},
	});
</script>
