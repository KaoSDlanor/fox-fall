import { expect, test } from "vitest";
import { toDegrees, toRadians } from "./angle";

test('Converting toDegrees and toRadians', () => {
	expect(toDegrees(Math.PI * 2)).toBeCloseTo(360);
	expect(toRadians(360)).toBeCloseTo(Math.PI * 2);
});
