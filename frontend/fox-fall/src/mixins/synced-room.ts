import { ref, watch, type Ref } from 'vue';
import { isRoomUpdate, type RoomUpdate, UpdateType } from '@packages/data';
import { generateId } from '@packages/data/dist/id';
import { type UnitMap, type Unit } from '@packages/data/dist/artillery/unit';
import { Vector } from '@packages/data/dist/artillery/vector';
	import { withHandling } from '@packages/frontend-libs/dist/error';
import type { SharedObject } from '@packages/frontend-libs/dist/shared-object';
import type { SharedState } from '@/lib/shared-state';

const myId = generateId();

const parseVector = (vector: any): Vector => {
	if (vector == null) return Vector.fromCartesianVector({ x: 0, y: 0 });
	if (vector.x != null && vector.y != null) return Vector.fromCartesianVector({ x: vector.x, y: vector.y });
	if (vector.azimuth != null && vector.distance != null) return Vector.fromAngularVector({ azimuth: vector.azimuth, distance: vector.distance });
	if (vector._angularVector != null) return Vector.fromAngularVector(vector._angularVector);
	if (vector._cartesianVector != null) return Vector.fromCartesianVector(vector._cartesianVector);
	throw new Error('Invalid vector');
};

export function useSyncedRoom(
	sharedState: SharedObject<SharedState>,
	webSocket: Ref<WebSocket | null | undefined>
) {
	const isReady = ref(false);

	const onMessage = (event: MessageEvent<any>) => {
		sharedState.produceUpdate(() => withHandling(() => {
			const roomUpdate = JSON.parse(event.data);
			if (!isRoomUpdate(roomUpdate) || roomUpdate.eventFrom === myId) return;
			if (roomUpdate.type === UpdateType.full) {
				const newValue: UnitMap = {};
				for (const unitId of Object.keys(roomUpdate.units)) {
					newValue[unitId] = roomUpdate.units[unitId] as Unit;
				}
				sharedState.currentState.value.unitMap = newValue;

				if (roomUpdate.wind != null) {
					sharedState.currentState.value.wind = parseVector(roomUpdate.wind).angularVector;
				}

				if (roomUpdate.readyToFire != null) {
					sharedState.currentState.value.readyToFire = roomUpdate.readyToFire;
				}

				if (!isReady.value) {
					isReady.value = true;
				}
			} else if (roomUpdate.type === UpdateType.readyToFire) {
				sharedState.currentState.value.readyToFire = roomUpdate.value;
			} else if (roomUpdate.type === UpdateType.unit) {
				const unitId = roomUpdate.unitId;
				if (roomUpdate.value == null) {
					delete sharedState.currentState.value.unitMap[unitId];
				} else {
					sharedState.currentState.value.unitMap[unitId] = roomUpdate.value as Unit;
				}
			} else if (roomUpdate.type === UpdateType.wind) {
				sharedState.currentState.value.wind = parseVector(roomUpdate.value).angularVector;
			}
		}), 'sync-system');
	};

	watch(
		webSocket,
		(newWebSocket, oldWebSocket) => {
			if (oldWebSocket) {
				oldWebSocket.removeEventListener('message', onMessage);
			}

			if (newWebSocket) {
				newWebSocket.addEventListener('message', onMessage);
			}
		},
		{ immediate: true }
	);

	const updateUnit = (unitId: string) => {
		const roomUpdate: RoomUpdate = {
			type: UpdateType.unit,
			eventFrom: myId,
			unitId,
			value:
				sharedState.currentState.value.unitMap[unitId] != null
					? JSON.parse(JSON.stringify(sharedState.currentState.value.unitMap[unitId]))
					: undefined,
		};
		webSocket.value?.send(JSON.stringify(roomUpdate));

		sharedState.currentState.value.readyToFire = false;
		updateReadyToFire();
	};

	const updateWind = () => {
		const roomUpdate: RoomUpdate = {
			type: UpdateType.wind,
			eventFrom: myId,
			value: JSON.parse(JSON.stringify(sharedState.currentState.value.wind)),
		};
		webSocket.value?.send(JSON.stringify(roomUpdate));
	};

	const updateReadyToFire = () => {
		const roomUpdate: RoomUpdate = {
			type: UpdateType.readyToFire,
			eventFrom: myId,
			value: sharedState.currentState.value.readyToFire,
		};
		webSocket.value?.send(JSON.stringify(roomUpdate));
	};

	const fullSync = () => {
		const roomUpdate: RoomUpdate = {
			type: UpdateType.full,
			eventFrom: myId,
			readyToFire: sharedState.currentState.value.readyToFire,
			units: JSON.parse(JSON.stringify(sharedState.currentState.value.unitMap)),
			wind: JSON.parse(JSON.stringify(sharedState.currentState.value.wind)),
		};
		webSocket.value?.send(JSON.stringify(roomUpdate));
	};

	sharedState.emitter.on('undo', fullSync);
	sharedState.emitter.on('redo', fullSync);

	return {
		isReady,

		fullSync,
		updateReadyToFire,
		updateUnit,
		updateWind,
	};
};
