<template>
	<FoxDialog
		class="Settings__dialog"
		v-model:visible="visible"
		:default-position-override="{ top: 50, left: 50, centerX: true, centerY: true }"
		@pointerdown.stop
		@wheel.stop
	>
		<template #header>Settings</template>
		<Tabs value="features">
			<TabList>
				<Tab as="div" value="features">Feature selection</Tab>
				<Tab as="div" value="grid">Grid tweaks</Tab>
				<Tab as="div" value="interface">Interface tweaks</Tab>
				<Tab as="div" value="keyboard-shortcuts" v-if="isOverlay"
					>Keyboard shortcuts</Tab
				>
				<Tab as="div" value="updates" v-if="isOverlay && updateConfig != null"
					>Updates</Tab
				>
			</TabList>
			<TabPanels>
				<TabPanel value="features">
					<div class="Settings__content">
						<div class="Settings__row">
							<label>Render closed overlay</label>
							<PrimeCheckBox
								binary
								v-model="settings.overlayAlwaysVisible"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Transparent background</label>
							<PrimeCheckBox
								binary
								v-model="settings.transparentOverlay"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Backdrop mode</label>
							<FoxSelect
								:options="
									new Map(
										Object.keys(BackdropMode).map((backdropMode) => [
											BackdropMode[backdropMode as keyof typeof BackdropMode],
											{ label: backdropMode },
										])
									)
								"
								v-model="settings.backdropMode"
								@update:model-value="saveSettings"
							/>
						</div>
						<div
							class="Settings__row"
							v-if="settings.backdropMode === BackdropMode.Map"
						>
							<label>Map source</label>
							<FoxSelect
								:options="
									new Map(
										Object.keys(MapSource).map((mapSource) => [
											MapSource[mapSource as keyof typeof MapSource],
											{ label: mapSource },
										])
									)
								"
								v-model="settings.mapSource"
								@update:model-value="saveSettings"
							/>
						</div>
						<!--
						<div class="Settings__row">
							<label>User mode</label>
							<FoxSelect
								:options="
									new Map(
										Object.keys(UserMode).map((userMode) => [
											UserMode[userMode as keyof typeof UserMode],
											{ label: userMode },
										])
									)
								"
								v-model="settings.userMode"
								@update:model-value="saveSettings"
							/>
						</div>
						-->
						<div class="Settings__row">
							<label>Show firing solution in bottom right</label>
							<PrimeCheckBox
								binary
								v-model="settings.showTooltip"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Show wind in bottom right</label>
							<PrimeCheckBox
								binary
								v-model="settings.showWindTooltip"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Use NATO alphabet</label>
							<PrimeCheckBox
								binary
								v-model="settings.useNatoAlphabet"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Show min/max spread</label>
							<PrimeCheckBox
								binary
								v-model="settings.showMinMaxSpread"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Show X/Y offsets</label>
							<PrimeCheckBox
								binary
								v-model="settings.showXYOffsets"
								@update:model-value="saveSettings"
							/>
						</div>
					</div>
				</TabPanel>
				<TabPanel value="grid">
					<div class="Settings__content">
						<div class="Settings__row">
							<label>Grid dash length</label>
							<NumberInput
								:model-value="settings.gridDashLength"
								@update:model-value="
									settings.gridDashLength = $event;
									saveSettings();
								"
								:autofocus="true"
								:fraction-digits="2"
								:min="0"
							/>
						</div>
						<div class="Settings__row">
							<label>Grid dash gap</label>
							<NumberInput
								:model-value="settings.gridDashGap"
								@update:model-value="
									settings.gridDashGap = $event;
									saveSettings();
								"
								:fraction-digits="2"
								:min="0"
							/>
						</div>
						<div class="Settings__row">
							<label>Grid line width</label>
							<NumberInput
								:model-value="settings.gridLineWidth"
								@update:model-value="
									settings.gridLineWidth = $event;
									saveSettings();
								"
								:fraction-digits="2"
								:min="0.25"
							/>
						</div>
					</div>
				</TabPanel>
				<TabPanel value="interface">
					<div class="Settings__content">
						<div class="Settings__row">
							<label>Hide pinned headers</label>
							<PrimeCheckBox
								binary
								v-model="settings.hidePinnedHeaders"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Compass opacity</label>
							<NumberInput
								:model-value="Math.floor(settings.compassOpacity * 100)"
								@update:model-value="
									settings.compassOpacity = Math.floor($event) / 100;
									saveSettings();
								"
								:autofocus="true"
								:fraction-digits="0"
								:min="0"
							/>
						</div>
						<div class="Settings__row">
							<label>Firing arc label opacity</label>
							<NumberInput
								:model-value="Math.floor(settings.firingArcOpacity * 100)"
								@update:model-value="
									settings.firingArcOpacity = Math.floor($event) / 100;
									saveSettings();
								"
								:fraction-digits="0"
								:min="0"
							/>
						</div>
						<div class="Settings__row">
							<label>Range finder mode</label>
							<FoxSelect
								:options="
									new Map(
										Object.keys(RangeFinderMode).map((rangeFinderMode) => [
											RangeFinderMode[rangeFinderMode as keyof typeof RangeFinderMode],
											{ label: rangeFinderMode },
										])
									)
								"
								v-model="settings.rangeFinderMode"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Spread mode</label>
							<FoxSelect
								:options="
									new Map(
										Object.keys(SpreadMode).map((spreadMode) => [
											SpreadMode[spreadMode as keyof typeof SpreadMode],
											{ label: spreadMode },
										])
									)
								"
								v-model="settings.spreadMode"
								@update:model-value="saveSettings"
							/>
						</div>
						<div class="Settings__row">
							<label>Screenshot/map opacity</label>
							<NumberInput
								:model-value="Math.floor(settings.screenshotOpacity * 100)"
								@update:model-value="
									settings.screenshotOpacity = Math.floor($event) / 100;
									saveSettings();
								"
								:fraction-digits="0"
								:min="0.1"
							/>
						</div>
						<div class="Settings__row" v-if="isOverlay">
							<label>Overlay button scale</label>
							<NumberInput
								:model-value="settings.toggleButtonScale"
								@update:model-value="
									settings.toggleButtonScale = $event;
									saveSettings();
								"
								:fraction-digits="2"
								:min="0.25"
							/>
						</div>
						<div class="Settings__row">
							<label>Unit icon scale</label>
							<NumberInput
								:model-value="settings.unitIconScale"
								@update:model-value="
									settings.unitIconScale = $event;
									saveSettings();
								"
								:fraction-digits="2"
								:min="0.25"
							/>
						</div>
						<div class="Settings__row">
							<label>Font scale</label>
							<NumberInput
								:model-value="settings.fontScale"
								@update:model-value="
									settings.fontScale = $event;
									saveSettings();
								"
								:fraction-digits="2"
								:min="0.25"
							/>
						</div>
					</div>
				</TabPanel>
				<TabPanel value="keyboard-shortcuts">
					<div class="Settings__content">
						<div class="Settings__row">
							<label>Toggle overlay</label>
							<ElectronKeyboardShortcut
								:command="KeyboardCommand.ToggleOverlay"
							/>
						</div>
						<div class="Settings__row">
							<label>Calibrate wind</label>
							<ElectronKeyboardShortcut
								:command="KeyboardCommand.CalibrateWind"
							/>
						</div>
						<div class="Settings__row">
							<label>Edit target</label>
							<ElectronKeyboardShortcut :command="KeyboardCommand.EditTarget" />
						</div>
						<div class="Settings__row">
							<label>Override firing solution</label>
							<ElectronKeyboardShortcut
								:command="KeyboardCommand.OverrideFiringSolution"
							/>
						</div>
					</div>
				</TabPanel>
				<TabPanel value="updates" v-if="updateConfig != null">
					<div class="Settings__content">
						<div class="Settings__row">
							<label>Disable updates</label>
							<PrimeCheckBox
								binary
								v-model="updateConfig.disableUpdates"
								@update:model-value="saveUpdateConfig"
							/>
						</div>
						<div class="Settings__row" v-if="!updateConfig.disableUpdates">
							<label>Update check frequency</label>
							<FoxSelect
								:options="
									new Map([
										[0, { label: 'Only on startup' }],
										[12 * 60 * 60 * 1000, { label: 'Every 12 hours' }],
										[6 * 60 * 60 * 1000, { label: 'Every 6 hours' }],
										[3 * 60 * 60 * 1000, { label: 'Every 3 hours' }],
										[60 * 60 * 1000, { label: 'Every hour' }],
										[30 * 60 * 1000, { label: 'Every 30 minutes' }],
									])
								"
								:model-value="updateConfig.updateInterval ?? 0"
								@update:model-value="
									updateConfig.updateInterval = $event;
									saveUpdateConfig();
								"
							/>
						</div>
						<div class="Settings__row" v-if="!updateConfig.disableUpdates">
							<label>Automatic updates</label>
							<PrimeCheckBox
								binary
								v-model="updateConfig.automaticUpdates"
								@update:model-value="saveUpdateConfig"
							/>
						</div>
					</div>
				</TabPanel>
			</TabPanels>
		</Tabs>
	</FoxDialog>
