"use client"

import type React from "react"
import { useRef, useMemo, useState, useCallback } from "react"
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber"
import { OrbitControls, Sky, Html } from "@react-three/drei"
import * as THREE from "three"

/* -------------------------------------------------------------------------- */
/*                                  TYPES                                     */
/* -------------------------------------------------------------------------- */

type ObjectId =
  | "zona_valvula"
  | "panel_kemler"
  | "kit_epp"
  | "cabina_motor"
  | "extintor"
  | "hoja_sds"
  | "zona_confirmacion"
  | "triangulos"

interface Scene1Props {
  onObjectClick: (id: string) => void
  disabledObjects?: Set<string>
  /** 0-100, controls leak particle intensity */
  fugaPct?: number
}

interface InteractiveProps {
  id: ObjectId
  onObjectClick: (id: string) => void
  disabled?: boolean
  children: (state: { hovered: boolean; disabled: boolean }) => React.ReactNode
  position?: [number, number, number]
  rotation?: [number, number, number]
}

/* -------------------------------------------------------------------------- */
/*                          INTERACTIVE WRAPPER                               */
/* -------------------------------------------------------------------------- */

/**
 * Wraps a 3D group so it reports hover state and click events back via
 * onObjectClick. When disabled, hover effects and clicks are suppressed
 * and the cursor stays as default.
 */
function Interactive({ id, onObjectClick, disabled = false, children, position, rotation }: InteractiveProps) {
  const [hovered, setHovered] = useState(false)

  const handlePointerOver = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      if (disabled) return
      setHovered(true)
      document.body.style.cursor = "pointer"
    },
    [disabled],
  )

  const handlePointerOut = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation()
      if (disabled) return
      setHovered(false)
      document.body.style.cursor = "auto"
    },
    [disabled],
  )

  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation()
      if (disabled) return
      onObjectClick(id)
    },
    [id, onObjectClick, disabled],
  )

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {children({ hovered: hovered && !disabled, disabled })}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                              ENVIRONMENT                                   */
/* -------------------------------------------------------------------------- */

function Mountains() {
  // Andean peaks using ConeGeometry, dark green per spec.
  const peaks = useMemo(
    () => [
      { pos: [-26, 4, -32] as [number, number, number], scale: [12, 14, 12] as [number, number, number] },
      { pos: [-10, 5, -40] as [number, number, number], scale: [14, 18, 14] as [number, number, number] },
      { pos: [8, 6, -38] as [number, number, number], scale: [16, 20, 16] as [number, number, number] },
      { pos: [26, 4, -34] as [number, number, number], scale: [13, 15, 13] as [number, number, number] },
      { pos: [40, 3, -30] as [number, number, number], scale: [11, 12, 11] as [number, number, number] },
      { pos: [-38, 3, -27] as [number, number, number], scale: [10, 11, 10] as [number, number, number] },
    ],
    [],
  )

  return (
    <group>
      {peaks.map((peak, i) => (
        <mesh key={i} position={peak.pos} scale={peak.scale}>
          <coneGeometry args={[1, 1, 6]} />
          <meshStandardMaterial color={i % 2 === 0 ? "#2d4a32" : "#1f3724"} flatShading roughness={1} />
        </mesh>
      ))}
      {/* Subtle snow caps on tallest peaks */}
      {peaks
        .filter((p) => p.scale[1] > 14)
        .map((peak, i) => (
          <mesh
            key={`cap-${i}`}
            position={[peak.pos[0], peak.pos[1] + peak.scale[1] * 0.35, peak.pos[2]]}
            scale={[peak.scale[0] * 0.42, peak.scale[1] * 0.22, peak.scale[2] * 0.42]}
          >
            <coneGeometry args={[1, 1, 6]} />
            <meshStandardMaterial color="#e8d9c2" flatShading roughness={1} />
          </mesh>
        ))}
    </group>
  )
}

function Road() {
  // Generate dashed center line markers
  const dashes = useMemo(() => {
    const arr: number[] = []
    for (let z = -90; z <= 90; z += 6) arr.push(z)
    return arr
  }, [])

  return (
    <group>
      {/* Ground (desert/shoulder) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#8a6a48" roughness={1} />
      </mesh>

      {/* Asphalt road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 200]} />
        <meshStandardMaterial color="#2a2a2d" roughness={0.95} />
      </mesh>

      {/* Solid white edge lines */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.7, 0.005, 0]}>
        <planeGeometry args={[0.18, 200]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.7, 0.005, 0]}>
        <planeGeometry args={[0.18, 200]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>

      {/* Dashed center line */}
      {dashes.map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, z]}>
          <planeGeometry args={[0.18, 2.5]} />
          <meshStandardMaterial color="#f5f5f0" />
        </mesh>
      ))}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  TRUCK                                     */
