<template>
	<PositionedElement
		:x="resolvedVector.x"
		:y="resolvedVector.y"
		:layer="LAYER.UNITS"
		cancel-viewport-rotation
	>
		<div
			class="Unit__container"
			:class="{
				Unit__moving: !!moving,
				Unit__readonly: props.readonly,
				Unit__highlighted:
					artillery.pinnedUnits.value.has(unit.id) ||
					artillery.highlightedUnits.value.has(unit.id) ||
					open,
			}"
			:style="{
				'--unit-icon-scale': settings.unitIconScale,
			}"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
			@pointerdown="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
		>
			<div class="Unit__border"></div>
			<div class="Unit__label" v-if="unitLabel">
				{{ unitLabel }}
			</div>
			<Component :is="unitIcon" ref="iconElement" class="Unit__icon" />
		</div>
	</PositionedElement>

	<PositionedElement
		v-if="unit.type === UnitType.Target && artillery.wind.value.distance > 0 && false"
		:x="firingPosition.x"
		:y="firingPosition.y"
		:layer="LAYER.UNITS"
		cancel-viewport-rotation
	>
		<div
			class="Unit__container Unit__firing-indicator"
			:style="{
				'--unit-icon-scale': settings.unitIconScale,
			}"
		>
			<div class="Unit__border"></div>
			<div class="Unit__label" v-if="unitLabel">
				{{ unitLabel }}
			</div>
			<Component :is="unitIcon" class="Unit__icon" />
		</div>
	</PositionedElement>

	<UnitSettings
		v-model:visible="open"
		v-model:can-drag="canDrag"
		v-model:custom-position="unitSettingsHasCustomPosition"
		@create-child="emit('create-child', $event)"
		@remove="emit('remove')"
		@set-unit-source="emit('set-unit-source', $event)"
		@updated="emit('updated')"
		@update-wind="emit('update-wind')"
	/>
</template>

