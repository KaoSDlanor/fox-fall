<template>
	<canvas class="CanvasTest__canvas" ref="canvasRef" />
</template>

<script setup lang="ts">
	import { computed, onMounted, shallowRef, watch, watchEffect } from 'vue';
	import { loadShaders, render, updateResolution } from '@/lib/webgl';
	import { useElementBounding, useWindowSize } from '@vueuse/core';

	const canvasRef = shallowRef<HTMLCanvasElement | null>(null);
	const gl = shallowRef<WebGLRenderingContext | null>(null);
	const shaderProgram = shallowRef<WebGLProgram | null>(null);

	const props = defineProps<{
		resolution?: [number, number];
		uniforms?: (gl: WebGLRenderingContext, shaderProgram: WebGLProgram) => void;
		fragmentShaderSource?: string;
	}>();

	const windowSize = useWindowSize();
	const bounds = useElementBounding(canvasRef);

	const resolution = computed(() => {
		const defaultResolution = Math.min(
			bounds.width.value,
			bounds.height.value,
			Math.max(windowSize.width.value, windowSize.height.value)
		);
		return [
			props.resolution?.[0] ?? defaultResolution,
			props.resolution?.[1] ?? defaultResolution,
		] as [number, number];
	});

	watch(
		canvasRef,
		(newCanvas) => {
			gl.value =
				newCanvas?.getContext('webgl', {
					alpha: true,
					premultipliedAlpha: false,
				}) ?? null;
		},
		{ immediate: true }
	);

	const onResolutionChanged = (newResolution: [number, number]) => {
		if (canvasRef.value && gl.value && shaderProgram.value) {
			updateResolution(
				canvasRef.value,
				gl.value,
				shaderProgram.value,
				newResolution
			);

			gl.value.uniform2f(
				gl.value.getUniformLocation(shaderProgram.value, 'scaleFactor'),
				newResolution[0] / bounds.width.value,
				newResolution[1] / bounds.height.value
			);

			render(gl.value);
		}
	};

	watch(
		() =>
			[gl.value, props.fragmentShaderSource] as [
				WebGLRenderingContext | null,
				string | undefined,
			],
		([newGl, newFragmentShaderSource]) => {
			if (!newGl || !canvasRef.value) {
				shaderProgram.value = null;
				return;
			}

			newGl.enable(newGl.BLEND);
			newGl.blendFunc(newGl.SRC_ALPHA, newGl.ONE_MINUS_SRC_ALPHA);

			shaderProgram.value = loadShaders(newGl, [
				{
					type: newGl.VERTEX_SHADER,
					source: `
						precision highp float;
						attribute vec2 a_position;
            void main() {
							gl_Position = vec4(a_position, 0.0, 1.0);
            }
					`,
				},
				{
					type: newGl.FRAGMENT_SHADER,
					source:
						newFragmentShaderSource ??
						`
						precision highp float;

						uniform ivec2 iResolution;

						float sdCircle( vec2 p, float r )
						{
							return length(p) - r;
						}

						float sdEllipse( vec2 p, vec2 ab )
						{
							p = abs(p); if( p.x > p.y ) {p=p.yx;ab=ab.yx;}
							float l = ab.y*ab.y - ab.x*ab.x;
							float m = ab.x*p.x/l;      float m2 = m*m;
							float n = ab.y*p.y/l;      float n2 = n*n;
							float c = (m2+n2-1.0)/3.0; float c3 = c*c*c;
							float q = c3 + m2*n2*2.0;
							float d = c3 + m2*n2;
							float g = m + m*n2;
							float co;
							if( d<0.0 )
							{
								float h = acos(q/c3)/3.0;
								float s = cos(h);
								float t = sin(h)*sqrt(3.0);
								float rx = sqrt( -c*(s + t + 2.0) + m2 );
								float ry = sqrt( -c*(s - t + 2.0) + m2 );
								co = (ry+sign(l)*rx+abs(g)/(rx*ry)- m)/2.0;
							}
							else
							{
								float h = 2.0*m*n*sqrt( d );
								float s = sign(q+h)*pow(abs(q+h), 1.0/3.0);
								float u = sign(q-h)*pow(abs(q-h), 1.0/3.0);
								float rx = -s - u - c*4.0 + 2.0*m2;
								float ry = (s - u)*sqrt(3.0);
								float rm = sqrt( rx*rx + ry*ry );
								co = (ry/sqrt(rm-rx)+2.0*g/rm-m)/2.0;
							}
							vec2 r = ab * vec2(co, sqrt(1.0-co*co));
							return length(r-p) * sign(p.y-r.y);
						}

						vec2 rotate(vec2 p, float angle) {
							mat2 rotationMatrix = mat2(cos(-angle), -sin(-angle), sin(-angle), cos(-angle));
							return rotationMatrix * p;
						}

            void main() {
							vec2 uv = gl_FragCoord.xy / vec2(iResolution);
							gl_FragColor = vec4(uv.x, uv.y, 0.5, 0.5); // Simple gradient
							// vec2 p = (uv - vec2(0.5, 0.5)) * 2.0;
							// float dCircle = sdCircle(p, 0.5);
							// float dEllipse = sdEllipse(rotate(p, 0.5), vec2(0.5, 0.25));
							// gl_FragColor = vec4(dCircle > 0.0 ? 1.0 : 0.0, dEllipse > 0.0 ? 1.0 : 0.0, p.x / 2.0 + 0.5, p.y / 2.0 + 0.5);
            }
					`,
				},
			]);

			onResolutionChanged(resolution.value);
		},
		{ immediate: true, flush: 'sync' }
	);

	watch(resolution, onResolutionChanged, { immediate: true, flush: 'sync' });

	onMounted(() => {
		try {
			gl.value = canvasRef.value?.getContext('webgl') ?? null;
			if (!gl.value) {
				throw new Error('Failed to get WebGL context');
			}
		} catch (error) {
			console.error(error);
		}
	});

	watchEffect(
		() => {
			if (!gl.value || !shaderProgram.value) return;
			props.uniforms?.(gl.value, shaderProgram.value);
			render(gl.value);
		},
		{ flush: 'sync' }
	);

	defineExpose({
		resolution,

		render: () => {
			if (gl.value) {
				render(gl.value);
			}
		},
		updateAutoResolution: () => {
			bounds.update();
		},
	});
</script>
