import { BrowserWindow } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";

let mainWindow: BrowserWindow | null = null;

export const initialise = () => {
	mainWindow = new BrowserWindow({
		frame: false,
		autoHideMenuBar: true,
		transparent: true,
		fullscreen: true,
		// focusable: false,
		closable: false,
		show: false,
	});

	const url = pathToFileURL(path.join(__dirname, "../../www/index.html"));
	url.searchParams.append("overlay", "true");

	mainWindow.setAlwaysOnTop(true, "dock", 9);
	mainWindow.loadURL(url.href);
};

export const showMain = () => {
	mainWindow?.show();
};

export const hideMain = () => {
	mainWindow?.hide();
};

export const toggleMain = () => {
	if (mainWindow?.isVisible()) {
		hideMain();
	} else {
		showMain();
	}
};