/* -------------------------------------------------------------------------- */

interface TruckProps {
  onObjectClick: (id: string) => void
  disabledObjects: Set<string>
}

function Truck({ onObjectClick, disabledObjects }: TruckProps) {
  // The truck sits on the right shoulder, tank facing camera (left side leak).
  return (
    <group position={[2.5, 0, 0]}>
      {/* ---------- WHEELS ---------- */}
      {[
        [-2.8, 0.55, 1.1],
        [-2.8, 0.55, -1.1],
        [0.6, 0.55, 1.1],
        [0.6, 0.55, -1.1],
        [2.4, 0.55, 1.1],
        [2.4, 0.55, -1.1],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.55, 0.55, 0.4, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}

      {/* ---------- CAB (clickable) ---------- */}
      <Interactive
        id="cabina_motor"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("cabina_motor")}
      >
        {({ hovered, disabled }) => (
          <group position={[-3, 0, 0]}>
            {/* Cab body */}
            <mesh position={[0, 1.45, 0]}>
              <boxGeometry args={[1.6, 1.8, 2.2]} />
              <meshStandardMaterial
                color={disabled ? "#888888" : "#f4f4f2"}
                emissive={hovered ? "#ff7a1a" : "#000000"}
                emissiveIntensity={hovered ? 0.45 : 0}
                roughness={0.5}
              />
            </mesh>
            {/* Windshield */}
            <mesh position={[0.6, 1.85, 0]}>
              <boxGeometry args={[0.45, 0.9, 1.9]} />
              <meshStandardMaterial color="#1f2a36" roughness={0.2} metalness={0.3} />
            </mesh>
            {/* Door panel detail (the click target visual) */}
            <mesh position={[-0.81, 1.3, 0.7]}>
              <boxGeometry args={[0.02, 1.1, 0.7]} />
              <meshStandardMaterial color={disabled ? "#666" : "#dcdcd6"} />
            </mesh>
            {/* Door handle */}
            <mesh position={[-0.83, 1.4, 0.95]}>
              <boxGeometry args={[0.04, 0.06, 0.18]} />
              <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Headlights */}
            <mesh position={[0.81, 1, 0.7]}>
              <boxGeometry args={[0.05, 0.25, 0.35]} />
              <meshStandardMaterial color="#fff8d8" emissive="#ffd27a" emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0.81, 1, -0.7]}>
              <boxGeometry args={[0.05, 0.25, 0.35]} />
              <meshStandardMaterial color="#fff8d8" emissive="#ffd27a" emissiveIntensity={0.8} />
            </mesh>
          </group>
        )}
      </Interactive>

      {/* ---------- CHASSIS ---------- */}
      <mesh position={[1, 0.85, 0]}>
        <boxGeometry args={[5.2, 0.25, 2.2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>

      {/* ---------- TANK CYLINDER ---------- */}
      <mesh position={[1, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.05, 1.05, 4.8, 24]} />
        <meshStandardMaterial color="#f4f4f2" roughness={0.45} metalness={0.15} />
      </mesh>
      {/* Tank end caps */}
      <mesh position={[3.4, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.05, 1.05, 0.08, 24]} />
        <meshStandardMaterial color="#dcdcd6" roughness={0.6} />
      </mesh>
      <mesh position={[-1.4, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.05, 1.05, 0.08, 24]} />
        <meshStandardMaterial color="#dcdcd6" roughness={0.6} />
      </mesh>

      {/* ---------- KEMLER PANEL (clickable, on tank side facing camera) ---------- */}
      <Interactive
        id="panel_kemler"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("panel_kemler")}
        position={[1.6, 1.85, 1.07]}
      >
        {({ hovered, disabled }) => (
          <group rotation={[0, 0, Math.PI / 4]}>
            {/* Diamond plate */}
            <mesh>
              <boxGeometry args={[0.7, 0.7, 0.04]} />
              <meshStandardMaterial
                color={disabled ? "#888" : "#ff8a1a"}
                emissive={hovered ? "#ff7a1a" : "#000000"}
                emissiveIntensity={hovered ? 0.6 : 0}
                roughness={0.5}
              />
            </mesh>
            {/* Black divider */}
            <mesh position={[0, 0, 0.025]}>
              <boxGeometry args={[0.7, 0.02, 0.005]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            {/* Numbers via Html overlay (rotation-counter so text stays readable) */}
            <group rotation={[0, 0, -Math.PI / 4]}>
              <Html
                position={[0, 0.13, 0.04]}
                center
                transform
                distanceFactor={2}
                occlude={false}
                style={{ pointerEvents: "none" }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 800,
                    fontSize: 28,
                    color: "#000",
                    lineHeight: 1,
                  }}
                >
                  80
                </div>
              </Html>
              <Html
                position={[0, -0.13, 0.04]}
                center
                transform
                distanceFactor={2}
                occlude={false}
                style={{ pointerEvents: "none" }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono, monospace)",
                    fontWeight: 800,
                    fontSize: 24,
                    color: "#000",
                    lineHeight: 1,
                  }}
                >
                  1830
                </div>
              </Html>
            </group>
          </group>
        )}
      </Interactive>

      {/* ---------- LEAKING VALVE (clickable) ---------- */}
      {/* Left side of tank => negative Z relative to truck (camera-facing left) */}
      <Interactive
        id="zona_valvula"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("zona_valvula")}
        position={[0.4, 1.4, 1.1]}
      >
        {({ hovered, disabled }) => <ValveMesh hovered={hovered} disabled={disabled} />}
      </Interactive>

      {/* ---------- SDS DOCUMENT HOLDER on cab side (clickable) ---------- */}
      <Interactive
        id="hoja_sds"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("hoja_sds")}
        position={[-3.85, 1.3, 0.85]}
      >
        {({ hovered, disabled }) => (
          <group>
            {/* Clipboard backing */}
            <mesh>
              <boxGeometry args={[0.05, 0.55, 0.4]} />
              <meshStandardMaterial
                color={disabled ? "#888" : "#c98a4b"}
                emissive={hovered ? "#ff7a1a" : "#000000"}
                emissiveIntensity={hovered ? 0.5 : 0}
                roughness={0.7}
              />
            </mesh>
            {/* Paper */}
            <mesh position={[-0.03, 0, 0]}>
              <boxGeometry args={[0.005, 0.5, 0.36]} />
              <meshStandardMaterial color={disabled ? "#aaa" : "#fafafa"} />
            </mesh>
            {/* Clip */}
            <mesh position={[-0.04, 0.22, 0]}>
              <boxGeometry args={[0.04, 0.08, 0.2]} />
              <meshStandardMaterial color="#333333" metalness={0.5} />
            </mesh>
          </group>
        )}
      </Interactive>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  VALVE                                     */
