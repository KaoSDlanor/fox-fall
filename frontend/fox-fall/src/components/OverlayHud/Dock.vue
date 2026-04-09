<template>
	<PrimeDock :model="items" @pointerdown.stop>
		<template #item="{ item }">
			<PrimeButton
				v-if="isItem(item)"
				class="Dock__button"
				raised
				:severity="item.severity"
				:disabled="item.disabled"
				@click.stop="
					() =>
						artillery.sharedState.produceUpdate(() =>
							withHandling(() => item.command())
						)
				"
				@pointerenter="(event) => (tooltip = { label: item.label, event })"
				@pointerleave="tooltip = null"
			>
				<i v-for="icon in item.icons" :class="icon" />
				<Component
					v-for="iconComponent in item.iconComponents"
					:is="iconComponent"
				/>
			</PrimeButton>
		</template>
	</PrimeDock>

	<PrimePopover
		ref="primePopover"
		:dismissable="false"
		append-to=".App__container"
	>
		{{ tooltip?.label }}
	</PrimePopover>

	<Settings
		v-if="interfaceVisibility.settings"
		:visible="true"
		@update:visible="interfaceVisibility.settings = $event"
	/>

	<SyncSettings
		v-if="interfaceVisibility.syncSettings"
		:visible="true"
		@update:visible="interfaceVisibility.syncSettings = $event"
	/>
</template>

<style lang="scss">
	.Dock__button {
		width: 3rem;
		height: 3rem;
		padding: 0;

		> :not(:first-child) {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
		}
	}
</style>

<script setup lang="ts">
	import { withHandling } from '@packages/frontend-libs/dist/error';
	import GridIcon from '@packages/frontend-libs/dist/icons/GridIcon.vue';
	import Settings from '@/components/OverlayHud/Settings.vue';
	import SyncSettings from '@/components/OverlayHud/SyncSettings.vue';
	import {
		artillery,
		interfaceVisibility,
		serverConnection,
		syncedRoom,
	} from '@/lib/globals';
	import { BackdropMode, settings } from '@/lib/settings';
	import { ServerConnectionState } from '@/mixins/server-connection';
	import PrimeButton from 'primevue/button';
	import PrimeDock from 'primevue/dock';
	import PrimePopover from 'primevue/popover';
	import { computed, shallowRef, watch } from 'vue';

	const primePopover = shallowRef<InstanceType<typeof PrimePopover> | null>(
		null
	);
	const tooltip = shallowRef<{ label: string; event: MouseEvent } | null>(null);
	watch(
		() => tooltip.value,
		() => {
			primePopover.value?.hide();
			if (tooltip.value) {
				primePopover.value?.show(tooltip.value.event);
			}
		}
	);

	// watch(artillery.overlayOpen, (value) => {
	// 	if (!value) {
	// 		interfaceVisibility.value.settings = false;
	// 		interfaceVisibility.value.syncSettings = false;
	// 		interfaceVisibility.value.windSettings = false;
	// 	}
	// });

	const showHelp = async () => {
		const version = await window.electronApi?.getRunningVersion();
		alert(
			`Version: ${version}\n\nControls:\nLeft click: select unit\nLeft click drag: move unit / pan camera\nRight click drag / shift + left click drag: rotate camera\nScroll: zoom camera (hold CTRL to zoom 5x faster or shift to zoom 10x slower)\n\nClick unit's create buttons to insert a new child units\nCTRL + click unit's create buttons to change the unit type\n\nShow firing arcs by selecting an artillery unit or a target.\nAlternatively pin/hover an artillery unit and a target\n`
		);
	};

	type Item = {
		label: string;
		icons?: string[];
		iconComponents?: any[];
		severity?: string;
		disabled?: boolean;
		command: () => void;
	};
	const isItem = (_item: any): _item is Item => true;

	const calibrateGridItem = computed<Item>(() => ({
		label: 'Calibrate grid',
		iconComponents: [GridIcon],
		severity: 'secondary',
		command: () => artillery.viewportControl.calibrateGrid(),
	}));

	const readyToFireItem = computed<Item>(() => ({
		label: 'Ready to fire',
		icons: [
			`pi ${artillery.sharedState.currentState.value.readyToFire ? 'pi-play-circle' : 'pi-pause-circle'}`,
		],
		severity: artillery.sharedState.currentState.value.readyToFire
			? 'success'
			: 'danger',
		command: () => {
			artillery.sharedState.currentState.value.readyToFire =
				!artillery.sharedState.currentState.value.readyToFire;
			syncedRoom.updateReadyToFire();
		},
	}));

	const screenshotItem = computed<Item>(() => {
		const hasScreenshot = !!artillery.viewportControl.screenShot.value;
		return {
			label: hasScreenshot ? 'Clear screenshot' : 'Take screenshot',
			icons: hasScreenshot ? ['pi pi-camera', 'pi pi-times'] : ['pi pi-camera'],
			severity: hasScreenshot ? 'danger' : 'secondary',
			command: async () => {
				if (artillery.viewportControl.screenShot.value) {
					artillery.viewportControl.screenShot.value = null;
				} else {
					await artillery.viewportControl.captureScreenShot();
				}
			},
		};
	});

	const isConnected = computed(
		() =>
			serverConnection.connectionState.value === ServerConnectionState.connected
	);
	const connectedItem = computed<Item>(() => ({
		label: isConnected.value ? 'Connected' : 'Disconnected',
		icons: ['pi pi-sync'],
		severity: isConnected.value ? 'success' : 'danger',
		command: () =>
			(interfaceVisibility.value.syncSettings =
				!interfaceVisibility.value.syncSettings),
	}));

	const items = computed<Item[]>(() => {
		const output = [
			readyToFireItem.value,
			{
				label: 'Settings',
				icons: ['pi pi-cog'],
				severity: 'secondary',
				command: () =>
					(interfaceVisibility.value.settings =
						!interfaceVisibility.value.settings),
			},
			connectedItem.value,
			{
				label: 'Help',
				icons: ['pi pi-question-circle'],
				severity: 'secondary',
				command: showHelp,
			},
		];

		if (
			settings.value.backdropMode === BackdropMode.Grid &&
			settings.value.transparentOverlay
		) {
			output.unshift(calibrateGridItem.value, screenshotItem.value);
		}

		return output;
	});
</script>
