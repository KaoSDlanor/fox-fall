import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import WebSocket from 'ws';

const app = new Hono();
app.use(
	'/*',
	serveStatic({
		root: './www/',
		index: 'index.html',
		onNotFound: (path, c) => {
			console.log(`${path} is not found, request to ${c.req.path}`);
		},
	})
);
serve({
	fetch: app.fetch,
	port: 80,
});
const wss = new WebSocket.Server({ port: 81 });

enum UpdateType {
	unit = 'unit',
	full = 'full',
}

type RoomUpdate =
	| {
			type: UpdateType.full;
			value: Record<string, unknown>;
	  }
	| {
			type: UpdateType.unit;
			unitId: string;
			value: unknown;
	  };

const isRoomUpdate = (value: unknown): value is RoomUpdate => {
	return typeof value === 'object' && value !== null && 'type' in value;
};

class Room {
	sockets = new Set<WebSocket>();
	state: Record<string, unknown> = {};

	sendUpdate(roomUpdate: RoomUpdate, ws?: WebSocket) {
		const message = JSON.stringify(roomUpdate);
		if (ws) {
			ws.send(message);
		} else {
			for (const ws of this.sockets) {
				ws.send(message);
			}
		}
	}

	sendUnit(unitId: string, ws?: WebSocket) {
		this.sendUpdate(
			{
				type: UpdateType.unit,
				unitId,
				value: this.state[unitId],
			},
			ws
		);
	}

	setUnit(unitId: string, value: unknown) {
		this.state[unitId] = value;
		this.sendUnit(unitId);
	}

	sendState(ws?: WebSocket) {
		const roomUpdate: RoomUpdate = {
			type: UpdateType.full,
			value: this.state,
		};
		this.sendUpdate(roomUpdate, ws);
	}

	setState(value: Record<string, unknown>) {
		this.state = value;
		this.sendState();
	}
}
const rooms = new Map<string, Room>();

const getRoom = (code: string) => {
	if (!rooms.has(code)) {
		rooms.set(code, new Room());
	}
	return rooms.get(code)!;
};

const addSocketToRoom = (code: string, ws: WebSocket) => {
	const room = getRoom(code);
	room.sockets.add(ws);

	ws.on('message', (message) => {
		const data = JSON.parse(message.toString());
		if (!isRoomUpdate(data)) return;
		if (data.type === UpdateType.full) {
			room.setState(data.value);
		} else if (data.type === UpdateType.unit) {
			room.setUnit(data.unitId, data.value);
		}
	});

	room.sendState(ws);
	const intervalId = setInterval(() => {
		room.sendState(ws);
	}, 30_000);

	ws.once('close', () => {
		clearInterval(intervalId);
		removeSocketFromRoom(code, ws);
	});
};

const removeSocketFromRoom = (code: string, ws: WebSocket) => {
	const room = getRoom(code);
	room.sockets.delete(ws);
	setTimeout(
		() => {
			if (room.sockets.size === 0) {
				rooms.delete(code);
			}
		},
		60 * 60 * 1000
	);
};

wss.on('connection', (ws, req) => {
	const url = new URL(req.url!, 'http://127.0.0.1');
	const code = url.searchParams.get('code');
	console.log('new connection', code);
	if (!code) {
		ws.close();
		return;
	}

	addSocketToRoom(code, ws);
});
