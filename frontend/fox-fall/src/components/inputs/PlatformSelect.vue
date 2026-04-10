<template>
	<FoxSelect
		ref="selectElement"
		class="PlatformSelect__select"
		enable-search
		enable-clear
		v-model="modelValue"
		:options="platformOptions"
	>
		<template #placeholder>Select artillery platform</template>
	</FoxSelect>
</template>

<script setup lang="ts">
	import {
		AMMO_TYPE,
		ARTILLERY_BY_SHELL,
		Platform,
	} from '@packages/data/dist/artillery/unit/constants';
	import FoxSelect from '@packages/frontend-libs/dist/inputs/FoxSelect.vue';
	import { ICONS } from '@packages/frontend-libs/dist/icons';
	import { computed, markRaw, shallowRef } from 'vue';

	const selectElement = shallowRef<InstanceType<typeof FoxSelect>>(null!);

	const modelValue = defineModel<Platform<AMMO_TYPE>>('modelValue');
	const props = defineProps<{
		ammoType?: AMMO_TYPE;
	}>();

	const platformOptions = computed(() => {
		const output: Map<
			Platform<AMMO_TYPE>,
			{ label: string; searchKeys: string[]; icon?: any }
		> = new Map();

		for (const ammoType of Object.keys(ARTILLERY_BY_SHELL) as AMMO_TYPE[]) {
			if (props.ammoType != null && ammoType !== props.ammoType) continue;

			for (const platform of Object.keys(
				ARTILLERY_BY_SHELL[ammoType].PLATFORM
			) as Platform<AMMO_TYPE>[]) {
				output.set(platform, {
					label: platform,
					searchKeys: [ammoType],
					icon: markRaw(ICONS[platform]),
				});
			}
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
