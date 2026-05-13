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
  | "hoja_sds"
  | "telefono_116"
  | "triangulos_suelo"
  | "kit_epp_abierto"
  | "extintor_rojo"
  | "valvula_lateral"
  | "balde_agua"
  | "confirmacion_e3"

interface Scene2Props {
  onObjectClick: (id: string) => void
  disabledObjects?: Set<string>
  /** 0-100 — controls leak particle intensity and fog density */
  fugaPct?: number
  /** When true, the green confirmacion_e3 indicator is rendered */
  llamo116?: boolean
  /** Optional dev-only HUD */
  worldStateDebug?: Record<string, unknown>
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
  const dashes = useMemo(() => {
    const arr: number[] = []
    for (let z = -90; z <= 90; z += 6) arr.push(z)
    return arr
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#8a6a48" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 200]} />
        <meshStandardMaterial color="#2a2a2d" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.7, 0.005, 0]}>
        <planeGeometry args={[0.18, 200]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.7, 0.005, 0]}>
        <planeGeometry args={[0.18, 200]} />
        <meshStandardMaterial color="#f5f5f0" />
      </mesh>
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
  // Same chassis/tank layout as Scene1, engine off (no headlight emissive).
  return (
    <group position={[2.5, 0, 0]}>
      {/* Wheels */}
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

      {/* Cab (NOT clickable in Scene2 - engine off, driver out) */}
      <group position={[-3, 0, 0]}>
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[1.6, 1.8, 2.2]} />
          <meshStandardMaterial color="#f4f4f2" roughness={0.5} />
        </mesh>
        {/* Windshield - we'll show the phone through this */}
        <mesh position={[0.6, 1.85, 0]}>
          <boxGeometry args={[0.45, 0.9, 1.9]} />
          <meshStandardMaterial color="#1f2a36" roughness={0.2} metalness={0.3} transparent opacity={0.55} />
        </mesh>
        <mesh position={[-0.81, 1.3, 0.7]}>
          <boxGeometry args={[0.02, 1.1, 0.7]} />
          <meshStandardMaterial color="#dcdcd6" />
        </mesh>
        <mesh position={[-0.83, 1.4, 0.95]}>
          <boxGeometry args={[0.04, 0.06, 0.18]} />
          <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Headlights OFF (no emissive) */}
        <mesh position={[0.81, 1, 0.7]}>
          <boxGeometry args={[0.05, 0.25, 0.35]} />
          <meshStandardMaterial color="#cfcab0" />
        </mesh>
        <mesh position={[0.81, 1, -0.7]}>
          <boxGeometry args={[0.05, 0.25, 0.35]} />
          <meshStandardMaterial color="#cfcab0" />
        </mesh>
      </group>

      {/* Chassis */}
      <mesh position={[1, 0.85, 0]}>
        <boxGeometry args={[5.2, 0.25, 2.2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>

      {/* Tank cylinder */}
      <mesh position={[1, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.05, 1.05, 4.8, 24]} />
        <meshStandardMaterial color="#f4f4f2" roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh position={[3.4, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.05, 1.05, 0.08, 24]} />
        <meshStandardMaterial color="#dcdcd6" roughness={0.6} />
      </mesh>
      <mesh position={[-1.4, 1.85, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.05, 1.05, 0.08, 24]} />
        <meshStandardMaterial color="#dcdcd6" roughness={0.6} />
      </mesh>

      {/* Static (non-clickable) Kemler diamond, just for visual continuity */}
      <group position={[1.6, 1.85, 1.07]} rotation={[0, 0, Math.PI / 4]}>
        <mesh>
          <boxGeometry args={[0.7, 0.7, 0.04]} />
          <meshStandardMaterial color="#ff8a1a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[0.7, 0.02, 0.005]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      </group>

      {/* SDS Document on clipboard near cab (clickable) */}
      <Interactive
        id="hoja_sds"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("hoja_sds")}
        position={[-3.85, 1.3, 0.85]}
      >
        {({ hovered, disabled }) => (
          <group>
            <mesh>
              <boxGeometry args={[0.05, 0.55, 0.4]} />
              <meshStandardMaterial
                color={disabled ? "#888" : "#c98a4b"}
                emissive={hovered ? "#ff7a1a" : "#000000"}
                emissiveIntensity={hovered ? 0.5 : 0}
                roughness={0.7}
              />
            </mesh>
            <mesh position={[-0.03, 0, 0]}>
              <boxGeometry args={[0.005, 0.5, 0.36]} />
              <meshStandardMaterial color={disabled ? "#aaa" : "#fafafa"} />
            </mesh>
            {/* Visible "SDS" header */}
            <Html
              position={[-0.04, 0.18, 0]}
              rotation={[0, -Math.PI / 2, 0]}
              center
              transform
              distanceFactor={2.5}
              occlude={false}
              style={{ pointerEvents: "none" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "#a02020",
                  background: "#fff",
                  padding: "1px 4px",
                }}
              >
                SDS
              </div>
            </Html>
            <mesh position={[-0.04, 0.22, 0]}>
              <boxGeometry args={[0.04, 0.08, 0.2]} />
              <meshStandardMaterial color="#333333" metalness={0.5} />
            </mesh>
          </group>
        )}
      </Interactive>

      {/* Phone showing "116" on dashboard, visible through windshield */}
      <Interactive
        id="telefono_116"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("telefono_116")}
        position={[-2.55, 1.55, 0]}
      >
        {({ hovered, disabled }) => <PhoneOnDash hovered={hovered} disabled={disabled} />}
      </Interactive>

      {/* Leaking valve (clickable - touching without EPP = error) */}
      <Interactive
        id="valvula_lateral"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("valvula_lateral")}
        position={[0.4, 1.4, 1.1]}
      >
        {({ hovered, disabled }) => <ValveMesh hovered={hovered} disabled={disabled} />}
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
    const pulse = 0.7 + Math.sin(t * 3.5) * 0.4
    const mat = glowRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = hovered ? 1.4 : pulse
  })

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.35, 12]} />
        <meshStandardMaterial color={disabled ? "#777" : "#3a3a3a"} metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0, 0.25]}>
        <boxGeometry args={[0.28, 0.28, 0.18]} />
        <meshStandardMaterial
          color={disabled ? "#888" : "#c0392b"}
          emissive={disabled ? "#000000" : hovered ? "#ff7a1a" : "#ffaa1a"}
          emissiveIntensity={0.9}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0.4]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.14, 0.025, 8, 16]} />
        <meshStandardMaterial color={disabled ? "#666" : "#1a1a1a"} metalness={0.7} roughness={0.4} />
      </mesh>
      {!disabled && <pointLight position={[0, 0, 0.4]} color="#ffb347" intensity={1.4} distance={3.5} decay={2} />}
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                              PHONE ON DASH                                 */
/* -------------------------------------------------------------------------- */

