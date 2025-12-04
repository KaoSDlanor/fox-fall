<template>
	<Teleport to="body">
		<div
			ref="containerElement"
			class="FoxDialog__container"
			:class="{
				'FoxDialog__container-rolled-up': rolledUp,
				'FoxDialog__container-move-mode': moveMode,
				'FoxDialog__container-moving': moving != null,
				'FoxDialog__container-visible': resolvedVisibility,
				MouseCapture: pinned || focusedRecently,
			}"
			v-bind="$attrs"
			:style="containerStyle"
			@pointerdown.stop="containerElement.focus()"
			@contextmenu.stop
			@wheel.stop
			@pointerup.stop.prevent="onPointerUp"
			@pointermove="onPointerMove"
			@keydown.stop="onKeyDown"
			tabindex="-1"
		>
			<h1
				class="FoxDialog__header"
				v-if="!settings.hidePinnedHeaders || artillery.overlayOpen.value"
				@pointerdown="(event) => onPointerDown(event, { x: -1, y: -1 })"
			>
				<slot name="header" />
				<span
					class="FoxDialog__header-actions"
					@doubleclick.stop
					@pointerdown.stop="containerElement.focus()"
				>
					<slot name="header-actions" />
					<PrimeButton
						v-if="!props.disablePin"
						class="FoxDialog__header-action"
						:severity="pinned ? 'success' : 'secondary'"
						@pointerdown="pinned = !pinned"
						:title="pinned ? 'Unpin' : 'Pin'"
					>
						<i class="pi pi-thumbtack" />
					</PrimeButton>
					<PrimeButton
						v-if="!props.disableRollUp"
						:disabled="moveMode"
						class="FoxDialog__header-action"
						severity="secondary"
						@pointerdown.prevent="!moveMode && (rolledUp = !rolledUp)"
						:title="rolledUp ? 'Roll down' : 'Roll up'"
					>
						<i
							class="pi"
							:class="{
								'pi-chevron-up': !rolledUp,
								'pi-chevron-down': rolledUp,
							}"
						/>
					</PrimeButton>
					<PrimeButton
						v-if="!props.disableMove"
						:disabled="rolledUp"
						class="FoxDialog__header-action"
						:severity="moveMode ? 'success' : 'secondary'"
						@pointerdown="!rolledUp && (moveMode = !moveMode)"
						title="Anchor position"
					>
						<AnchorIcon />
					</PrimeButton>
					<PrimeButton
						v-if="!pinned && !props.disableClose"
						class="FoxDialog__header-action"
						severity="secondary"
						@pointerdown.stop="visible = false"
						title="Close"
					>
						<i class="pi pi-times" />
					</PrimeButton>
				</span>
			</h1>
			<div class="FoxDialog__body">
				<slot />
			</div>
			<div class="FoxDialog__move-zones" v-if="moveMode">
				<template v-for="y in 3">
					<PrimeButton
						v-for="x in 3"
						class="FoxDialog__move-zone"
						:class="{
							'FoxDialog__move-zone--active': moveZoneActive(x - 2, y - 2),
						}"
						:severity="moveZoneActive(x - 2, y - 2) ? 'success' : 'secondary'"
						@pointerdown="
							onPointerDown($event, { x: x - 2, y: y - 2 } as SnapPosition)
						"
						:title="
							x === 1 && y === 1
								? 'Anchor top left'
								: x === 2 && y === 1
									? 'Anchor top center'
									: x === 3 && y === 1
										? 'Anchor top right'
										: x === 1 && y === 2
											? 'Anchor center left'
											: x === 2 && y === 2
												? 'Anchor center'
												: x === 3 && y === 2
													? 'Anchor center right'
													: x === 1 && y === 3
														? 'Anchor bottom left'
														: x === 2 && y === 3
															? 'Anchor bottom center'
															: x === 3 && y === 3
																? 'Anchor bottom right'
																: undefined
						"
					>
						<i
							class="pi"
							:class="
								x === 1 && y === 1
									? 'pi-arrow-up-left'
									: x === 2 && y === 1
										? 'pi-arrow-up'
										: x === 3 && y === 1
											? 'pi-arrow-up-right'
											: x === 1 && y === 2
												? 'pi-arrow-left'
												: x === 2 && y === 2
													? 'pi-arrow-up-right-and-arrow-down-left-from-center'
													: x === 3 && y === 2
														? 'pi-arrow-right'
														: x === 1 && y === 3
															? 'pi-arrow-down-left'
															: x === 2 && y === 3
																? 'pi-arrow-down'
																: x === 3 && y === 3
																	? 'pi-arrow-down-right'
																	: undefined
							"
						/>
					</PrimeButton>
				</template>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss">
	@use '@/styles/constants' as constants;
	@use '@/styles/mixins/border' as border;

	.FoxDialog__container {
		position: fixed;
		inset: auto;
		display: grid;
		grid-template-rows: auto 1fr;
		grid-template-columns: auto;
		align-items: inherit;
		overflow: hidden;

		font-size: calc(0.7em);

		@include border.border-gradient();
		&:focus,
		&:focus-within {
			@include border.border-gradient-focused();
			outline: none;
		}
		&:hover {
			@include border.border-gradient-hovered();
		}
		--_background: 100% 75% / 200% 200% no-repeat
			radial-gradient(canvas, #{constants.$dark}) !important;
		border-radius: 1.25em;

		&.FoxDialog__container-moving {
			cursor: grabbing !important;

			> * {
				pointer-events: none;
			}
			&::after {
				content: '';
				position: fixed;
				inset: 0;
				z-index: 1;
			}
		}

		z-index: 2;
		&.FoxDialog__container-rolled-up:not(:has(.FoxDialog__body:focus-within)) {
			z-index: 1;
		}
		&:focus,
		&:focus-within {
			z-index: 3;
		}
		&.FoxDialog__container-moving {
			z-index: 4;
		}

		&:not(.FoxDialog__container-visible) {
			opacity: 0;
			pointer-events: none;
		}
	}

	.FoxDialog__header {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;

		@include border.border-gradient();

		border-width: 0 !important;
		border-bottom-width: calc(0.125em / 2) !important;
		border-top-left-radius: inherit;
		border-top-right-radius: inherit;

		margin: 0;
		padding: 0.5em;
		gap: 0.5em;
		cursor: grab;

		font-size: 1.3em;
		user-select: none;
	}

	.FoxDialog__container:focus .FoxDialog__header,
	.FoxDialog__container:focus-within .FoxDialog__header {
		@include border.border-gradient-focused();
		outline: none;
	}
	.FoxDialog__container:hover .FoxDialog__header {
		@include border.border-gradient-hovered();
	}

	.FoxDialog__header-actions {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5em;
		cursor: pointer;

		.FoxDialog__header-action {
			font-size: inherit;
			--p-button-padding-x: 0.5em;
			--p-button-padding-y: 0.5em;
			.pi,
			.icon {
				font-size: inherit;
			}
		}
	}

	.FoxDialog__container-rolled-up:not(:has(.FoxDialog__body:focus-within)) {
		.FoxDialog__header {
			border-bottom-width: 0 !important;
			border-bottom-left-radius: inherit;
			border-bottom-right-radius: inherit;
		}

		.FoxDialog__body,
		.FoxDialog__move-zones {
			opacity: 0;
			pointer-events: none;
			height: 0;
		}
	}

	.FoxDialog__container-move-mode {
		.FoxDialog__body {
			opacity: 0;
			pointer-events: none;
			height: 0;
		}
	}

	.FoxDialog__body {
		position: relative;
		display: grid;
		grid-template-rows: auto;
		grid-template-columns: auto;
		align-items: inherit;
		overflow: auto;
	}

	.FoxDialog__move-zones {
		min-width: 15em;
		min-height: 15em;
		aspect-ratio: 1;

		display: grid;
		grid-template-rows: repeat(3, minmax(0, 1fr));
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 2em;
		padding: 0;
	}

	.FoxDialog__move-zone {
		cursor: grab !important;

		&--active {
			background-color: constants.$selected_foreground;
		}
	}
</style>

<script setup lang="ts">
	import {
		until,
		useElementBounding,
		useEventListener,
		useFocus,
		useFocusWithin,
		useWindowSize,
	} from '@vueuse/core';
	import PrimeButton from 'primevue/button';
	import { computed, CSSProperties, ref, shallowRef, watch } from 'vue';
	import AnchorIcon from '@/components/icons/AnchorIcon.vue';
	import { artillery } from '@/lib/globals';
	import { settings } from '@/lib/settings';

	export type PositionOverride = {
		top?: number;
		left?: number;
		bottom?: number;
		right?: number;
		centerX?: boolean;
		centerY?: boolean;
	};

	const props = defineProps<{
		persistPositionId?: string;
		defaultPositionOverride?: PositionOverride;
		disableClose?: boolean;
		disablePin?: boolean;
		disableRollUp?: boolean;
		disableMove?: boolean;
	}>();

	const containerElement = shallowRef<HTMLDivElement>(null!);
	const visible = defineModel('visible', { type: Boolean, required: true });
	const pinned = defineModel('pinned', { type: Boolean });
	const moveMode = defineModel('moveMode', { type: Boolean });
	const rolledUp = defineModel('rolledUp', { type: Boolean });

	const bounds = useElementBounding(containerElement);
	const windowSize = useWindowSize();

	const positionOverride = defineModel<PositionOverride | undefined>(
		'positionOverride'
	);

	const { focused: hasFocusWithin } = useFocusWithin(containerElement);
	const { focused: hasFocusContainer } = useFocus(containerElement);
	const hasFocus = computed(
		() => hasFocusWithin.value || hasFocusContainer.value
	);
	const focusedRecently = ref(hasFocus.value);
	watch(hasFocus, (value) => {
		if (value) {
			focusedRecently.value = true;
		} else {
			Promise.race([
				new Promise((resolve) => setTimeout(resolve, 100)),
				until(hasFocus).toBe(true),
			]).then(() => {
				focusedRecently.value = hasFocus.value;
			});
		}
	});

	const resolvedVisibility = computed(() => {
		if (
			artillery.viewportControl.calibrating.value ||
			artillery.viewportControl.screenShotting.value
		)
			return false;
		return (
			pinned.value ||
			moving.value != null ||
			focusedRecently.value ||
			(artillery.overlayOpen.value && visible.value)
		);
	});

	const position = computed(() => {
		return positionOverride.value ?? props.defaultPositionOverride;
	});

	const containerStyle = computed(() => {
		if (position.value == null) return {};

		const output: CSSProperties = {};

		const margin = '0.5em';
		if (position.value.top != null) {
			output.top = `clamp(${margin}, ${position.value.top}vh - ${position.value.centerY ? bounds.height.value / 2 : 0}px, 100vh - ${bounds.height.value}px - ${margin})`;
		}

		if (position.value.left != null) {
			output.left = `clamp(${margin}, ${position.value.left}vw - ${position.value.centerX ? bounds.width.value / 2 : 0}px, 100vw - ${bounds.width.value}px - ${margin})`;
		}

		if (position.value.bottom != null) {
			output.bottom = `clamp(${margin}, ${position.value.bottom}vh - ${position.value.centerY ? bounds.height.value / 2 : 0}px, 100vh - ${bounds.height.value}px - ${margin})`;
		}

		if (position.value.right != null) {
			output.right = `clamp(${margin}, ${position.value.right}vw - ${position.value.centerX ? bounds.width.value / 2 : 0}px, 100vw - ${bounds.width.value}px - ${margin})`;
		}

		output.maxHeight = `calc(100vh - ${margin} * 2)`;
		output.maxWidth = `calc(100vw - ${margin} * 2)`;

		return output;
	});

	type SnapPosition = { x: number; y: number };

	type MovingData = {
		startPosition: {
			top: number;
			left: number;
			bottom: number;
			right: number;
		};
		startSize: {
			width: number;
			height: number;
		};
		startEvent: PointerEvent;
		snapPosition: SnapPosition;
	};
	const moving = ref<null | MovingData>(null);

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			if (!pinned.value && !props.disableClose) {
				visible.value = false;
			} else {
				(
					containerElement.value!.querySelector(':focus') as HTMLElement
				)?.blur();
				artillery.checkWindowFocus();
			}
		}
	};

	useEventListener('keydown', onKeyDown);

	const onPointerDown = (event: PointerEvent, snapPosition: SnapPosition) => {
		event.stopPropagation();
		event.preventDefault();
		containerElement.value!.focus();
		containerElement.value!.setPointerCapture(event.pointerId);
		const bounding = containerElement.value!.getBoundingClientRect();
		moving.value = {
			startPosition: {
				top: (bounding.top * 100) / windowSize.height.value,
				left: (bounding.left * 100) / windowSize.width.value,
				bottom:
					((windowSize.height.value - bounding.bottom) * 100) /
					windowSize.height.value,
				right:
					((windowSize.width.value - bounding.right) * 100) /
					windowSize.width.value,
			},
			startSize: {
				width: (bounding.width * 100) / windowSize.width.value,
				height: (bounding.height * 100) / windowSize.height.value,
			},
			startEvent: event,
			snapPosition,
		};

		// onPointerMove(event);
	};

	const onPointerUp = (event: PointerEvent) => {
		if (!moving.value) return;
		event.stopPropagation();
		event.preventDefault();
		containerElement.value!.releasePointerCapture(event.pointerId);
		moving.value = null;
		moveMode.value = false;
	};

	const onPointerMove = (event: PointerEvent) => {
		if (!moving.value) return;
		event.stopPropagation();
		event.preventDefault();

		const computedStyle = getComputedStyle(containerElement.value!);
		const newPositionOverride: typeof positionOverride.value = {
			top: undefined,
			left: undefined,
			bottom: undefined,
			right: undefined,
			centerX: undefined,
			centerY: undefined,
		};
		if (moving.value.snapPosition.y === -1) {
			const marginTop = Number(computedStyle.marginTop.replace('px', '')) || 0;

			newPositionOverride.top =
				(event.clientY * 100) / windowSize.height.value -
				(moving.value.startEvent.clientY * 100) / windowSize.height.value +
				moving.value.startPosition.top -
				(marginTop * 100) / windowSize.height.value;
		}
		if (moving.value.snapPosition.y === 0) {
			const marginTop = Number(computedStyle.marginTop.replace('px', '')) || 0;

			newPositionOverride.top =
				(event.clientY * 100) / windowSize.height.value -
				(moving.value.startEvent.clientY * 100) / windowSize.height.value +
				moving.value.startPosition.top -
				(marginTop * 100) / windowSize.height.value +
				moving.value.startSize.height / 2;
			newPositionOverride.centerY = true;
		}
		if (moving.value.snapPosition.y === 1) {
			const marginBottom =
				Number(computedStyle.marginBottom.replace('px', '')) || 0;

			newPositionOverride.bottom =
				(moving.value.startEvent.clientY * 100) / windowSize.height.value -
				(event.clientY * 100) / windowSize.height.value +
				moving.value.startPosition.bottom -
				(marginBottom * 100) / windowSize.height.value;
		}

		if (moving.value.snapPosition.x === -1) {
			const marginLeft =
				Number(computedStyle.marginLeft.replace('px', '')) || 0;

			newPositionOverride.left =
				(event.clientX * 100) / windowSize.width.value -
				(moving.value.startEvent.clientX * 100) / windowSize.width.value +
				moving.value.startPosition.left -
				(marginLeft * 100) / windowSize.width.value;
		}
		if (moving.value.snapPosition.x === 0) {
			const marginLeft =
				Number(computedStyle.marginLeft.replace('px', '')) || 0;

			newPositionOverride.left =
				(event.clientX * 100) / windowSize.width.value -
				(moving.value.startEvent.clientX * 100) / windowSize.width.value +
				moving.value.startPosition.left -
				(marginLeft * 100) / windowSize.width.value +
				moving.value.startSize.width / 2;
			newPositionOverride.centerX = true;
		}
		if (moving.value.snapPosition.x === 1) {
			const marginRight =
				Number(computedStyle.marginRight.replace('px', '')) || 0;

			newPositionOverride.right =
				(moving.value.startEvent.clientX * 100) / windowSize.width.value -
				(event.clientX * 100) / windowSize.width.value +
				moving.value.startPosition.right -
				(marginRight * 100) / windowSize.width.value;
			newPositionOverride.centerX = false;
		}

		if (props.persistPositionId) {
			localStorage.setItem(
				`fox-dialog-position-${props.persistPositionId}`,
				JSON.stringify(newPositionOverride)
			);
		}
		positionOverride.value = newPositionOverride;
	};

	const moveZoneActive = (x: number, y: number) => {
		if (position.value == null) return false;

		const xMatched =
			(x === -1 && position.value.left != null && !position.value.centerX) ||
			(x === 0 && position.value.centerX) ||
			(x === 1 && position.value.right != null && !position.value.centerX);

		if (!xMatched) return false;

		const yMatched =
			(y === -1 && position.value.top != null && !position.value.centerY) ||
			(y === 0 && position.value.centerY) ||
			(y === 1 && position.value.bottom != null && !position.value.centerY);
		if (!yMatched) return false;

		return true;
	};

	watch(
		() => [props.persistPositionId, pinned.value, visible.value],
		() => {
			if (props.persistPositionId) {
				const savedPosition = localStorage.getItem(
					`fox-dialog-position-${props.persistPositionId}`
				);
				if (savedPosition) {
					positionOverride.value = JSON.parse(savedPosition);
				}
			}
		},
		{ immediate: true }
	);

	watch(focusedRecently, (value) => {
		if (!value) {
			artillery.checkWindowFocus();
		}
	});
</script>
