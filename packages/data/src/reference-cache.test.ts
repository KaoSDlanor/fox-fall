import { expect, test } from "vitest";
import { ReferenceCache } from "./reference-cache";

test("ReferenceCache.addReference increments the reference count without calling the factory", () => {
	const referenceCache = new ReferenceCache<null>();

	let calledCount = 0;
	for (let index = 0; index < 10; index++) {
		referenceCache.addReference("foo", () => {
			calledCount++;
			return null;
		});

		expect(calledCount).toBe(1);
		expect(referenceCache.getReferenceCount("foo")).toBe(index + 1);
	}
});

test('ReferenceCache.removeReference decrements the reference count', () => {
	const referenceCache = new ReferenceCache<null>();

	for (let index = 0; index < 10; index++) {
		referenceCache.addReference("foo", () => null);
	}
	expect(referenceCache.getReferenceCount('foo')).toBe(10);

	referenceCache.removeReference('foo');
	expect(referenceCache.getReferenceCount('foo')).toBe(9);
});

test("ReferenceCache.addReference only calls the factory function if the reference count reached zero", () => {
	const referenceCache = new ReferenceCache<null>();

	let calledCount = 0;
	const factoryFn = () => {
		calledCount++;
		return null;
	};

	for (let index = 0; index < 10; index++) {
		referenceCache.addReference("foo", factoryFn);
	}
	expect(calledCount).toBe(1);

	for (let index = 0; index < 10; index++) {
		referenceCache.removeReference("foo");
	}
	expect(referenceCache.getReferenceCount("foo")).toBe(0);

	for (let index = 0; index < 10; index++) {
		referenceCache.addReference("foo", factoryFn);
	}
	expect(calledCount).toBe(2);
});

test("ReferenceCache.useReference().stop cannot reduce the reference count more than once", () => {
	const referenceCache = new ReferenceCache<null>();

	referenceCache.addReference("foo", () => null);
	expect(referenceCache.getReferenceCount("foo")).toBe(1);

	const usedReference = referenceCache.useReference("foo", () => null);
	expect(referenceCache.getReferenceCount("foo")).toBe(2);
	usedReference.stop();
	expect(referenceCache.getReferenceCount("foo")).toBe(1);
	usedReference.stop();
	expect(referenceCache.getReferenceCount("foo")).toBe(1);
});
