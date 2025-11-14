<template>
	<div class="RangeFinders__container">
		<template v-for="rangeFinder in rangeFinders" :key="rangeFinder.unit.id">
			<RangeFinder
				v-if="settings.rangeFinderMode === RangeFinderMode.Circular"
				:position="
					rangeFinder.resolvedPosition.addVector(rangeFinder.windOffset)
				"
				:outer-radius="rangeFinder.specs.MAX_RANGE"
				:inner-radius="rangeFinder.specs.MIN_RANGE"
				:style="RangeFinderStyle.Artillery"
			/>
			<DetailedRangeFinder
				v-else-if="settings.rangeFinderMode === RangeFinderMode.Detailed"
				:position="rangeFinder.resolvedPosition"
				:outer-radius="rangeFinder.specs.MAX_RANGE"
				:inner-radius="rangeFinder.specs.MIN_RANGE"
				:wind-per-meter="
					rangeFinder.specs.WIND_OFFSET_PER_METER *
					artillery.sharedState.currentState.value.wind.distance
				"
				:style="RangeFinderStyle.Artillery"
			/>
		</template>
		<template v-for="spotter in spotters" :key="spotter.unit.id">
			<RangeFinder
				v-if="settings.rangeFinderMode === RangeFinderMode.Circular"
				:position="spotter.resolvedPosition"
				:outer-radius="spotter.specs.MAX_RANGE"
				:style="RangeFinderStyle.Spotting"
			/>
			<DetailedRangeFinder
				v-else-if="settings.rangeFinderMode === RangeFinderMode.Detailed"
				:position="spotter.resolvedPosition"
				:outer-radius="spotter.specs.MAX_RANGE"
				:style="RangeFinderStyle.Spotting"
			/>
		</template>
	</div>
</template>

<style lang="scss">
	.RangeFinders__container {
		position: absolute;
		left: 0;
		top: 0;
		width: 0;
		height: 0;

		overflow: visible;

		pointer-events: none;
	}
</style>

<script setup lang="ts">
	import {
		ArtilleryPlatform,
		SPOTTING_BY_TYPE,
		SpottingSpecs,
	} from '@packages/data/dist/artillery/unit/constants';
	import { UnitType, type Unit } from '@packages/data/dist/artillery/unit';
	import type { Vector } from '@packages/data/dist/artillery/vector';
	import { artillery } from '@/lib/globals';
	import { getUnitResolvedVector, getUnitSpecs } from '@/lib/unit';
	import { useFocusedUnitIds } from '@/mixins/focused-units';
	import { computed } from 'vue';
	import { RangeFinderMode, settings } from '@/lib/settings';
	import RangeFinder from './RangeFinder.vue';
	import { RangeFinderStyle } from './enums';
	import DetailedRangeFinder from './DetailedRangeFinder.vue';

	const focusedUnitIds = useFocusedUnitIds();

	const rangeFinders = computed(() => {
		const output: {
			unit: Unit;
			specs: ArtilleryPlatform;
			resolvedPosition: Vector;
			windOffset: Vector;
		}[] = [];

		for (const unitId of focusedUnitIds.value) {
			const unit = artillery.sharedState.currentState.value.unitMap[unitId];

			if (unit.type !== UnitType.Artillery) continue;

			const specs = getUnitSpecs(
				artillery.sharedState.currentState.value.unitMap,
				unitId
			);
			if (specs == null) continue;

			output.push({
				unit,
				specs,
				resolvedPosition: getUnitResolvedVector(
					artillery.sharedState.currentState.value.unitMap,
					unit.id
				),
				windOffset: artillery
					.getWindOffset(unit.id, specs.MAX_RANGE)
					.scale(unit.type === UnitType.Artillery ? 1 : -1),
			});
		}

		return output;
	});

	const spotters = computed(() => {
		const output: {
			unit: Unit;
			specs: SpottingSpecs;
			resolvedPosition: Vector;
		}[] = [];

		for (const unitId of focusedUnitIds.value) {
			const unit = artillery.sharedState.currentState.value.unitMap[unitId];
			if (unit.type !== UnitType.Spotter || unit.spottingType == null) continue;

			output.push({
				unit,
				specs: SPOTTING_BY_TYPE[unit.spottingType],
				resolvedPosition: getUnitResolvedVector(
					artillery.sharedState.currentState.value.unitMap,
					unit.id
				),
			});
		}

		return output;
	});
</script>
