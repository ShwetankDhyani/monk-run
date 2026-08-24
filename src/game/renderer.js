import { VERT, FRAG } from './shaders.js'

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh)
    gl.deleteShader(sh)
    throw new Error(log || 'shader compile failed')
  }
  return sh
}

function link(gl, vs, fs) {
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog)
    gl.deleteProgram(prog)
    throw new Error(log || 'program link failed')
  }
  return prog
}

export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
  })
  if (!gl) throw new Error('WebGL2 not available')

  const vs = compile(gl, gl.VERTEX_SHADER, VERT)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG)
  const prog = link(gl, vs, fs)

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 1, -1, -1, 1,
    -1, 1, 1, -1, 1, 1,
  ]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const uniforms = {
    res: gl.getUniformLocation(prog, 'u_res'),
    time: gl.getUniformLocation(prog, 'u_time'),
    look: gl.getUniformLocation(prog, 'u_look'),
    chant: gl.getUniformLocation(prog, 'u_chant'),
    depth: gl.getUniformLocation(prog, 'u_depth'),
    bloom: gl.getUniformLocation(prog, 'u_bloom'),
    warp: gl.getUniformLocation(prog, 'u_warp'),
    tint: gl.getUniformLocation(prog, 'u_tint'),
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.floor(window.innerWidth * dpr)
    const h = Math.floor(window.innerHeight * dpr)
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, canvas.width, canvas.height)
  }

  function draw(state) {
    resize()
    gl.useProgram(prog)
    gl.bindVertexArray(vao)
    gl.uniform2f(uniforms.res, canvas.width, canvas.height)
    gl.uniform1f(uniforms.time, state.time)
    gl.uniform2f(uniforms.look, state.lookX, state.lookY)
    gl.uniform1f(uniforms.chant, state.chant)
    gl.uniform1f(uniforms.depth, state.depth)
    gl.uniform1f(uniforms.bloom, state.bloom)
    gl.uniform1f(uniforms.warp, state.warp)
    gl.uniform3f(uniforms.tint, state.tint[0], state.tint[1], state.tint[2])
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  return { gl, draw, resize }
}
