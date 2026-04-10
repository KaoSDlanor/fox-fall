<template>
	<FoxSelect
		ref="selectElement"
		class="AmmoSelect__select"
		enable-search
		enable-clear
		v-model="modelValue"
		:options="ammoOptions"
	>
		<template #placeholder>Select ammo type</template>
	</FoxSelect>
</template>

<script setup lang="ts">
	import { computed, markRaw, shallowRef } from 'vue';
	import { AMMO_TYPE, ARTILLERY_BY_SHELL } from '@packages/data/dist/artillery/unit/constants';
	import { ICONS } from '@packages/frontend-libs/dist/icons';
	import FoxSelect from '@packages/frontend-libs/dist/inputs/FoxSelect.vue';

	const selectElement = shallowRef<InstanceType<typeof FoxSelect>>(null!);

	const modelValue = defineModel<AMMO_TYPE>('modelValue');

	const ammoOptions = computed(() => {
		const output: Map<AMMO_TYPE, { label: string; icon?: any, order: number }> = new Map();
		for (const [index, shell] of (Object.keys(ARTILLERY_BY_SHELL) as AMMO_TYPE[]).sort().entries()) {
			output.set(shell, { label: shell, icon: markRaw(ICONS[shell]), order: index });
		}
		return output;
	});

	const focus = () => selectElement.value?.focus();
	const blur = () => selectElement.value?.blur();

	defineExpose({
		selectElement,
		focus,
		blur,
	});
</script>
