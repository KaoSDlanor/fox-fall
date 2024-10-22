import { computed, onScopeDispose, ref, watch } from 'vue';
import { provideServerConnection } from '@/contexts/server-connection';
import { saveSettings, settings } from '@/lib/settings';

const RECONNECT_INTERVAL = 10_000;

export enum ServerConnectionState {
	disconnected = 'Disconnected',
	connecting = 'Connecting',
	connected = 'Connected',
}

export const getConnectionDetailsFromUrl = () => {
	const url = new URL(window.location.href);
	let serverAddress = url.searchParams.get('serverAddress') || url.hostname;
	let code = url.searchParams.get('code');

	if (!serverAddress || !code) return null;

	return { serverAddress, code };
};

export const getConnectionDetails = () => {
	const connectionDetails = getConnectionDetailsFromUrl();
	if (connectionDetails) {
		settings.value.sync = { ...connectionDetails };
		saveSettings();
		return connectionDetails;
	}

	if (settings.value.sync) {
		const newUrl = new URL(window.location.href);
		newUrl.searchParams.set('serverAddress', settings.value.sync.serverAddress);
		newUrl.searchParams.set('code', settings.value.sync.code);
		location.search = newUrl.search;
	}

	return null;
};

export const useServerConnection = () => {
	const serverUrl = computed(() => {
		const connectionDetails = getConnectionDetails();

		const [address,port = '81'] = (connectionDetails?.serverAddress ?? '').split(':');

		return address
			? `ws://${address}:${port}/?code=${encodeURIComponent(connectionDetails?.code ?? '')}`
			: null;
	});

	const webSocket = ref<WebSocket>();
	const ready = ref(Promise.resolve());
	const destroyed = ref(false);
	const connectionState = ref(ServerConnectionState.disconnected);

	const disconnect = () => {
		if (!webSocket.value) return;
		webSocket.value.close();
		webSocket.value = undefined;
	};

	const connect = async () => {
		if (webSocket.value) disconnect();
		if (destroyed.value || !serverUrl.value) return;
		connectionState.value = ServerConnectionState.connecting;

		const newSocket = (webSocket.value = new WebSocket(serverUrl.value));
		await new Promise<void>((resolve, reject) => {
			newSocket.addEventListener('open', () => resolve(), { once: true });
			newSocket.addEventListener(
				'error',
				(_event) => {
					connectionState.value = ServerConnectionState.disconnected;
					reject(new Error('Failed to connect'));
				},
				{ once: true }
			);
		});
	};

	const reconnect = async () => {
		if (destroyed.value) return;
		ready.value = Promise.resolve()
			.then(
				() =>
					new Promise<void>((resolve) => {
						setTimeout(() => resolve(), RECONNECT_INTERVAL);
					})
			)
			.then(() => connect())
			.catch(() => reconnect());

		await ready.value;
	};

	const onConnect = () => {
		connectionState.value = ServerConnectionState.connected;
	};

	const onDisconnect = () => {
		connectionState.value = ServerConnectionState.disconnected;
		reconnect();
	};

	watch(webSocket, (newSocket, oldSocket) => {
		if (oldSocket) {
			oldSocket.removeEventListener('open', onConnect);
			oldSocket.removeEventListener('close', onDisconnect);
		}
		if (newSocket) {
			newSocket.addEventListener('open', onConnect);
			newSocket.addEventListener('close', onDisconnect);
		}
	});

	const stop = () => {
		destroyed.value = true;
		disconnect();
	};

	watch(serverUrl, () => connect(), { immediate: true });
	onScopeDispose(stop);

	const output = {
		stop,
		ready,
		connectionState,
		reconnect,

		webSocket,
	};

	provideServerConnection(output);

	return output;
};