function PhoneOnDash({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  return (
    <group>
      {/* Phone body lying flat on dashboard */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.32, 0.16, 0.025]} />
        <meshStandardMaterial
          color={disabled ? "#666" : "#1a1a1a"}
          emissive={hovered ? "#ff7a1a" : "#000000"}
          emissiveIntensity={hovered ? 0.6 : 0}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Glowing screen showing 116 */}
      <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.28, 0.14]} />
        <meshStandardMaterial
          color={disabled ? "#444" : "#0a1f33"}
          emissive={disabled ? "#000" : "#3a8eff"}
          emissiveIntensity={0.8}
        />
      </mesh>
      <Html
        position={[0, 0.016, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        center
        transform
        distanceFactor={1.2}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 900,
            fontSize: 32,
            color: "#ffffff",
            letterSpacing: "0.05em",
          }}
        >
          116
        </div>
      </Html>
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
  /** 0-1 */
  intensity: number
}

/**
 * Larger particle system than Scene1 (acid leak has escalated).
 * Plume drifts upward and toward camera, with longer lifetimes and wider spread.
 */
function GasLeak({ origin, intensity }: GasLeakProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const MAX_PARTICLES = 360 // Larger than Scene1's 200

  const sprite = useMemo(buildSpriteTexture, [])

  const data = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3)
    const velocities = new Float32Array(MAX_PARTICLES * 3)
    const lives = new Float32Array(MAX_PARTICLES)
    const maxLives = new Float32Array(MAX_PARTICLES)
    for (let i = 0; i < MAX_PARTICLES; i++) {
      lives[i] = -1
      maxLives[i] = 2.0 + Math.random() * 2.0
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
    const activeCount = Math.floor(MAX_PARTICLES * intensityClamped)

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3
      if (i >= activeCount) {
        if (data.lives[i] >= 0) {
          data.lives[i] = -1
          data.positions[i3 + 1] = -9999
        }
        continue
      }

      if (data.lives[i] < 0) {
        data.positions[i3] = origin[0] + (Math.random() - 0.5) * 0.08
        data.positions[i3 + 1] = origin[1] + (Math.random() - 0.5) * 0.08
        data.positions[i3 + 2] = origin[2] + (Math.random() - 0.5) * 0.08

        data.velocities[i3] = (Math.random() - 0.5) * 0.6
        data.velocities[i3 + 1] = 0.4 + Math.random() * 0.7
        data.velocities[i3 + 2] = 0.7 + Math.random() * 0.8

        data.lives[i] = 0
        data.maxLives[i] = 1.8 + Math.random() * 2.0
      } else {
        data.lives[i] += dt
        if (data.lives[i] >= data.maxLives[i]) {
          data.lives[i] = -1
          continue
        }
        data.positions[i3] += data.velocities[i3] * dt
        data.positions[i3 + 1] += data.velocities[i3 + 1] * dt
        data.positions[i3 + 2] += data.velocities[i3 + 2] * dt

        data.velocities[i3 + 1] += 0.5 * dt
        data.velocities[i3] *= 0.985
        data.velocities[i3 + 2] *= 0.99
      }
    }

    const attr = geometry.getAttribute("position") as THREE.BufferAttribute
    attr.needsUpdate = true

    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = 0.75 * intensityClamped + 0.05
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        map={sprite}
        size={0.7}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color={new THREE.Color("#e8d76b")}
        opacity={0.8}
      />
    </points>
  )
}

