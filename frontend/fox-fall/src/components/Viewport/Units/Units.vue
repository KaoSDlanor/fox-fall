<template>
	<div class="Units__container">
		<UnitProvider
			v-for="unitId in Object.keys(artillery.sharedState.currentState.value.unitMap)"
			:key="unitId"
			:unit="artillery.sharedState.currentState.value.unitMap[unitId]"
		>
			<UnitComponent
				@create-child="($event) => artillery.sharedState.produceUpdate(() => withHandling(() => artillery.addUnit($event, undefined, undefined, unitId)))"
				@updated="() => artillery.sharedState.produceUpdate(() => withHandling(() => syncedRoom.updateUnit(unitId)))"
				@remove="() => artillery.sharedState.produceUpdate(() => withHandling(() => artillery.removeUnit(unitId)))"
				@set-unit-source="($event) => artillery.sharedState.produceUpdate(() => withHandling(() => artillery.setUnitSource(unitId, $event)))"
				@update-wind="($event) => artillery.sharedState.produceUpdate(() => withHandling(() => artillery.editWind(unitId, $event.firingSolution, $event.removeUnitAfter)))"
			/>
		</UnitProvider>
		<UnitLink
			v-for="unitId in Object.keys(artillery.sharedState.currentState.value.unitMap).filter(
				(unitId) => artillery.sharedState.currentState.value.unitMap[unitId].parentId != null
			)"
			:key="unitId"
			:unit-id-from="artillery.sharedState.currentState.value.unitMap[unitId].parentId!"
			:unit-id-to="unitId"
		/>
	</div>
</template>

<style lang="scss">
	.Units__container {
		display: contents;
	}
</style>

<script setup lang="ts">
	import { withHandling } from '@packages/frontend-libs/dist/error';
	import UnitComponent from '@/components/Viewport/Units/Unit.vue';
	import UnitLink from '@/components/Viewport/UnitLink.vue';
	import UnitProvider from '@/contexts/unit/UnitProvider.vue';
	import { artillery, syncedRoom } from '@/lib/globals';
</script>