<style lang="scss">
	.Unit__container {
		position: absolute;

		transform: translate(-50%, -100%) scale(var(--unit-icon-scale))
			translateY(-25%);
		transform-origin: 50% 100%;

		&:hover,
		&:focus-within,
		&.Unit__moving,
		&.Unit__highlighted {
			.Unit__border {
				outline-color: var(--color-selected);
			}
		}

		&:not(:focus-within):not(.Unit__moving):not(.Unit__highlighted) {
			z-index: initial;
		}

		&:not(.Unit__readonly) {
			user-select: none;
			cursor: pointer;
		}
	}

	.Unit__firing-indicator {
		opacity: 0.4;
		z-index: -1;
		pointer-events: none;
	}

	.Unit__border {
		position: absolute;
		inset: 0;
		z-index: -1;
		background: var(--color-primary-contrast);
		outline: 0.2em solid var(--color-primary);
		filter: url(#outline);

		transform-origin: 50% 50%;
		transform: rotate(45deg);
		border-radius: 50%;
		border-bottom-right-radius: 0;
	}

	.Unit__label {
		position: absolute;
		left: 50%;
		top: 0%;
		transform: translate(-50%, -100%);

		font-size: 200%;
		pointer-events: none;
		user-select: none;
		white-space: nowrap;
		filter: url(#outline);
	}

	.Unit__icon {
		box-sizing: border-box;
		width: 5em;
		height: 5em;
		border-radius: 50%;
		padding: 0.5em;
	}
</style>

<script setup lang="ts">
	import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue';
	import type ArtilleryIcon from '@/components/icons/ArtilleryIcon.vue';
	import PositionedElement from '@/components/Viewport/PositionedElement.vue';
	import UnitSettings from '@/components/Viewport/Units/UnitSettings.vue';
	import { injectUnit } from '@/contexts/unit';
	import { ARTILLERY_BY_SHELL, SPOTTING_BY_TYPE } from '@/lib/constants/data';
	import { LAYER } from '@/lib/constants/ui';
	import { UNIT_ICON_BY_TYPE } from '@/lib/constants/unit';
	import { artillery } from '@/lib/globals';
	import { settings } from '@/lib/settings';
	import { getUnitLabel, getUnitResolvedVector, UnitType } from '@/lib/unit';
	import { Vector } from '@/lib/vector';

	const iconElement = shallowRef<InstanceType<typeof ArtilleryIcon>>(null!);

	const props = defineProps<{
		readonly?: boolean;
	}>();

	const emit = defineEmits<{
		(event: 'create-child', payload: UnitType): void;
		(event: 'remove'): void;
		(event: 'set-unit-source', payload: string | undefined): void;
		(event: 'updated'): void;
		(event: 'update-wind'): void;
	}>();

	const unit = injectUnit();

	const ammoSpecs = computed(() => {
		if (unit.value.ammunition != null)
			return ARTILLERY_BY_SHELL[unit.value.ammunition];
	});
	const artillerySpecs = computed(() => {
		if (unit.value.platform != null && ammoSpecs.value != null) {
			return ammoSpecs.value.PLATFORM[unit.value.platform]!;
		}
	});
	const spottingSpecs = computed(() => {
		if (unit.value.spottingType != null) {
			return SPOTTING_BY_TYPE[unit.value.spottingType];
		}
	});
	const unitLabel = computed(() =>
		getUnitLabel(artillery.unitMap.value, unit.value.id)
	);
	const unitIcon = computed(() => {
		if (unit.value.type === UnitType.Spotter) {
			return spottingSpecs.value?.ICON ?? UNIT_ICON_BY_TYPE[unit.value.type];
		}
		if (unit.value.type === UnitType.Artillery) {
			return (
				artillerySpecs.value?.ICON ??
				ammoSpecs.value?.ICON ??
				UNIT_ICON_BY_TYPE[unit.value.type]
			);
		}

		return UNIT_ICON_BY_TYPE[unit.value.type];
	});

	const isHovered = ref(false);
	const canDrag = ref(unit.value.parentId == null);
	const open = computed({
		get: () => artillery.selectedUnit.value === unit.value.id,
		set: (value) => {
			if (value) {
				artillery.selectedUnit.value = unit.value.id;
			} else if (artillery.selectedUnit.value === unit.value.id) {
				artillery.selectedUnit.value = null;
			}
		},
	});
	const unitSettingsHasCustomPosition = ref(false);

	watch(
		() => isHovered.value,
		(isHighlighted) => {
			if (isHighlighted) {
				artillery.highlightedUnits.value.add(unit.value.id);
			} else {
				artillery.highlightedUnits.value.delete(unit.value.id);
			}
		}
	);
	onScopeDispose(() => {
		artillery.highlightedUnits.value.delete(unit.value.id);
		open.value = false;
	});

	const resolvedVector = computed(() =>
		getUnitResolvedVector(artillery.unitMap.value, unit.value.id)
	);

	const firingPosition = computed(() =>
		resolvedVector.value.addVector(artillery.wind.value)
	);

	type MovingData = {
		startEvent: PointerEvent;
		startCursorViewport: Vector;
		startUnitPosition: Vector;
	};
	const moving = ref<null | MovingData>(null);

	const onPointerDown = (event: PointerEvent) => {
		if (props.readonly) return;
		event.stopPropagation();
		event.preventDefault();
		if (event.button !== 0) {
			if (artillery.unitSelector.value != null) {
				artillery.unitSelector.value.selectUnit(null);
				return;
			}

			open.value = !open.value;
			return;
		}

		if (artillery.unitSelector.value != null) {
			artillery.unitSelector.value.selectUnit(unit.value.id);
			return;
		}

		if (!canDrag.value) {
			open.value = !open.value;
			return;
		}

		moving.value = {
			startEvent: event,
			startCursorViewport: artillery.viewport.value.toWorldPosition(
				Vector.fromCartesianVector({
					x: event.clientX,
					y: event.clientY,
				})
			),
			startUnitPosition: unit.value.vector.clone(),
		};
		iconElement.value.$el.setPointerCapture(event.pointerId);
	};

	const onPointerUp = (event: PointerEvent) => {
		if (!moving.value) return;
		event.stopPropagation();

		const distanceMoved = Vector.fromCartesianVector({
			x: event.clientX - moving.value.startEvent.clientX,
			y: event.clientY - moving.value.startEvent.clientY,
		});
		if (distanceMoved.distance <= 5) {
			open.value = !open.value;
		}

		moving.value = null;
		iconElement.value.$el.releasePointerCapture(event.pointerId);
	};

	const onPointerMove = (event: PointerEvent) => {
		if (props.readonly) return;
		const movingData = moving.value;
		if (!movingData) return;
		event.stopPropagation();

		const currentCursorViewport = artillery.viewport.value.toWorldPosition(
			Vector.fromCartesianVector({
				x: event.clientX,
				y: event.clientY,
			})
		);

		unit.value.vector.cartesianVector = {
			x:
				movingData.startUnitPosition.x +
				currentCursorViewport.x -
				movingData.startCursorViewport.x,
			y:
				movingData.startUnitPosition.y +
				currentCursorViewport.y -
				movingData.startCursorViewport.y,
		};

		// Round values
		if (unit.value.parentId != null) {
			unit.value.vector.angularVector = {
				distance: Number(unit.value.vector.distance.toFixed(1)),
				azimuth: Number(unit.value.vector.azimuth.toFixed(1)),
			};
		}

		emit('updated');
	};
</script>
