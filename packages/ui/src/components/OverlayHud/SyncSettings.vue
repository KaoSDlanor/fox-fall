<template>
	<PrimeDialog
		append-to=".App__container"
		v-model:visible="visible"
		header="Sync"
		position="bottomleft"
		@pointerdown.stop
		@wheel.stop
	>
		<div class="Sync__settings">
			<div class="Sync__settings__item">
				<label>Use Encryption</label>
				<input
					type="checkbox"
					id="encryption"
					v-model="connectionDetails.useEncryption"
					@keydown.enter="connect"
				/>
			</div>
			<div class="Sync__settings__item">
				<label>Server address:</label>
				<TextInput
					v-model="connectionDetails.serverAddress"
					:allowEmpty="false"
					autofocus
					highlightOnFocus
					@keydown.enter="connect"
				/>
			</div>
			<div class="Sync__settings__item">
				<label>Sync code:</label>
				<TextInput
					v-model="connectionDetails.code"
					:allowEmpty="false"
					highlightOnFocus
					@keydown.enter="connect"
				/>
			</div>
			<PrimeButton
				class="Sync__settings__button"
				label="Connect"
				@pointerdown.stop="connect"
			/>
		</div>
	</PrimeDialog>
</template>

<style lang="scss">
	.Sync__settings {
		display: grid;
		grid-template-columns: max-content 1fr;
		gap: 1rem;
		align-items: center;
	}

	.Sync__settings__item {
		grid-column: auto / span 2;
		display: grid;
		grid-template-columns: subgrid;
		align-items: inherit;
	}

	.Wind__information__item__angle-input {
		margin: 0 !important;
	}

	.Sync__settings__button {
		grid-column: auto / span 2;
	}
</style>

<script setup lang="ts">
	import PrimeButton from 'primevue/button';
	import PrimeDialog from 'primevue/dialog';
	import { ref } from 'vue';
	import TextInput from '@/components/inputs/TextInput.vue';
	import { getConnectionDetails } from '@/mixins/server-connection';

	const visible = defineModel('visible', { type: Boolean, required: true });

	const connectionDetails = ref(getConnectionDetails() ?? { code : '', serverAddress : '', useEncryption: false});

	const connect = () => {
		const newUrl = new URL(window.location.href);
		if (connectionDetails.value.useEncryption) {
			newUrl.searchParams.set('useEncryption', ''); // ?useEncryption
		} else {
			newUrl.searchParams.delete('useEncryption');
		}
		newUrl.searchParams.set('serverAddress', connectionDetails.value.serverAddress);
		newUrl.searchParams.set('code', connectionDetails.value.code);
		if (newUrl.search === location.search) {
			location.reload();
		} else {
			location.search = newUrl.search;
		}
	};
</script>
