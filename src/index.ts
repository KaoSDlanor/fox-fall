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
	full = 'full',
	readyToFire = 'readyToFire',
	unit = 'unit',
	wind = 'wind',
}

type RoomUpdate =
	| {
			type: UpdateType.full;
			eventFrom?: string;
			readyToFire?: boolean;
			units: Record<string, unknown>;
			wind?: unknown;
	  }
	| {
			type: UpdateType.readyToFire;
			eventFrom?: string;
			value: boolean;
	  }
	| {
			type: UpdateType.unit;
			eventFrom?: string;
			unitId: string;
			value: unknown;
	  }
	| {
			type: UpdateType.wind;
			eventFrom?: string;
			value: unknown;
	  };

const isRoomUpdate = (value: unknown): value is RoomUpdate => {
	return typeof value === 'object' && value !== null && 'type' in value;
};

class Room {
	sockets = new Set<WebSocket>();
	readyToFire = false;
	units: Record<string, unknown> = {};
	wind?: unknown;

	sendUpdate(roomUpdate: RoomUpdate, eventFrom?: string, ws?: WebSocket) {
		const message = JSON.stringify(roomUpdate);
		if (ws) {
			ws.send(message);
		} else {
			for (const ws of this.sockets) {
				ws.send(message);
			}
		}
	}

	sendUnit(unitId: string, eventFrom?: string, ws?: WebSocket) {
		this.sendUpdate(
			{
				type: UpdateType.unit,
				eventFrom,
				unitId,
				value: this.units[unitId],
			},
			eventFrom,
			ws
		);
	}

	setUnit(unitId: string, value: unknown, eventFrom?: string) {
		this.units[unitId] = value;
		this.sendUnit(unitId, eventFrom);
	}

	sendState(eventFrom?: string, ws?: WebSocket) {
		const roomUpdate: RoomUpdate = {
			type: UpdateType.full,
			eventFrom,
			readyToFire: this.readyToFire,
			units: this.units,
			wind: this.wind,
		};
		this.sendUpdate(roomUpdate, eventFrom, ws);
	}

	setState(readyToFire?: boolean, units?: Record<string, unknown>, wind?: unknown, eventFrom?: string) {
		if (readyToFire !== undefined) this.readyToFire = readyToFire;
		if (units !== undefined) this.units = units;
		if (wind !== undefined) this.wind = wind;
		this.sendState(eventFrom);
	}

	sendReadyToFire(eventFrom?: string, ws?: WebSocket) {
		this.sendUpdate(
			{
				type: UpdateType.readyToFire,
				eventFrom,
				value: this.readyToFire,
			},
			eventFrom,
			ws
		);
	}

	setReadyToFire(value: boolean, eventFrom?: string) {
		this.readyToFire = value;
		this.sendReadyToFire(eventFrom);
	}

	sendWind(eventFrom?: string, ws?: WebSocket) {
		this.sendUpdate(
			{
				type: UpdateType.wind,
				eventFrom,
				value: this.wind,
			},
			eventFrom,
			ws
		);
	}

	setWind(value: unknown, eventFrom?: string) {
		this.wind = value;
		this.sendWind(eventFrom);
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
			room.setState(data.readyToFire, data.units, data.wind, data.eventFrom);
		} else if (data.type === UpdateType.readyToFire) {
			room.setReadyToFire(data.value, data.eventFrom);
		} else if (data.type === UpdateType.unit) {
			room.setUnit(data.unitId, data.value, data.eventFrom);
		} else if (data.type === UpdateType.wind) {
			room.setWind(data.value, data.eventFrom);
		}
	});

	room.sendState(undefined, ws);
	const intervalId = setInterval(() => {
		room.sendState(undefined, ws);
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
