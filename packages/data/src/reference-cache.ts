import EventEmitter from "node:events";

export class ReferenceCache<T> extends EventEmitter<{
	delete: [key: string, value: T];
}> {
	private cache = new Map<string, { refCount: number; value: T }>();

	getReferenceCount(key: string) {
		const entry = this.cache.get(key);
		if (entry == null) {
			return 0;
		}
		return entry.refCount;
	}

	addReference(key: string, factory: () => T) {
		const entry = this.cache.get(key);
		if (entry == null) {
			const value = factory();
			this.cache.set(key, { refCount: 1, value });
			return value;
		}
		entry.refCount++;
		return entry.value;
	}

	removeReference(key: string) {
		const entry = this.cache.get(key);
		if (entry == null) {
			return;
		}
		entry.refCount--;
		if (entry.refCount === 0) {
			this.emit("delete", key, this.cache.get(key)!.value);
			this.cache.delete(key);
		}
	}

	useReference(key: string, factory: () => T) {
		const value = this.addReference(key, factory);

		const self = this;
		let released = false;
		function releaseReference() {
			if (released) return;
			released = true;
			self.removeReference(key);
		}

		return {
			value,
			stop: releaseReference,
		};
	}
}

export function wrapFunction<
	F extends (...args: any[]) => { stop: () => void },
>(basicFunction: F, getKey: (...args: Parameters<F>) => string): F {
	const nativeStopFunctions = new WeakMap<ReturnType<F>, () => void>();
	const cache = new ReferenceCache<ReturnType<F>>();

	cache.on("delete", (_key, value) => {
		nativeStopFunctions.get(value)?.();
	});

	function wrappedFunction(
		this: ThisParameterType<F>,
		...args: Parameters<F>
	): ReturnType<F> {
		const key = getKey(...args);

		const output = cache.addReference(
			key,
			() => basicFunction.call(this, ...args) as ReturnType<F>,
		);
		const nativeStopFunction = output.stop.bind(output);
		nativeStopFunctions.set(output, nativeStopFunction);

		output.stop = () => {
			cache.removeReference(key);
		};

		return output;
	}

	return wrappedFunction as unknown as F;
}
