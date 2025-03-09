export enum KeyboardCommand {
	ToggleOverlay = 'toggle-overlay',
};

export enum KeyboardModifiers {
	Ctrl = 'CommandOrControl',
	Shift = 'Shift',
	Alt = 'Alt',
	Windows = 'Meta',
};

export const KEY_CODE_TO_ELECTRON = {
	Numpad0: 'num0',
	Numpad1: 'num1',
	Numpad2: 'num2',
	Numpad3: 'num3',
	Numpad4: 'num4',
	Numpad5: 'num5',
	Numpad6: 'num6',
	Numpad7: 'num7',
	Numpad8: 'num8',
	Numpad9: 'num9',
	NumpadDecimal: 'numdec',
	NumpadDivide: 'numdiv',
	NumpadMultiply: 'nummult',
	NumpadSubtract: 'numsub',
	NumpadAdd: 'numadd',
	NumLock: 'Numlock', // not supported
	ScrollLock: 'scrolllock',
	CapsLock: 'capslock',
	MediaTrackPrevious: 'MediaPreviousTrack',
	MediaTrackNext: 'MediaNextTrack',
	MediaPlayPause: 'MediaPlayPause',
	MediaStop: 'MediaStop',
	VolumeUp: 'VolumeUp',
	VolumeDown: 'VolumeDown',
	VolumeMute: 'VolumeMute',
	Insert: 'Insert',
	Home: 'Home',
	End: 'End',
	Delete: 'Delete',
	PageUp: 'PageUp',
	PageDown: 'PageDown',
	F1: 'F1',
	F2: 'F2',
	F3: 'F3',
	F4: 'F4',
	F5: 'F5',
	F6: 'F6',
	F7: 'F7',
	F8: 'F8',
	F9: 'F9',
	F10: 'F10',
	F11: 'F11',
	F12: 'F12',
	F13: 'F13',
	F14: 'F14',
	F15: 'F15',
	F16: 'F16',
	F17: 'F17',
	F18: 'F18',
	F19: 'F19',
	F20: 'F20',
	F21: 'F21',
	F22: 'F22',
	F23: 'F23',
	F24: 'F24',
	// PrintScreen: 'PrintScreen', // not supported
	KeyA: 'A',
	KeyB: 'B',
	KeyC: 'C',
	KeyD: 'D',
	KeyE: 'E',
	KeyF: 'F',
	KeyG: 'G',
	KeyH: 'H',
	KeyI: 'I',
	KeyJ: 'J',
	KeyK: 'K',
	KeyL: 'L',
	KeyM: 'M',
	KeyN: 'N',
	KeyO: 'O',
	KeyP: 'P',
	KeyQ: 'Q',
	KeyR: 'R',
	KeyS: 'S',
	KeyT: 'T',
	KeyU: 'U',
	KeyV: 'V',
	KeyW: 'W',
	KeyX: 'X',
	KeyY: 'Y',
	KeyZ: 'Z',
	Digit0: '0',
	Digit1: '1',
	Digit2: '2',
	Digit3: '3',
	Digit4: '4',
	Digit5: '5',
	Digit6: '6',
	Digit7: '7',
	Digit8: '8',
	Digit9: '9',
	Minus: '-',
	Equal: '=',
	Backquote: '`',
	Comma: ',',
	Period: '.',
	Slash: '/',
	BracketLeft: '[',
	Backslash: '\\',
	BracketRight: ']',
	Semicolon: ';',
	Quote: '"',
	Backspace: 'Backspace',
	Space: 'Space',
	ArrowLeft: 'Left',
	ArrowUp: 'Up',
	ArrowRight: 'Right',
	ArrowDown: 'Down',
	Escape: 'Escape',
} as const;

export type KeyCombo = Pick<KeyboardEvent, 'code' | 'ctrlKey' | 'shiftKey' | 'altKey' | 'metaKey'>;

export const extractKeyCombo = (event: KeyboardEvent) => ({
	code: event.code,
	ctrlKey: event.ctrlKey,
	shiftKey: event.shiftKey,
	altKey: event.altKey,
	metaKey: event.metaKey,
});

export const mapKeyboardEventToAccelerator = (event: KeyCombo) => {
	if (event.code === 'Escape') return undefined;
	if (!(event.code in KEY_CODE_TO_ELECTRON)) return undefined;
	const valueSegments: string[] = [];
	if (event.ctrlKey) valueSegments.push(KeyboardModifiers.Ctrl);
	if (event.shiftKey) valueSegments.push(KeyboardModifiers.Shift);
	if (event.altKey) valueSegments.push(KeyboardModifiers.Alt);
	if (event.metaKey) valueSegments.push(KeyboardModifiers.Windows);
	valueSegments.push(KEY_CODE_TO_ELECTRON[event.code as keyof typeof KEY_CODE_TO_ELECTRON]);

	return valueSegments.join('+');
};

export type KeyboardConfig = Partial<Record<KeyboardCommand, string>>;