</template>

<style lang="scss">
	.Settings__dialog {
		min-width: 25vw;
		bottom: auto;

		&:not(.FoxDialog__container-rolled-up) {
			min-height: 80vh;
		}
		.p-tabpanels {
			flex-grow: 1;
		}
	}

	.Settings__content {
		display: grid;
		grid-template-columns: max-content 1fr;
		grid-auto-rows: auto;
		gap: 1em;
	}

	.Settings__row {
		grid-column: auto / span 2;
		display: grid;
		grid-template-columns: subgrid;
	}
</style>

<script setup lang="ts">
	import { ref } from 'vue';
	import PrimeCheckBox from 'primevue/checkbox';
	import Tab from 'primevue/tab';
	import Tabs from 'primevue/tabs';
	import TabList from 'primevue/tablist';
	import TabPanel from 'primevue/tabpanel';
	import TabPanels from 'primevue/tabpanels';
	import { KeyboardCommand } from '@packages/data/dist/keyboard-config';
	import type { UpdateConfig } from '@packages/data/dist/update-config';
	import FoxDialog from '@/components/FoxDialog.vue';
	import FoxSelect from '@/components/inputs/FoxSelect.vue';
	import ElectronKeyboardShortcut from '@/components/inputs/KeyboardShortcut/ElectronKeyboardShortcut.vue';
	import NumberInput from '@/components/inputs/NumberInput.vue';
	import { isOverlay } from '@/lib/constants';
	import {
		BackdropMode,
		MapSource,
		RangeFinderMode,
		saveSettings,
		settings,
		SpreadMode,
		// UserMode,
	} from '@/lib/settings';

	const visible = defineModel('visible', { default: false, type: Boolean });

	const updateConfig = ref<UpdateConfig | null>(null);
	window.electronApi?.getUpdateConfig().then((config) => {
		updateConfig.value = config;
	});

	const saveUpdateConfig = () => {
		if (updateConfig.value == null) return;
		window.electronApi?.setUpdateConfig(
			JSON.parse(JSON.stringify(updateConfig.value))
		);
	};
</script>
