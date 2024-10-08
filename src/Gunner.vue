<template>
	<div
		ref="containerElement"
		class="Gunner__container"
		@touchstart.prevent
		@contextmenu.prevent
	>
		<div class="Gunner__unit-selector" :style="{ 'grid-area': 'artillery' }">
			<div
				v-for="(unit, index) in artilleryUnits"
				:key="unit.id"
				class="Gunner__unit"
				:class="{ Gunner__selected: selectedArtilleryIndex === index }"
				@pointerdown.stop="selectedArtilleryIndex = index"
			>
				<ArtilleryIcon />
				{{ getUnitLabel(unitMap, unit.id) }}
			</div>
		</div>
		<div
			class="Gunner__firing-info"
			:class="{ 'Gunner__ready-to-fire': readyToFire }"
			:style="{ 'grid-area': 'firing-info' }"
			v-if="firingVector"
		>
			<div class="FiringArc__label-row">
				<span class="FiringArc__span">
					{{ getUnitLabel(unitMap, selectedArtillery!.id) }} ->
					{{ getUnitLabel(unitMap, selectedTarget!.id) }}
				</span>
			</div>
			<div class="FiringArc__label-row">
				<span>distance:</span>
				<span>{{ Math.round(firingVector.distance) }}m</span>
			</div>
			<div class="FiringArc__label-row">
				<span>azimuth:</span><span>{{ firingVector.azimuth.toFixed(1) }}°</span>
			</div>
		</div>
		<div class="Gunner__unit-selector" :style="{ 'grid-area': 'target' }">
			<div
				v-for="(unit, index) in targetUnits"
				:key="unit.id"
				class="Gunner__unit"
				:class="{ Gunner__selected: selectedTargetIndex === index }"
				@pointerdown.stop="selectedTargetIndex = index"
			>
				<TargetIcon />
				{{ getUnitLabel(unitMap, unit.id) }}
			</div>
		</div>

		<PrimeDock :model="dockControls" @pointerdown.stop>
			<template #item="{ item }">
				<PrimeButton
					class="Gunner__control"
					raised
					:severity="item.severity"
					:disabled="item.disabled"
					@pointerdown.stop="item.command()"
					v-prime-tooltip.top="item.label"
				>
					<i v-if="item.icon" :class="item.icon" />
					<Component v-else-if="item.iconComponent" :is="item.iconComponent" />
				</PrimeButton>
			</template>
		</PrimeDock>
	</div>
</template>

<style lang="scss">
	.Gunner__container {
		contain: content;
		position: fixed;
		left: 0;
		top: 0;
		width: 100dvw;
		height: 100dvh;
		font-size: 5vmin;

		display: grid;
		grid-template-columns: max-content 1fr max-content;
		grid-template-rows: 1fr;
		grid-template-areas: 'artillery firing-info target';

		// grid-template-columns: max-content 1fr max-content;
		// grid-template-rows: 1fr min-content;
		// grid-template-areas:
		// 	'artillery firing-info target'
		// 	'artillery controls    target';
	}

	.Gunner__unit-selector {
		display: grid;
		grid-template-columns: max-content;
		grid-auto-rows: calc(25% - 0.5em);
		gap: 0.5em;
		padding: 0.25em;

		overflow-y: scroll;
	}

	.Gunner__unit {
		min-width: 10vw;
		padding: 0.5em;
		outline: 1px solid;
		border-radius: 0.5em;

		background: var(--color-primary-contrast);
		color: var(--color-primary);

		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;

		user-select: none;
		cursor: pointer;

		&.Gunner__selected {
			outline: 5px solid green;
		}
	}

	.Gunner__firing-info {
		margin: auto;

		padding: 0.5em;
		border-radius: 0.5em;
		border: 0.2em solid red;
		transition: border-color 0.25s;

		&.Gunner__ready-to-fire {
			border-color: green;
		}
	}

	// .Gunner__controls {
	// 	display: flex;
	// 	flex-direction: row;
	// 	justify-content: center;
	// 	margin: 0.5em;
	// }

	.Gunner__control {
		width: 3rem;
		height: 3rem;
		padding: 0;
		display: grid !important;
	}
