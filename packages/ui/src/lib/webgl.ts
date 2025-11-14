export const render = (gl: WebGLRenderingContext) => {
	gl.clearColor(0.0, 0.0, 0.0, 0.0);
	gl.clear(gl.COLOR_BUFFER_BIT);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};

export const updateResolution = (
	canvas: HTMLCanvasElement,
	gl: WebGLRenderingContext,
	shaderProgram: WebGLProgram,
	resolution: [number, number]
) => {
	canvas.width = resolution[0];
	canvas.height = resolution[1];
	gl.viewport(0, 0, resolution[0], resolution[1]);
	const resolutionUniformLocation = gl.getUniformLocation(
		shaderProgram,
		'iResolution'
	);
	gl.uniform2i(resolutionUniformLocation, Math.round(resolution[0]), Math.round(resolution[1]));
};

export const loadShaders = (
	gl: WebGLRenderingContext,
	shaders: {
		type:
			| WebGLRenderingContextBase['FRAGMENT_SHADER']
			| WebGLRenderingContextBase['VERTEX_SHADER'];
		source: string;
	}[]
) => {
	const shaderProgram = gl.createProgram();
	if (!shaderProgram) {
		throw new Error('Failed to create shader program');
	}

	for (const shader of shaders) {
		const shaderInstance = gl.createShader(shader.type);
		if (!shaderInstance) {
			throw new Error('Failed to create shader instance');
		}
		gl.shaderSource(shaderInstance, shader.source);
		gl.compileShader(shaderInstance);
		if (!gl.getShaderParameter(shaderInstance, gl.COMPILE_STATUS)) {
			const err = new Error(
				gl.getShaderInfoLog(shaderInstance) || 'Shader compilation failed'
			);
			gl.deleteShader(shaderInstance);
			throw err;
		}
		gl.attachShader(shaderProgram, shaderInstance);
	}

	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		const err = new Error(
			gl.getProgramInfoLog(shaderProgram) || 'Shader program linking failed'
		);
		gl.deleteProgram(shaderProgram);
		throw err;
	}

	gl.useProgram(shaderProgram);
	const vertices: Float32Array = new Float32Array([
		-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, 1.0,
	]);

	const vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	const positionAttributeLocation = gl.getAttribLocation(
		shaderProgram,
		'a_position'
	);
	gl.enableVertexAttribArray(positionAttributeLocation);
	gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

	return shaderProgram;
};
