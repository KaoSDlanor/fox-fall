import { HEX_SIZE } from '@packages/data/dist/artillery/map';
import { Vector } from '@packages/data/dist/artillery/vector';
import {
	Hex,
	HEX_POSITIONS,
	KNOWN_MAP_NAMES,
} from '@packages/data/dist/hex-map';
import { MapIconInternal } from '@packages/data/dist/map-icons';
import {
	MapFlags,
	MapIconType,
	MapMarkerType,
	Team,
	TEAM_COLOR,
} from '@packages/foxhole-api';
import {
	HEX_MAPS,
	MapSource,
} from '@packages/frontend-libs/dist/assets/images/hex-maps';
import { MAP_ICONS_BY_API, MAP_ICONS_BY_NAME } from '@packages/frontend-libs/dist/assets/images/map-icons';
import { useScopePerSetEntry } from '@packages/frontend-libs/dist/scope';
import { Delaunay } from 'd3-delaunay';
import { watch, Ref, onScopeDispose, watchEffect, computed } from 'vue';
import { useShouldRender } from '@/lib/lod';
import { useWarData } from '@/lib/war-data';
import { useRenderState } from './render-state';

export type HexMapOptions = {
	instanceId: Ref<string>;
	mapSource: MapSource;
	zoom: Ref<number>;
	position: Ref<Vector>;
	width: Ref<number>;
	height: Ref<number>;
	backdropCanvas?: OffscreenCanvas;
	foregroundCanvas?: OffscreenCanvas;
	elementFilters?: {
		map?: Ref<boolean>;
		mapZone?: Ref<boolean>;
		mapIcon?: Ref<boolean>;
		hexLabel?: Ref<boolean>;
		regionLabel?: Ref<boolean>;
		minorLabel?: Ref<boolean>;
	};
	onDispose?: () => void;
};
export function useHexMap(options: HexMapOptions) {
	const renderingState = useRenderState();
	let running = false;
	const warData = useWarData({ instanceId: options.instanceId });

	const { drawHexLabels, drawRegionLabels, drawIcons, drawMinorLabels } = useShouldRender({
		width: options.width,
		height: options.height,
		zoom: options.zoom,
	});

	watch(computed(() => [
		options.position.value.x,
		options.position.value.y,
		options.zoom.value,
		options.width.value,
		options.height.value,
		options.elementFilters?.map?.value,
		options.elementFilters?.mapZone?.value,
		options.elementFilters?.mapIcon?.value,
		options.elementFilters?.hexLabel?.value,
		options.elementFilters?.regionLabel?.value,
		options.elementFilters?.minorLabel?.value
	]), () => renderingState.setRenderRequired(true), { immediate: true });

	const backdropCanvas =
		options.backdropCanvas ??
		new OffscreenCanvas(options.width.value, options.height.value);
	const backdropContext = backdropCanvas.getContext('2d')!;
	if (!backdropContext) {
		throw new Error('Failed to get backdrop context');
	}

	const foregroundCanvas =
		options.foregroundCanvas ??
		new OffscreenCanvas(options.width.value, options.height.value);
	const foregroundContext = foregroundCanvas.getContext('2d')!;
	if (!foregroundContext) {
		throw new Error('Failed to get foreground context');
	}

	let frameRequest: ReturnType<typeof requestAnimationFrame> | null = null;
	const cancelFrame = () => {
		if (frameRequest != null) {
			cancelAnimationFrame(frameRequest);
			frameRequest = null;
		}
	};
	const requestFrame = () => {
		cancelFrame();
		frameRequest = requestAnimationFrame(render);
	};

	watch(
		options.width,
		(newWidth) => {
			backdropCanvas.width = newWidth;
			foregroundCanvas.width = newWidth;
		},
		{ immediate: true }
	);

	watch(
		options.height,
		(newHeight) => {
			backdropCanvas.height = newHeight;
			foregroundCanvas.height = newHeight;
		},
		{ immediate: true }
	);

	function getHexCanvas() {
		const canvas = new OffscreenCanvas(HEX_SIZE.width, HEX_SIZE.height);
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Failed to get hex canvas context');
		context.clearRect(0, 0, HEX_SIZE.width, HEX_SIZE.height);
		context.beginPath();
		context.moveTo(HEX_SIZE.width / 4, 0);
		context.lineTo((HEX_SIZE.width * 3) / 4, 0);
		context.lineTo(HEX_SIZE.width, HEX_SIZE.height / 2);
		context.lineTo((HEX_SIZE.width * 3) / 4, HEX_SIZE.height);
		context.lineTo(HEX_SIZE.width / 4, HEX_SIZE.height);
		context.lineTo(0, HEX_SIZE.height / 2);
		context.clip();
		return { canvas, context };
	}

	let hexImages: Partial<Record<Hex, OffscreenCanvas>> = {};
	watchEffect(
		async () => {
			const newHexImages: Partial<Record<Hex, OffscreenCanvas>> = {};
			const newHexMap = await (
				(options.mapSource && HEX_MAPS[options.mapSource]) ||
				HEX_MAPS[MapSource.Vanilla]
			)();
			for (const [hex, imageSrc] of Object.entries(newHexMap) as [
				Hex,
				string,
			][]) {
				const hexImage = new Image();
				hexImage.src = imageSrc;
				hexImage.onload = () => {
					requestAnimationFrame(() => {
						const { canvas, context } = getHexCanvas();
						context.drawImage(hexImage, 0, 0, HEX_SIZE.width, HEX_SIZE.height);
						newHexImages[hex] = canvas;
						renderingState.setRenderRequired(true);
					});
				};
			}
			if (options.mapSource === options.mapSource) {
				hexImages = newHexImages;
				renderingState.setRenderRequired(true);
			}
		}
	);

	const mapIcons: Partial<
		Record<Team, Partial<Record<MapIconType | MapIconInternal, HTMLCanvasElement>>>
	> = {};
	const iconSources = [
		...Object.entries(MAP_ICONS_BY_API).map(([key, value]) => [Number(key) as MapIconType, value] as [MapIconType, string]),
		...(Object.entries(MAP_ICONS_BY_NAME) as [MapIconInternal, string][]),
	]
	for (const [iconKey, icon] of iconSources) {
		if (!icon) continue;
		const iconImage = new Image();
		iconImage.src = icon;
		iconImage.onload = () => {
			for (const team of Object.values(Team)) {
				requestAnimationFrame(() => {
					const canvas = document.createElement('canvas');
					canvas.width = iconImage.width;
					canvas.height = iconImage.height;
					const context = canvas.getContext('2d');
					if (!context) return;
					context.filter = `url(#team-icon-${team})`;
					context.drawImage(iconImage, 0, 0, iconImage.width, iconImage.height);

					if (!mapIcons[team]) {
						mapIcons[team] = {};
					}

					mapIcons[team]![iconKey] = canvas;
					renderingState.setRenderRequired(true);
				});
			}
		};
	}

	const mapZones = new Map<Hex, { canvas: OffscreenCanvas, context: OffscreenCanvasRenderingContext2D }>();
	useScopePerSetEntry(computed(() => new Set(Object.keys(KNOWN_MAP_NAMES) as Hex[])), (hex) => {
		const regionItems = computed(() => {
			const mapItems = warData.dynamicMapData.value[KNOWN_MAP_NAMES[hex]]?.mapItems;
			if (!mapItems) return [];
			return mapItems.filter(
				(item) =>
					item.iconType === MapIconType.RelicBase1 ||
					item.iconType === MapIconType.TownBase1 ||
					item.iconType === MapIconType.TownBase2 ||
					item.iconType === MapIconType.TownBase3
			);
		});

		const voronoi = computed(() => {
			if (!regionItems.value?.length) return null;
			return Delaunay.from(
				regionItems.value.map(
					(item) =>
						[item.x * HEX_SIZE.width, item.y * HEX_SIZE.height] as [
							number,
							number,
						]
				)
			).voronoi([0, 0, HEX_SIZE.width, HEX_SIZE.height]);
		});

		watch(() => [voronoi.value] as const, () => {
			requestAnimationFrame(() => {
				if (!voronoi.value || !regionItems.value?.length) return;
				const { canvas, context } = mapZones.get(hex) ?? getHexCanvas();
				context.clearRect(0, 0, HEX_SIZE.width, HEX_SIZE.height);

				context.strokeStyle = `#000000`;
				context.lineWidth = 3;
				context.beginPath();
				context.moveTo(HEX_SIZE.width / 4, 0);
				context.lineTo((HEX_SIZE.width * 3) / 4, 0);
				context.lineTo(HEX_SIZE.width, HEX_SIZE.height / 2);
				context.lineTo((HEX_SIZE.width * 3) / 4, HEX_SIZE.height);
				context.lineTo(HEX_SIZE.width / 4, HEX_SIZE.height);
				context.lineTo(0, HEX_SIZE.height / 2);
				context.closePath();
				context.stroke();

				for (const [index, regionItem] of regionItems.value.entries()) {
					const color = TEAM_COLOR[regionItem.teamId];
					context.fillStyle = `hsla(from ${color.hex} h s 60% / 0.2)`;
					context.strokeStyle = `rgba(0 0 0 / 0.3)`;
					context.lineWidth = 2;
					context.beginPath();
					voronoi.value.renderCell(index, context);
					context.fill();
					context.stroke();
				}

				mapZones.set(hex, { canvas, context });
				renderingState.setRenderRequired(true);
			});
		}, { immediate: true });
	}, 'pre');

	function render() {
		if (isDisposed) return;
		cancelFrame();

		try {
			backdropContext.clearRect(
				0,
				0,
				options.width.value,
				options.height.value
			);
			foregroundContext.clearRect(
				0,
				0,
				options.width.value,
				options.height.value
			);



			const hexLabelFontSize = Math.min(36, 200 * options.zoom.value);
			const regionFontSize = hexLabelFontSize / 1.5;
			const minorFontSize = regionFontSize / 1.5;

			function drawText(
				text: string,
				x: number,
				y: number,
				fontSize: number,
				foreground = 'black',
				background = 'white'
			) {
				foregroundContext!.fillStyle = background;
				foregroundContext!.strokeStyle = foreground;
				foregroundContext!.lineWidth = 4;
				foregroundContext!.font = `bold ${fontSize}px sans-serif`;
				foregroundContext!.lineJoin = 'round';
				foregroundContext.textBaseline = 'middle';
				const textMetrics = foregroundContext!.measureText(text);
				foregroundContext!.strokeText(text, x - textMetrics.width / 2, y);
				foregroundContext!.fillText(text, x - textMetrics.width / 2, y);
			}

			function drawIcon(icon: HTMLCanvasElement, hexPosition: Vector, x: number, y: number, scale = 1 / 1.5) {
				foregroundContext!.drawImage(
					icon,
					hexPosition.x +
					x * HEX_SIZE.width * options.zoom.value -
					icon.width * scale / 2,
					hexPosition.y +
					y * HEX_SIZE.height * options.zoom.value -
					icon.height * scale / 2,
					icon.width * scale,
					icon.height * scale
				);
			}

			const centerHexPosition = Vector.fromCartesianVector({
				x:
					options.position.value.x -
					(HEX_SIZE.width * options.zoom.value) / 2 +
					options.width.value / 2,
				y:
					options.position.value.y -
					(HEX_SIZE.height * options.zoom.value) / 2 +
					options.height.value / 2,
			});
			function forEachHex(
				callback: (hex: Hex, x: number, y: number, hexPosition: Vector) => void
			) {
				for (let [baseY, row] of HEX_POSITIONS.entries()) {
					const y = baseY - Math.floor(HEX_POSITIONS.length / 2);
					for (let [x, hex] of row.entries()) {
						x -= Math.floor(row.length / 2);
						if (!hex) continue;

						const hexPosition = Vector.fromCartesianVector({
							x:
								centerHexPosition.x +
								x * HEX_SIZE.width * options.zoom.value * 1.5 +
								(baseY % 2 === 0 ? 0 : HEX_SIZE.width * options.zoom.value * 0.75),
							y:
								centerHexPosition.y +
								(y * HEX_SIZE.height * options.zoom.value) / 2,
						});
						callback(hex, x, y, hexPosition);
					}
				}
			}

			if (options.elementFilters?.map?.value ?? true) {
				forEachHex((hex, _x, _y, hexPosition) => {
					if (!hexImages[hex]) return;
					backdropContext!.drawImage(
						hexImages[hex],
						hexPosition.x,
						hexPosition.y,
						HEX_SIZE.width * options.zoom.value,
						HEX_SIZE.height * options.zoom.value
					);
				});
			}

			if (drawIcons.value && (options.elementFilters?.mapIcon?.value ?? true)) {
				forEachHex((hex, _x, _y, hexPosition) => {
					const mapData = warData.dynamicMapData.value[KNOWN_MAP_NAMES[hex]];
					if (!mapData) return;
					for (const mapItem of mapData.mapItems) {
						const icon = mapIcons[mapItem.teamId]?.[mapItem.iconType];
						if (!icon) continue;

						const victoryOutline = mapIcons[mapItem.teamId]?.[MapIconInternal.VictoryOutline];
						if (mapItem.flags & MapFlags.IsVictoryBase && victoryOutline) {
							drawIcon(victoryOutline, hexPosition, mapItem.x, mapItem.y, 1);
						}

						const scorchedTown = mapIcons[mapItem.teamId]?.[MapIconInternal.ScorchedTown];
						if (mapItem.flags & MapFlags.IsScorched && scorchedTown) {
							drawIcon(scorchedTown, hexPosition, mapItem.x, mapItem.y, 1);
						} else {
							drawIcon(icon, hexPosition, mapItem.x, mapItem.y);
						}
					}
				});
			}

			if (options.elementFilters?.mapZone?.value ?? true) {
				forEachHex((hex, _x, _y, hexPosition) => {
					const mapZone = mapZones.get(hex);
					if (!mapZone) return;
					foregroundContext!.drawImage(
						mapZone.canvas,
						hexPosition.x,
						hexPosition.y,
						HEX_SIZE.width * options.zoom.value,
						HEX_SIZE.height * options.zoom.value
					);
				});
			}

			if (
				drawMinorLabels.value &&
				(options.elementFilters?.minorLabel?.value ?? true)
			) {
				forEachHex((hex, _x, _y, hexPosition) => {
					const mapData = warData.staticMapData.value[KNOWN_MAP_NAMES[hex]];
					if (!mapData) return;
					for (const textItem of mapData.mapTextItems) {
						if (textItem.mapMarkerType !== MapMarkerType.Minor) continue;
						drawText(
							textItem.text,
							hexPosition.x + textItem.x * HEX_SIZE.width * options.zoom.value,
							hexPosition.y + textItem.y * HEX_SIZE.height * options.zoom.value,
							minorFontSize
						);
					}
				});
			}

			if (
				drawRegionLabels.value &&
				(options.elementFilters?.regionLabel?.value ?? true)
			) {
				forEachHex((hex, _x, _y, hexPosition) => {
					const mapData = warData.staticMapData.value[KNOWN_MAP_NAMES[hex]];
					if (!mapData) return;
					for (const textItem of mapData.mapTextItems) {
						if (textItem.mapMarkerType !== MapMarkerType.Region) continue;
						drawText(
							textItem.text,
							hexPosition.x + textItem.x * HEX_SIZE.width * options.zoom.value,
							hexPosition.y + textItem.y * HEX_SIZE.height * options.zoom.value,
							regionFontSize
						);
					}
				});
			}

			if (drawHexLabels.value && (options.elementFilters?.hexLabel?.value ?? true)) {
				forEachHex((hex, _x, _y, hexPosition) => {
					drawText(
						hex,
						hexPosition.x + (HEX_SIZE.width * options.zoom.value) / 2,
						hexPosition.y + (HEX_SIZE.height * options.zoom.value) / 2,
						hexLabelFontSize
					);
				});
			}
		} finally {
			renderingState.setRenderRequired(false);
		}
	}

	renderingState.emitter.on('render-required', () => {
		if (running) {
			requestFrame();
		}
	});

	function start() {
		if (isDisposed) return;
		running = true;
		requestFrame();
	}

	function stop() {
		running = false;
		cancelFrame();
	}

	let isDisposed = false;
	onScopeDispose(() => {
		isDisposed = true;
		options.onDispose?.();
	});

	return {
		renderingState,
		backdropCanvas,
		foregroundCanvas,
		start,
		stop,
	};
}