</style>

<script setup lang="ts">
	import PrimeButton from 'primevue/button';
	import PrimeDock from 'primevue/dock';
	import vPrimeTooltip from 'primevue/tooltip';
	import { computed, ref, watch } from 'vue';
	import { promptSync } from '@/lib/prompts/sync';
	import { useArtillery } from '@/mixins/artillery';
	import {
		ServerConnectionState,
		useServerConnection,
	} from '@/mixins/server-connection';
	import { useSyncedRoom } from '@/mixins/synced-room';
	import {
		getUnitLabel,
		getUnitResolvedVector,
		Unit,
		UnitType,
	} from './lib/unit';
	import ArtilleryIcon from './components/icons/ArtilleryIcon.vue';
	import TargetIcon from './components/icons/TargetIcon.vue';

	const { wind, readyToFire, unitMap } = useArtillery();

	const serverConnection = useServerConnection();
	useSyncedRoom(readyToFire, unitMap, wind, serverConnection.webSocket);

	const artilleryUnits = computed(() => {
		return Object.keys(unitMap.value)
			.map((unitId) => unitMap.value[unitId])
			.filter((unit) => unit != null && unit.type === UnitType.Artillery);
	});

	const targetUnits = computed(() => {
		return Object.keys(unitMap.value)
			.map((unitId) => unitMap.value[unitId])
			.filter((unit) => unit != null && unit.type === UnitType.Target);
	});

	const selectedArtilleryIndex = ref(0);
	const selectedArtillery = computed(
		(): Unit | undefined => artilleryUnits.value[selectedArtilleryIndex.value]
	);
	const selectedTargetIndex = ref(0);
	const selectedTarget = computed(
		(): Unit | undefined => targetUnits.value[selectedTargetIndex.value]
	);

	watch(
		() => selectedArtillery.value == null && selectedArtilleryIndex.value > 0,
		(shouldReset) => {
			if (shouldReset)
				selectedArtilleryIndex.value = artilleryUnits.value.length - 1;
		}
	);
	watch(
		() => selectedTarget.value == null && selectedTargetIndex.value > 0,
		(shouldReset) => {
			if (shouldReset) selectedTargetIndex.value = targetUnits.value.length - 1;
		}
	);

	const firingVector = computed(() => {
		if (selectedArtillery.value == null || selectedTarget.value == null)
			return undefined;
		const resolvedArtillery = getUnitResolvedVector(
			unitMap.value,
			selectedArtillery.value.id
		);
		const resolvedTarget = getUnitResolvedVector(
			unitMap.value,
			selectedTarget.value.id
		);
		const firingVector = resolvedTarget.getRelativeOffset(resolvedArtillery);
		return firingVector.addVector(wind.value.scale(-1));
	});

	type Item = {
		label: string;
		icon?: string;
		iconComponent?: any;
		severity?: string;
		disabled?: boolean;
		command: () => void;
	};
	const isConnected = computed(
		() =>
			serverConnection.connectionState.value === ServerConnectionState.connected
	);
	const connectedItem = computed<Item>(() => ({
		label: isConnected.value ? 'Connected' : 'Disconnected',
		icon: 'pi pi-sync',
		severity: isConnected.value ? 'success' : 'danger',
		command: () => promptSync(),
	}));
	const dockControls = computed<Item[]>(() => [
		connectedItem.value,
		{
			label: 'Calculator interface',
			icon: 'pi pi-window-maximize',
			severity: 'secondary',
			command: () => openCalculator(),
		},
	]);

	const openCalculator = () => {
		window.location.pathname = window.location.pathname.replace('/gunner', '');
	};
</script>
