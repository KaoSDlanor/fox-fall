import { app, BrowserWindow } from "electron";
import "../server.js";

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

const initialise = async () => {
	await app.whenReady();

	const { AppUpdater } = await import("./updates.mjs");
	new AppUpdater();

	const { initialise: initialiseWindow } = await import("./window/index.mjs");
	initialiseWindow();

	const { initialise: initialiseKeyboardShortcuts } = await import(
		"./keyboard-shortcuts.mjs"
	);
	initialiseKeyboardShortcuts();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			initialiseWindow();
		}
	});
};

Promise.resolve()
	.then(() => initialise())
	.catch((e) => {
		console.log("Failed to start app");
		console.error(e);
		app.quit();
	});
