import { ElectronApiCommand } from "@packages/types/dist/electron-api.js";
import type { KeyboardCommand } from "@packages/types/dist/keyboard-config.js";
import { app, BrowserWindow, desktopCapturer, ipcMain, screen } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getKeyboardShortcut, pauseKeyboardShortcuts, resumeKeyboardShortcuts, updateKeyboardShortcut } from "../keyboard-shortcuts.mjs";

const __dirname = import.meta.dirname;
const display = screen.getPrimaryDisplay();

let size = {
	x: 0,
	y: 0,
};

let managerWindow: BrowserWindow | null = null;

let overlayOpen = true;
export const updateShape = () => {
	if (managerWindow == null) return;

	if (overlayOpen) {
		managerWindow.setShape([managerWindow.getBounds()]);
		managerWindow.show();
	} else {
		managerWindow.setShape([
			{
				x: display.bounds.width - size.x,
				y: display.bounds.height - size.y,
				width: size.x,
				height: size.y,
			},
		]);

		managerWindow.minimize();
		setTimeout(() => managerWindow!.showInactive(), 100);
	}

	managerWindow.setAlwaysOnTop(true, "screen-saver");
};
export const toggleOverlay = () => {
	overlayOpen = !overlayOpen;
	updateShape();

	if (managerWindow == null) return;
	managerWindow.webContents.send("overlay-toggled", overlayOpen);
};

export const initialise = () => {
	managerWindow = new BrowserWindow({
		frame: false,
		autoHideMenuBar: true,
		transparent: true,
		fullscreen: true,
		movable: false,
		resizable: false,
		webPreferences: {
			preload: path.join(__dirname, "./preload.mjs"),
			nodeIntegration: true,
		},
		// focusable: false,
	});

	managerWindow.webContents.session.setDisplayMediaRequestHandler(
		(request, callback) => {
			(async () => {
				const sources = await desktopCapturer.getSources({ types: ["screen"] });
				callback({
					video: sources[0],
				});
			})();
		}
	);

	ipcMain.on(ElectronApiCommand.ToggleOverlay, (event) => {
		toggleOverlay();
	});
	ipcMain.on(ElectronApiCommand.GetOverlayOpen, (event) => {
		event.reply(ElectronApiCommand.OverlayOpenReply, overlayOpen);
	});
	ipcMain.on(
		ElectronApiCommand.SendToggleSize,
		(event, newSize: { x: number; y: number }) => {
			size = newSize;
			if (!overlayOpen) {
				updateShape();
			}
		}
	);
	ipcMain.on(ElectronApiCommand.PauseKeyboardShortcuts, (event) => {
		pauseKeyboardShortcuts();
	});
	ipcMain.on(ElectronApiCommand.ResumeKeyboardShortcuts, (event) => {
		resumeKeyboardShortcuts();
	});
	ipcMain.on(ElectronApiCommand.UpdateKeyboardShortcut, (event, command: KeyboardCommand, accelerator?: string) => {
		updateKeyboardShortcut(command, accelerator);
	});
	ipcMain.on(ElectronApiCommand.GetKeyboardShortcut, (event, command: KeyboardCommand) => {
		event.reply(ElectronApiCommand.KeyboardShortcutReply, getKeyboardShortcut(command));
	});
	toggleOverlay();

	const url = pathToFileURL(path.join(__dirname, "../../www/index.html"));

	managerWindow.setAlwaysOnTop(true, "screen-saver");
	managerWindow.loadURL(url.href);
	// setInterval(() => managerWindow!.moveTop(), 1000);

	managerWindow.on("close", () => {
		app.quit();
	});
};

export const showManager = () => {
	managerWindow?.showInactive();
};

export const hideManager = () => {
	managerWindow?.hide();
};

export const toggleManager = () => {
	if (managerWindow?.isVisible()) {
		hideManager();
	} else {
		showManager();
	}
};