/* -------------------------------------------------------------------------- */

function ValveMesh({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!glowRef.current || disabled) return
    const t = clock.getElapsedTime()
    const pulse = 0.6 + Math.sin(t * 3) * 0.3
    const mat = glowRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = hovered ? 1.2 : pulse
  })

  return (
    <group>
      {/* Pipe stub */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.35, 12]} />
        <meshStandardMaterial color={disabled ? "#777" : "#3a3a3a"} metalness={0.6} roughness={0.5} />
      </mesh>
      {/* Valve body with pulsing glow */}
      <mesh ref={glowRef} position={[0, 0, 0.25]}>
        <boxGeometry args={[0.28, 0.28, 0.18]} />
        <meshStandardMaterial
          color={disabled ? "#888" : "#c0392b"}
          emissive={disabled ? "#000000" : hovered ? "#ff7a1a" : "#ffaa1a"}
          emissiveIntensity={0.8}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Valve handle */}
      <mesh position={[0, 0, 0.4]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.14, 0.025, 8, 16]} />
        <meshStandardMaterial color={disabled ? "#666" : "#1a1a1a"} metalness={0.7} roughness={0.4} />
      </mesh>
      {/* Soft warning point light (only when active) */}
      {!disabled && <pointLight position={[0, 0, 0.4]} color="#ffb347" intensity={1.2} distance={3} decay={2} />}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                          ACID MIST PARTICLE SYSTEM                         */
/* -------------------------------------------------------------------------- */

function buildSpriteTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, "rgba(255, 240, 140, 1)")
  grad.addColorStop(0.4, "rgba(220, 200, 80, 0.55)")
  grad.addColorStop(1, "rgba(160, 140, 40, 0)")
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

interface GasLeakProps {
  origin: [number, number, number]
  /** 0-1, scales emission rate */
  intensity: number
}

