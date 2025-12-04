<template>
	<PositionedElement
		:x="resolvedVector.x"
		:y="resolvedVector.y"
		:layer="moving || isHighlighted ? LAYER.UNITS_HIGHLIGHTED : LAYER.UNITS"
		cancel-viewport-rotation
	>
		<div
			class="Unit__container"
			:class="{
				Unit__moving: !!moving,
				Unit__readonly: props.readonly,
				Unit__highlighted: isHighlighted,
			}"
			:style="{
				'--unit-icon-scale': settings.unitIconScale,
			}"
			@mouseover="isHovered = true"
			@mouseleave="isHovered = false"
			@pointerdown.stop="($event) => onPointerDown($event)"
			@pointermove="($event) => onPointerMove($event)"
			@pointerup.stop="($event) => onPointerUp($event)"
		>
			<div class="Unit__border"></div>
			<div class="Unit__label" v-if="unitLabel">
				{{ unitLabel }}
			</div>
			<Component :is="getUnitIcon(artillery.sharedState.currentState.value.unitMap, unit.id)" ref="iconElement" class="Unit__icon" />
		</div>
	</PositionedElement>

	<PositionedElement
		v-if="
			unit.type === UnitType.Target &&
			artillery.sharedState.currentState.value.wind.distance > 0
		"
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
			<Component :is="getUnitIcon(artillery.sharedState.currentState.value.unitMap, unit.id)" class="Unit__icon" />
		</div>
	</PositionedElement>
</template>

<style lang="scss">
	.Unit__container {
		position: absolute;

		transform: translate(-50%, -100%) scale(calc(var(--unit-icon-scale) * 0.4))
			translateY(-25%);
		transform-origin: 50% 100%;

		&:hover,
		&:focus-within,
		&.Unit__moving,
		&.Unit__highlighted {
			.Unit__border {
				outline-color: var(--color-selected);
			}

			.Unit__label {
				color: var(--color-selected);
				filter: url(#outline-white);
				font-weight: bold;
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
		filter: url(#outline-black);

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
		filter: url(#outline-black);
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
	import { UnitType } from '@packages/data/dist/artillery/unit';
	import { Vector } from '@packages/data/dist/artillery/vector';
	import type ArtilleryIcon from '@/components/icons/ArtilleryIcon.vue';
	import PositionedElement from '@/components/Viewport/PositionedElement.vue';
	import { injectUnit } from '@/contexts/unit';
	import { LAYER } from '@/lib/constants/ui';
	import { artillery } from '@/lib/globals';
	import { settings } from '@/lib/settings';
	import {
		getUnitIcon,
		getUnitLabel,
		getUnitResolvedVector,
	} from '@/lib/unit';

	const iconElement = shallowRef<InstanceType<typeof ArtilleryIcon>>(null!);

	const props = defineProps<{
		readonly?: boolean;
	}>();

	const emit = defineEmits<{
		(event: 'create-child', payload: UnitType): void;
		(event: 'remove'): void;
		(event: 'set-unit-source', payload: string | undefined): void;
		(event: 'updated'): void;
		(event: 'update-wind', payload: { firingSolution: Vector, removeUnitAfter: boolean }): void;
	}>();

	const unit = injectUnit();

	const unitLabel = computed(() =>
		getUnitLabel(
			artillery.sharedState.currentState.value.unitMap,
			unit.value.id
		)
	);

	const isHovered = ref(false);
	const open = computed({
		get: () =>
			artillery.selectedUnit.value === unit.value.id &&
			artillery.overlayOpen.value,
		set: (value) => {
			if (value) {
				artillery.selectedUnit.value = unit.value.id;
			} else if (artillery.selectedUnit.value === unit.value.id) {
				artillery.selectedUnit.value = null;
			}
		},
	});
	const isHighlighted = computed(() => {
		return (
			artillery.pinnedUnits.value.has(unit.value.id) ||
			artillery.highlightedUnits.value.has(unit.value.id) ||
			open.value
		);
	});

	type MovingData = {
		sharedStateId?: string;
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

		if (!unit.value.canDrag) {
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
			startUnitPosition: Vector.fromAngularVector(unit.value.vector),
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

		movingData.sharedStateId = artillery.sharedState.produceUpdate(
			() => {
				event.stopPropagation();

				const currentCursorViewport = artillery.viewport.value.toWorldPosition(
					Vector.fromCartesianVector({
						x: event.clientX,
						y: event.clientY,
					})
				);

				const currentVector = Vector.fromAngularVector(
					artillery.sharedState.currentState.value.unitMap[unit.value.id].vector
				);
				currentVector.cartesianVector = {
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
				if (
					artillery.sharedState.currentState.value.unitMap[unit.value.id]
						.parentId != null
				) {
					currentVector.angularVector = {
						distance: Number(currentVector.distance.toFixed(1)),
						azimuth: Number(currentVector.azimuth.toFixed(1)),
					};
				}

				artillery.sharedState.currentState.value.unitMap[unit.value.id].vector =
					currentVector.angularVector;

				emit('updated');
			},
			undefined,
			movingData.sharedStateId === artillery.sharedState.lastUpdate
				? movingData.sharedStateId
				: undefined
		)?.id;
	};

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
	watch(
		() => moving.value != null,
		(isMoving) => {
			if (isMoving) {
				artillery.draggingUnits.value.add(unit.value.id);
			} else {
				artillery.draggingUnits.value.delete(unit.value.id);
			}
		}
	);

	onScopeDispose(() => {
		artillery.highlightedUnits.value.delete(unit.value.id);
		artillery.draggingUnits.value.delete(unit.value.id);
		open.value = false;
	});

	const resolvedVector = computed(() =>
		getUnitResolvedVector(
			artillery.sharedState.currentState.value.unitMap,
			unit.value.id
		)
	);

	const firingPosition = computed(() => {
		return resolvedVector.value.addVector(artillery.getWindOffset(unit.value.id, resolvedVector.value.distance).scale(-1));
	});
</script>
