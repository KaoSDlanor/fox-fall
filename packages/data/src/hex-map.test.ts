import { expect, test } from 'vitest';
import { HEX_POSITIONS, Hex, KNOWN_MAP_NAMES } from './hex-map';

test('HEX_POSITIONS contains all known hex names', () => {
	for (const hex of Object.values(Hex)) {
		expect(HEX_POSITIONS.some((hexRow) => hexRow.includes(hex))).toBe(true);
	}
});

test('HEX_POSITIONS exclusively contains defined hex names and undefined', () => {
	const definedHexNames = Object.values(Hex);

	for (const hexRow of HEX_POSITIONS) {
		for (const hex of hexRow) {
			if (hex === undefined) continue;

			expect(definedHexNames.includes(hex)).toBe(true);
		}
	}
});

test('All defined hex names have a corresponding map name', () => {
	for (const hex of Object.values(Hex)) {
		expect(KNOWN_MAP_NAMES[hex] != null).toBe(true);
	}
});