function GasLeak({ origin, intensity }: GasLeakProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const MAX_PARTICLES = 200

  const sprite = useMemo(buildSpriteTexture, [])

  // Per-particle data buffers
  const data = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const velocities = new Float32Array(MAX_PARTICLES * 3)
    const lives = new Float32Array(MAX_PARTICLES) // current life
    const maxLives = new Float32Array(MAX_PARTICLES) // total lifetime
    for (let i = 0; i < MAX_PARTICLES; i++) {
      lives[i] = -1 // start dead, will spawn over time
      maxLives[i] = 1.6 + Math.random() * 1.4
    }
    return { positions, velocities, lives, maxLives }
  }, [])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3))
    return g
  }, [data])

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const dt = Math.min(delta, 0.05)
    const intensityClamped = Math.max(0, Math.min(1, intensity))
    // How many particles should be active right now
    const activeCount = Math.floor(MAX_PARTICLES * intensityClamped)

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3
      // Slot is "above quota" → kill it.
      if (i >= activeCount) {
        if (data.lives[i] >= 0) {
          data.lives[i] = -1
          data.positions[i3 + 1] = -9999 // hide
        }
        continue
      }

      if (data.lives[i] < 0) {
        // Spawn at origin with outward + upward velocity
        data.positions[i3] = origin[0] + (Math.random() - 0.5) * 0.05
        data.positions[i3 + 1] = origin[1] + (Math.random() - 0.5) * 0.05
        data.positions[i3 + 2] = origin[2] + (Math.random() - 0.5) * 0.05

        data.velocities[i3] = (Math.random() - 0.5) * 0.4
        data.velocities[i3 + 1] = 0.3 + Math.random() * 0.5
        data.velocities[i3 + 2] = 0.6 + Math.random() * 0.6 // drift toward camera

        data.lives[i] = 0
        data.maxLives[i] = 1.4 + Math.random() * 1.6
      } else {
        data.lives[i] += dt
        if (data.lives[i] >= data.maxLives[i]) {
          data.lives[i] = -1
          continue
        }
        // Integrate position
        data.positions[i3] += data.velocities[i3] * dt
        data.positions[i3 + 1] += data.velocities[i3 + 1] * dt
        data.positions[i3 + 2] += data.velocities[i3 + 2] * dt

        // Buoyancy + drag
        data.velocities[i3 + 1] += 0.4 * dt
        data.velocities[i3] *= 0.98
        data.velocities[i3 + 2] *= 0.99
      }
    }

    const attr = geometry.getAttribute("position") as THREE.BufferAttribute
    attr.needsUpdate = true

    // Fade material when intensity is low
    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = 0.65 * intensityClamped + 0.05
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={sprite}
        size={0.55}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color={new THREE.Color("#e8d76b")}
        opacity={0.7}
      />
    </points>
  )
}

/* -------------------------------------------------------------------------- */
/*                          OTHER CLICKABLE OBJECTS                           */
/* -------------------------------------------------------------------------- */

