import { inject, provide, type Ref } from 'vue';

export const unitSettingsOpenSymbol = Symbol('unitSettingsOpen');

export function provideUnitSettingsOpen(unitSettingsOpen: Ref<Set<string>>) {
	provide(unitSettingsOpenSymbol, unitSettingsOpen);
};

export function injectUnitSettingsOpenOptional(): Ref<Set<string>> | undefined {
	const unitSettingsOpen = inject<Ref<Set<string>>>(unitSettingsOpenSymbol);

	return unitSettingsOpen;
};

export function injectUnitSettingsOpen(): Ref<Set<string>> {
	const unitSettingsOpen = injectUnitSettingsOpenOptional();

	if (unitSettingsOpen == null) {
		throw new Error('No unitSettingsOpen provided');
	}

	return unitSettingsOpen;
};