/* -------------------------------------------------------------------------- */
/*                          CLICKABLE OBJECT MESHES                           */
/* -------------------------------------------------------------------------- */

/** Two red safety triangles already deployed on the road (30m behind truck) */
function DeployedTriangles({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  const baseColor = disabled ? "#888" : "#d12b1f"
  const emissive = hovered ? "#ff7a1a" : "#000000"
  const emissiveIntensity = hovered ? 0.7 : 0

  // A standing triangular reflector with a base
  const Triangle = ({ x }: { x: number }) => (
    <group position={[x, 0, 0]}>
      {/* Base feet */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.18]} />
        <meshStandardMaterial color={disabled ? "#666" : "#1a1a1a"} />
      </mesh>
      {/* Standing triangular plate (cone with 3 sides, flat) */}
      <mesh position={[0, 0.42, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.3, 0.7, 3, 1]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.4}
          metalness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner white triangle */}
      <mesh position={[0, 0.42, 0.01]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.16, 0.36, 3, 1]} />
        <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
    </group>
  )

  return (
    <group>
      <Triangle x={-0.6} />
      <Triangle x={0.6} />
    </group>
  )
}

/** Open EPP kit on the ground showing gloves + mask */
function OpenEppKit({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  const boxColor = disabled ? "#888" : "#2e8540"
  const emissive = hovered ? "#ff7a1a" : "#000000"
  const emissiveIntensity = hovered ? 0.55 : 0

  return (
    <group>
      {/* Box bottom (open) */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.95, 0.24, 0.65]} />
        <meshStandardMaterial
          color={boxColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          roughness={0.55}
        />
      </mesh>
      {/* Inner light */}
      <mesh position={[0, 0.245, 0]}>
        <boxGeometry args={[0.88, 0.005, 0.6]} />
        <meshStandardMaterial color="#1f5a30" />
      </mesh>
      {/* Lid open, tilted back */}
      <mesh position={[0, 0.36, -0.34]} rotation={[-Math.PI / 2.2, 0, 0]}>
        <boxGeometry args={[0.95, 0.05, 0.65]} />
        <meshStandardMaterial color={boxColor} roughness={0.55} />
      </mesh>
      {/* White cross on lid */}
      <mesh position={[0, 0.61, -0.49]} rotation={[-Math.PI / 2.2, 0, 0]}>
        <boxGeometry args={[0.3, 0.005, 0.08]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.61, -0.49]} rotation={[-Math.PI / 2.2, 0, 0]}>
        <boxGeometry args={[0.08, 0.005, 0.3]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Yellow rubber gloves inside */}
      <mesh position={[-0.22, 0.27, 0.05]} rotation={[0, 0.4, 0]}>
        <boxGeometry args={[0.25, 0.06, 0.18]} />
        <meshStandardMaterial color={disabled ? "#aaa" : "#f1c232"} roughness={0.6} />
      </mesh>
      <mesh position={[-0.22, 0.31, 0.18]} rotation={[0, 0.4, 0.2]}>
        <boxGeometry args={[0.07, 0.04, 0.05]} />
        <meshStandardMaterial color={disabled ? "#aaa" : "#f1c232"} roughness={0.6} />
      </mesh>
      <mesh position={[-0.15, 0.31, 0.21]} rotation={[0, 0.4, -0.1]}>
        <boxGeometry args={[0.07, 0.04, 0.05]} />
        <meshStandardMaterial color={disabled ? "#aaa" : "#f1c232"} roughness={0.6} />
      </mesh>

      {/* Respirator mask on the right */}
      <mesh position={[0.22, 0.28, 0]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshStandardMaterial color={disabled ? "#999" : "#dddddd"} roughness={0.4} />
      </mesh>
      {/* Mask filter cartridge */}
      <mesh position={[0.32, 0.28, 0.05]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 12]} />
        <meshStandardMaterial color={disabled ? "#777" : "#2a2a2a"} roughness={0.6} />
      </mesh>
      {/* Mask straps (two thin black bands) */}
      <mesh position={[0.22, 0.28, -0.13]}>
        <boxGeometry args={[0.05, 0.02, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  )
}

/** Red CO2 fire extinguisher */
function CO2Extintor({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 1.0, 16]} />
        <meshStandardMaterial
          color={disabled ? "#888" : "#c0392b"}
          emissive={hovered ? "#ff7a1a" : "#000000"}
          emissiveIntensity={hovered ? 0.55 : 0}
          roughness={0.5}
        />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.08, 0.18, 0.12, 16]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[0.18, 0.07, 0.18]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Distinctive CO2 horn (large black cone instead of hose) */}
      <mesh position={[0.22, 1.05, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <coneGeometry args={[0.12, 0.3, 16, 1, true]} />
        <meshStandardMaterial color="#111111" side={THREE.DoubleSide} roughness={0.5} />
      </mesh>
      <mesh position={[0.07, 1.12, 0]} rotation={[0, 0, -Math.PI / 3]}>
        <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      {/* CO2 label */}
      <mesh position={[0, 0.55, 0.21]}>
        <boxGeometry args={[0.22, 0.3, 0.005]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Html
        position={[0, 0.55, 0.214]}
        center
        transform
        distanceFactor={2}
        occlude={false}
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono, monospace)",
            fontWeight: 900,
            fontSize: 18,
            color: "#000000",
          }}
        >
          CO₂
        </div>
      </Html>
    </group>
  )
}

