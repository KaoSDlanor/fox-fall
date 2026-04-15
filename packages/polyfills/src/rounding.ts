export function fixRounding() {
	if ((8.0125).toFixed(3) === String(8.012)) {
		const toFixedNative = Number.prototype.toFixed;

		const decimalSeparator = String(1.1)[1];
		const fracRegEx = new RegExp(`\\${decimalSeparator}(\\d+)`);
		function getFraction(num: number): string | null {
			const match = fracRegEx.exec(String(num)) ?? [];
			return match[1] ?? null;
		}

		Number.prototype.toFixed = function (this: number, digitCount = 0) {
			if ((getFraction(this)?.length ?? 0) > digitCount) {
				return toFixedNative.call(Number(`${this}1`), digitCount);
			}

			return toFixedNative.call(this, digitCount);
		};
	}
}