function EppKit({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  return (
    <group>
      {/* Box body - safety green */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.9, 0.7, 0.6]} />
        <meshStandardMaterial
          color={disabled ? "#888" : "#2e8540"}
          emissive={hovered ? "#ff7a1a" : "#000000"}
          emissiveIntensity={hovered ? 0.55 : 0}
          roughness={0.55}
        />
      </mesh>
      {/* White cross */}
      <mesh position={[0, 0.35, 0.31]}>
        <boxGeometry args={[0.32, 0.08, 0.005]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.35, 0.31]}>
        <boxGeometry args={[0.08, 0.32, 0.005]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0.74, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}

function Extintor({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  return (
    <group>
      {/* Body */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 1.0, 16]} />
        <meshStandardMaterial
          color={disabled ? "#888" : "#c0392b"}
          emissive={hovered ? "#ff7a1a" : "#000000"}
          emissiveIntensity={hovered ? 0.5 : 0}
          roughness={0.5}
        />
      </mesh>
      {/* Top cap */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.08, 0.18, 0.12, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[0.18, 0.07, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Hose */}
      <mesh position={[0.18, 0.95, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      {/* Label */}
      <mesh position={[0, 0.55, 0.21]}>
        <boxGeometry args={[0.22, 0.3, 0.005]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function SafetyTriangles({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  // A small carry bag + folded triangle silhouette
  return (
    <group>
      {/* Bag */}
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.7, 0.36, 0.18]} />
        <meshStandardMaterial
          color={disabled ? "#888" : "#1a1a1a"}
          emissive={hovered ? "#ff7a1a" : "#000000"}
          emissiveIntensity={hovered ? 0.5 : 0}
          roughness={0.85}
        />
      </mesh>
      {/* Visible folded triangle peeking out */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.22, 0.4, 3]} />
        <meshStandardMaterial color={disabled ? "#aaa" : "#d12b1f"} roughness={0.5} />
      </mesh>
      {/* Inner white triangle */}
      <mesh position={[0, 0.5, 0.005]}>
        <coneGeometry args={[0.12, 0.22, 3]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function ConfirmZone({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ringRef.current || disabled) return
    const t = clock.getElapsedTime()
    const mat = ringRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = hovered ? 1.4 : 0.6 + Math.sin(t * 2.4) * 0.35
  })

  const color = disabled ? "#666" : "#39d98a"
  const emissive = disabled ? "#000" : hovered ? "#ff7a1a" : "#39d98a"

  return (
    <group>
      {/* Outer ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.95, 1.25, 48]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Inner translucent disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <circleGeometry args={[0.95, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.25}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                                SCENE BODY                                  */
/* -------------------------------------------------------------------------- */

interface SceneContentsProps {
  onObjectClick: (id: string) => void
  disabledObjects: Set<string>
  fugaPct: number
}

function SceneContents({ onObjectClick, disabledObjects, fugaPct }: SceneContentsProps) {
  // Valve world position: truck is at (2.5, 0, 0), valve at (0.4, 1.4, 1.1) inside truck group
  const valveWorld = useMemo<[number, number, number]>(() => [2.9, 1.4, 1.1], [])

  return (
    <>
      {/* Sunset sky */}
      <Sky distance={450000} sunPosition={[50, 5, 50]} inclination={0.49} azimuth={0.25} turbidity={8} rayleigh={3} />

      {/* Lighting tuned for dusk */}
      <ambientLight intensity={0.55} color="#ffd1a3" />
      <directionalLight position={[40, 12, 40]} intensity={1.6} color="#ffb072" />
      <hemisphereLight args={["#ffb27a", "#2a3a2a", 0.45]} />
      <fog attach="fog" args={["#e8a374", 35, 110]} />

      {/* Environment */}
      <Mountains />
      <Road />

      {/* Truck + cab/valve/SDS/kemler clickables */}
      <Truck onObjectClick={onObjectClick} disabledObjects={disabledObjects} />

      {/* Yellowish acid mist particle system at the valve */}
      <GasLeak origin={valveWorld} intensity={Math.max(0, Math.min(100, fugaPct)) / 100} />

      {/* EPP Kit near cab */}
      <Interactive
        id="kit_epp"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("kit_epp")}
        position={[-1.2, 0, 1.6]}
      >
        {(s) => <EppKit {...s} />}
      </Interactive>

      {/* Fire extinguisher near truck */}
      <Interactive
        id="extintor"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("extintor")}
        position={[-0.5, 0, 2.2]}
      >
        {(s) => <Extintor {...s} />}
      </Interactive>

      {/* Safety triangles in bag near truck rear */}
      <Interactive
        id="triangulos"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("triangulos")}
        position={[6.4, 0, 1.8]}
        rotation={[0, -0.4, 0]}
      >
        {(s) => <SafetyTriangles {...s} />}
      </Interactive>

      {/* Glowing confirmation zone in front of truck */}
      <Interactive
        id="zona_confirmacion"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("zona_confirmacion")}
        position={[-2.5, 0, 3.2]}
      >
        {(s) => <ConfirmZone {...s} />}
      </Interactive>

      {/* Camera + controls */}
      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={18}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        minAzimuthAngle={-Math.PI / 2.2}
        maxAzimuthAngle={Math.PI / 2.2}
        enableDamping
        dampingFactor={0.08}
      />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                  EXPORT                                    */
/* -------------------------------------------------------------------------- */

export default function Scene1({ onObjectClick, disabledObjects, fugaPct = 60 }: Scene1Props) {
  // Stable reference for the disabled set (consumers can pass undefined)
  const disabled = disabledObjects ?? new Set<string>()

  const handleCreated = useCallback((state: { gl: THREE.WebGLRenderer }) => {
    const canvas = state.gl.domElement
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault()
        console.log("[v0] WebGL context lost")
      },
      false,
    )
    canvas.addEventListener(
      "webglcontextrestored",
      () => {
        console.log("[v0] WebGL context restored")
      },
      false,
    )
  }, [])

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [9, 4.5, 9], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true,
        }}
        onCreated={handleCreated}
      >
        <SceneContents onObjectClick={onObjectClick} disabledObjects={disabled} fugaPct={fugaPct} />
      </Canvas>
    </div>
  )
}