/** Water bucket (using on acid = hazard error) */
function WaterBucket({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  return (
    <group>
      {/* Bucket body */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.28, 0.22, 0.44, 18]} />
        <meshStandardMaterial
          color={disabled ? "#888" : "#3a78a8"}
          emissive={hovered ? "#ff7a1a" : "#000000"}
          emissiveIntensity={hovered ? 0.55 : 0}
          roughness={0.6}
        />
      </mesh>
      {/* Water surface */}
      <mesh position={[0, 0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 24]} />
        <meshStandardMaterial
          color={disabled ? "#777" : "#5fb4d4"}
          emissive={disabled ? "#000" : "#244c66"}
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
      {/* Handle */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.27, 0.012, 8, 24, Math.PI]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.6} />
      </mesh>
    </group>
  )
}

/** Green confirmation arrow (only visible when llamo116 = true) */
function ConfirmArrow({ hovered, disabled }: { hovered: boolean; disabled: boolean }) {
  const arrowRef = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    if (!arrowRef.current || disabled) return
    const t = clock.getElapsedTime()
    arrowRef.current.position.y = 0.6 + Math.sin(t * 2.5) * 0.12
  })

  const color = disabled ? "#666" : "#39d98a"
  const emissive = disabled ? "#000" : hovered ? "#ff7a1a" : "#39d98a"

  return (
    <group ref={arrowRef}>
      {/* Arrow shaft */}
      <mesh rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.6, 12]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={hovered ? 1.4 : 0.9} />
      </mesh>
      {/* Arrow head pointing along +X (toward Escena 3) */}
      <mesh position={[0.4, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.32, 16]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={hovered ? 1.4 : 0.9} />
      </mesh>
      {/* Glow disc on ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.1, -0.55, 0]}>
        <ringGeometry args={[0.3, 0.55, 32]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.7} side={THREE.DoubleSide} />
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
  llamo116: boolean
}

function SceneContents({ onObjectClick, disabledObjects, fugaPct, llamo116 }: SceneContentsProps) {
  const valveWorld = useMemo<[number, number, number]>(() => [2.9, 1.4, 1.1], [])
  const intensity01 = Math.max(0, Math.min(100, fugaPct)) / 100

  // Fog density grows with leak: near plane shrinks (fog gets thicker)
  const fogNear = 35 - intensity01 * 18 // 35 -> 17
  const fogFar = 110 - intensity01 * 35 // 110 -> 75

  return (
    <>
      <Sky distance={450000} sunPosition={[50, 5, 50]} inclination={0.49} azimuth={0.25} turbidity={9} rayleigh={3.2} />

      {/* Lighting tuned for dusk - slightly dimmer than Scene1 (situation feels heavier) */}
      <ambientLight intensity={0.5} color="#ffd1a3" />
      <directionalLight position={[40, 12, 40]} intensity={1.5} color="#ffa566" />
      <hemisphereLight args={["#ffb27a", "#2a3a2a", 0.45]} />
      <fog attach="fog" args={["#e8a374", fogNear, fogFar]} />

      <Mountains />
      <Road />

      <Truck onObjectClick={onObjectClick} disabledObjects={disabledObjects} />

      {/* Larger acid mist plume */}
      <GasLeak origin={valveWorld} intensity={intensity01} />

      {/* Two safety triangles already deployed on the road, ~30m (units) BEHIND the truck.
          Truck is at +X with cab facing +X, so "behind" is in +X direction beyond cab.
          We place triangles on the road surface centered on x-axis, far from truck. */}
      <Interactive
        id="triangulos_suelo"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("triangulos_suelo")}
        position={[0, 0, 12]}
        rotation={[0, Math.PI, 0]}
      >
        {(s) => <DeployedTriangles {...s} />}
      </Interactive>

      {/* Open EPP kit on ground near truck */}
      <Interactive
        id="kit_epp_abierto"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("kit_epp_abierto")}
        position={[-1.2, 0, 2.4]}
        rotation={[0, 0.5, 0]}
      >
        {(s) => <OpenEppKit {...s} />}
      </Interactive>

      {/* CO2 extinguisher near truck */}
      <Interactive
        id="extintor_rojo"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("extintor_rojo")}
        position={[0.4, 0, 2.6]}
      >
        {(s) => <CO2Extintor {...s} />}
      </Interactive>

      {/* Water bucket - hazard distractor */}
      <Interactive
        id="balde_agua"
        onObjectClick={onObjectClick}
        disabled={disabledObjects.has("balde_agua")}
        position={[1.6, 0, 2.6]}
      >
        {(s) => <WaterBucket {...s} />}
      </Interactive>

      {/* Confirmation arrow - only visible after calling 116 */}
      {llamo116 && (
        <Interactive
          id="confirmacion_e3"
          onObjectClick={onObjectClick}
          disabled={disabledObjects.has("confirmacion_e3")}
          position={[-3.5, 0, 4.5]}
        >
          {(s) => <ConfirmArrow {...s} />}
        </Interactive>
      )}

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

export default function Scene2({
  onObjectClick,
  disabledObjects,
  fugaPct = 75,
  llamo116 = false,
  worldStateDebug,
}: Scene2Props) {
  const disabled = disabledObjects ?? new Set<string>()

  const handleCreated = useCallback((state: { gl: THREE.WebGLRenderer }) => {
    const canvas = state.gl.domElement
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault()
        console.log("[v0] WebGL context lost (Scene2)")
      },
      false,
    )
    canvas.addEventListener(
      "webglcontextrestored",
      () => {
        console.log("[v0] WebGL context restored (Scene2)")
      },
      false,
    )
  }, [])

  return (
    <div className="w-full h-screen relative">
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
        <SceneContents
          onObjectClick={onObjectClick}
          disabledObjects={disabled}
          fugaPct={fugaPct}
          llamo116={llamo116}
        />
      </Canvas>

      {/* Optional dev HUD */}
      {worldStateDebug && (
        <div className="pointer-events-none absolute top-3 right-3 max-w-xs rounded-md border border-border bg-background/85 px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground shadow-md">
          <div className="mb-1 font-semibold text-muted-foreground">worldStateDebug</div>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(worldStateDebug, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
