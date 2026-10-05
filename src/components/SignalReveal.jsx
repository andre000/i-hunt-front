/** @jsxImportSource @emotion/react */
import { useEffect, useRef } from 'react'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT = `
precision mediump float;
uniform vec2 u_res;
uniform vec2 u_origin;
uniform float u_reveal;
uniform vec3 u_waves;
uniform float u_reach;
uniform float u_time;
uniform float u_beacon;
uniform float u_fade;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float ring(float d, float front) {
  if (front <= 0.0) return 0.0;
  float k = (d - front) / 9.0;
  float life = clamp(1.0 - front / u_reach, 0.0, 1.0);
  float wake = d < front ? smoothstep(front - 140.0, front, d) * 0.16 : 0.0;
  return (exp(-k * k) + wake) * life;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  float d = distance(p, u_origin);
  float dark = smoothstep(u_reveal - 90.0, u_reveal, d);
  float glow = ring(d, u_waves.x) * 0.55 + ring(d, u_waves.y) * 0.8 + ring(d, u_waves.z);
  float beacon = exp(-d * d / 420.0) * u_beacon;
  float halo = exp(-d / 70.0) * 0.35 * u_beacon;
  float grain = (hash(floor(p / 2.0) + floor(u_time * 24.0)) - 0.5) * 0.05 * dark;
  vec3 base = vec3(0.047, 0.055, 0.067) + grain;
  vec3 orange = vec3(1.0, 0.42, 0.102);
  float light = clamp(glow + beacon + halo, 0.0, 1.0);
  float alpha = clamp(dark * 0.97 + light, 0.0, 1.0) * u_fade;
  vec3 color = (base * dark * 0.97 + orange * light) * u_fade;
  gl_FragColor = vec4(min(color, vec3(alpha)), alpha);
}
`

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
}

function createRenderer(canvas) {
  const gl = canvas.getContext?.('webgl', { premultipliedAlpha: true, antialias: false })
  if (!gl) return null
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  if (!vertex || !fragment) return null
  const program = gl.createProgram()
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const position = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(position)
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)

  const uniform = (name) => gl.getUniformLocation(program, name)
  const u = Object.fromEntries(['res', 'origin', 'reveal', 'waves', 'reach', 'time', 'beacon', 'fade'].map(name => [name, uniform(`u_${name}`)]))

  return {
    draw({ width, height, scale, origin, reveal, waves, reach, time, beacon, fade }) {
      gl.viewport(0, 0, width * scale, height * scale)
      gl.uniform2f(u.res, width * scale, height * scale)
      gl.uniform2f(u.origin, origin.x * scale, origin.y * scale)
      gl.uniform1f(u.reveal, reveal * scale)
      gl.uniform3f(u.waves, waves[0] * scale, waves[1] * scale, waves[2] * scale)
      gl.uniform1f(u.reach, reach * scale)
      gl.uniform1f(u.time, time)
      gl.uniform1f(u.beacon, beacon)
      gl.uniform1f(u.fade, fade)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },
    dispose() {
      gl.deleteProgram(program)
      gl.deleteBuffer(buffer)
    },
  }
}

const easeOut = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3)

export function SignalReveal({ origin, start, timeline, skipped, onFallback }) {
  const canvas = useRef(null)

  useEffect(() => {
    const element = canvas.current
    const renderer = element && createRenderer(element)
    if (!renderer) {
      onFallback()
      return
    }

    const { width, height } = element.getBoundingClientRect()
    const scale = Math.min(window.devicePixelRatio || 1, 2)
    element.width = width * scale
    element.height = height * scale
    const reach = Math.max(
      Math.hypot(origin.x, origin.y),
      Math.hypot(width - origin.x, origin.y),
      Math.hypot(origin.x, height - origin.y),
      Math.hypot(width - origin.x, height - origin.y),
    ) + 120

    let frame = 0
    const render = (now) => {
      const elapsed = skipped.current ? timeline.end : now - start
      const fronts = timeline.waves.map(at => Math.max(0, (elapsed - at) * timeline.speed))
      const revealFront = fronts[2]
      const fade = 1 - easeOut((elapsed - timeline.fadeOut) / 400)
      const beacon = elapsed < timeline.beacon ? 0 : 0.75 + 0.25 * Math.sin(elapsed / 90)
      renderer.draw({ width, height, scale, origin, reveal: revealFront, waves: fronts, reach, time: elapsed / 1000, beacon: beacon * fade, fade })
      if (elapsed < timeline.end) frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      renderer.dispose()
    }
  }, [origin, start, timeline, skipped, onFallback])

  return <canvas ref={canvas} css={canvasStyle} aria-hidden="true" />
}

SignalReveal.propTypes = {
  origin: PropTypes.shape({ x: PropTypes.number.isRequired, y: PropTypes.number.isRequired }).isRequired,
  start: PropTypes.number.isRequired,
  timeline: PropTypes.shape({
    beacon: PropTypes.number.isRequired,
    waves: PropTypes.arrayOf(PropTypes.number).isRequired,
    speed: PropTypes.number.isRequired,
    fadeOut: PropTypes.number.isRequired,
    end: PropTypes.number.isRequired,
  }).isRequired,
  skipped: PropTypes.shape({ current: PropTypes.bool }).isRequired,
  onFallback: PropTypes.func.isRequired,
}

const canvasStyle = css`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 4;
  pointer-events: none;
`
