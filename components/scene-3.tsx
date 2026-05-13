"use client"

import { useRef, useMemo, useCallback } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Sky, Html, Text } from "@react-three/drei"
import * as THREE from "three"

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Scene3Props {
  onObjectClick: (id: string) => void
  disabledObjects?: Set<string>
  fugaPct?: number
  civilEnPeligro?: boolean
}

interface InteractiveProps {
  id: string
  disabled: boolean
  onObjectClick: (id: string) => void
  children: React.ReactNode
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive wrapper with hover highlight and disabled state
// ─────────────────────────────────────────────────────────────────────────────

function Interactive({ id, disabled, onObjectClick, children }: InteractiveProps) {
  const groupRef = useRef<THREE.Group>(null!)

  const setEmissive = (intensity: number, color: string) => {
    groupRef.current?.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.emissive = new THREE.Color(color)
        child.material.emissiveIntensity = intensity
      }
    })
  }

  const handlePointerOver = (e: THREE.Event) => {
    if (disabled) return
    e.stopPropagation()
    setEmissive(0.4, "#ff6600")
    document.body.style.cursor = "pointer"
  }

  const handlePointerOut = () => {
    if (disabled) return
    setEmissive(0, "#000000")
    document.body.style.cursor = "auto"
  }

  const handleClick = (e: THREE.Event) => {
    e.stopPropagation()
    if (!disabled) {
      onObjectClick(id)
    }
  }

  return (
    <group
      ref={groupRef}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    >
      {children}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Environment: Mountains, Road, Fog (dusk version)
// ─────────────────────────────────────────────────────────────────────────────

function Mountains() {
  const peaks = useMemo(
    () => [
      { pos: [-60, 0, -80] as [number, number, number], h: 38, r: 28 },
      { pos: [-20, 0, -90] as [number, number, number], h: 48, r: 32 },
      { pos: [30, 0, -85] as [number, number, number], h: 42, r: 30 },
      { pos: [75, 0, -75] as [number, number, number], h: 35, r: 25 },
      { pos: [-45, 0, -60] as [number, number, number], h: 28, r: 22 },
      { pos: [50, 0, -95] as [number, number, number], h: 52, r: 35 },
    ],
    []
  )

  return (
    <group>
      {peaks.map((p, i) => (
        <group key={i} position={p.pos}>
          <mesh position={[0, p.h / 2, 0]}>
            <coneGeometry args={[p.r, p.h, 6]} />
            <meshStandardMaterial color="#4a3728" flatShading />
          </mesh>
          {p.h > 35 && (
            <mesh position={[0, p.h * 0.85, 0]}>
              <coneGeometry args={[p.r * 0.35, p.h * 0.25, 6]} />
              <meshStandardMaterial color="#e8e4e0" flatShading />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function Road() {
  return (
    <group>
      {/* Asphalt */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[200, 9]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.9} />
      </mesh>
      {/* Center dashed line */}
      {Array.from({ length: 30 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-70 + i * 5, 0.02, 0]}>
          <planeGeometry args={[2.5, 0.15]} />
          <meshStandardMaterial color="#e8d84a" />
        </mesh>
      ))}
      {/* Shoulder */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 5.5]}>
        <planeGeometry args={[200, 3]} />
        <meshStandardMaterial color="#6b5d4d" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -5.5]}>
        <planeGeometry args={[200, 3]} />
        <meshStandardMaterial color="#6b5d4d" roughness={1} />
      </mesh>
    </group>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial color="#5a4a3a" roughness={1} />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tanker Truck (contained leak state)
// ─────────────────────────────────────────────────────────────────────────────

function TankerTruck() {
  return (
    <group position={[0, 0, 4]}>
      {/* Cab */}
      <mesh position={[-4, 1.2, 0]}>
        <boxGeometry args={[3, 2.4, 2.6]} />
        <meshStandardMaterial color="#1a4a7a" roughness={0.5} />
      </mesh>
      {/* Windshield */}
      <mesh position={[-5.3, 1.6, 0]} rotation={[0, 0, Math.PI * 0.08]}>
        <boxGeometry args={[0.15, 1.2, 2.2]} />
        <meshStandardMaterial color="#1a3050" transparent opacity={0.6} />
      </mesh>
      {/* Tank */}
      <mesh position={[2, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.5, 1.5, 8, 24]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Hazard band */}
      <mesh position={[2, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.52, 1.52, 1.2, 24]} />
        <meshStandardMaterial color="#ff6600" />
      </mesh>
      {/* Kemler panel */}
      <group position={[2, 1.6, 1.53]} rotation={[0, 0, Math.PI / 4]}>
        <mesh>
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial color="#ff8800" side={THREE.DoubleSide} />
        </mesh>
        <Html position={[0, 0.15, 0.01]} transform distanceFactor={8} center>
          <div style={{ color: "#000", fontWeight: "bold", fontSize: "14px", fontFamily: "monospace" }}>
            80
          </div>
        </Html>
        <Html position={[0, -0.15, 0.01]} transform distanceFactor={8} center>
          <div style={{ color: "#000", fontWeight: "bold", fontSize: "14px", fontFamily: "monospace" }}>
            1830
          </div>
        </Html>
      </group>
      {/* Wheels */}
      {[-5, -1, 3, 5].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.5, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[x, 0.5, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.4, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}
      {/* Headlights (on for dusk) */}
      <mesh position={[-5.55, 1.0, 0.7]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffaa" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-5.55, 1.0, -0.7]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#ffffcc" emissive="#ffffaa" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[-6, 1.2, 0]} color="#ffffcc" intensity={2} distance={15} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Reduced particle leak (containment phase)
// ─────────────────────────────────────────────────────────────────────────────

function AcidLeak({ origin, fugaPct }: { origin: [number, number, number]; fugaPct: number }) {
  const pointsRef = useRef<THREE.Points>(null!)
  const count = 80

  const { positions, velocities, lifetimes, maxLifetimes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const life = new Float32Array(count)
    const maxLife = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      pos[i * 3] = origin[0]
      pos[i * 3 + 1] = origin[1]
      pos[i * 3 + 2] = origin[2]
      vel[i * 3] = 0.02 + Math.random() * 0.03
      vel[i * 3 + 1] = 0.01 + Math.random() * 0.02
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.015
      const ml = 2 + Math.random() * 2
      maxLife[i] = ml
      life[i] = Math.random() * ml
    }
    return { positions: pos, velocities: vel, lifetimes: life, maxLifetimes: maxLife }
  }, [origin])

  const texture = useMemo(() => {
    const size = 64
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, "rgba(255,255,255,1)")
    grad.addColorStop(0.3, "rgba(255,255,255,0.6)")
    grad.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  const activeRatio = Math.max(0, Math.min(1, fugaPct / 100))

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const geo = pointsRef.current.geometry
    const posAttr = geo.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    const activeCount = Math.floor(count * activeRatio)

    for (let i = 0; i < count; i++) {
      if (i >= activeCount) {
        arr[i * 3] = origin[0]
        arr[i * 3 + 1] = -100
        arr[i * 3 + 2] = origin[2]
        continue
      }
      lifetimes[i] += delta
      if (lifetimes[i] > maxLifetimes[i]) {
        lifetimes[i] = 0
        arr[i * 3] = origin[0]
        arr[i * 3 + 1] = origin[1]
        arr[i * 3 + 2] = origin[2]
      } else {
        arr[i * 3] += velocities[i * 3] * delta * 30
        arr[i * 3 + 1] += velocities[i * 3 + 1] * delta * 30
        arr[i * 3 + 2] += velocities[i * 3 + 2] * delta * 30
      }
    }
    posAttr.needsUpdate = true

    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = 0.35 * activeRatio
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={1.2}
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#d4c455"
      />
    </points>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Emergency vehicles siren lights (approaching on horizon)
// ─────────────────────────────────────────────────────────────────────────────

function SirenLights() {
  const group1Ref = useRef<THREE.Group>(null!)
  const group2Ref = useRef<THREE.Group>(null!)
  const light1RedRef = useRef<THREE.Mesh>(null!)
  const light1BlueRef = useRef<THREE.Mesh>(null!)
  const light2RedRef = useRef<THREE.Mesh>(null!)
  const light2BlueRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()

    // Approach slowly
    if (group1Ref.current) {
      group1Ref.current.position.x = -80 + t * 1.5
      if (group1Ref.current.position.x > -15) group1Ref.current.position.x = -15
    }
    if (group2Ref.current) {
      group2Ref.current.position.x = -95 + t * 1.2
      if (group2Ref.current.position.x > -25) group2Ref.current.position.x = -25
    }

    // Flash pattern
    const flash1 = Math.sin(t * 12) > 0
    const flash2 = Math.sin(t * 12 + Math.PI) > 0

    if (light1RedRef.current && light1BlueRef.current) {
      const redMat = light1RedRef.current.material as THREE.MeshStandardMaterial
      const blueMat = light1BlueRef.current.material as THREE.MeshStandardMaterial
      redMat.emissiveIntensity = flash1 ? 2 : 0.2
      blueMat.emissiveIntensity = flash2 ? 2 : 0.2
    }
    if (light2RedRef.current && light2BlueRef.current) {
      const redMat = light2RedRef.current.material as THREE.MeshStandardMaterial
      const blueMat = light2BlueRef.current.material as THREE.MeshStandardMaterial
      redMat.emissiveIntensity = flash2 ? 2 : 0.2
      blueMat.emissiveIntensity = flash1 ? 2 : 0.2
    }
  })

  return (
    <group>
      {/* First emergency vehicle */}
      <group ref={group1Ref} position={[-80, 0.8, -2]}>
        <mesh>
          <boxGeometry args={[3, 1.2, 1.8]} />
          <meshStandardMaterial color="#cc2222" />
        </mesh>
        <mesh ref={light1RedRef} position={[0, 0.8, -0.5]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
        </mesh>
        <mesh ref={light1BlueRef} position={[0, 0.8, 0.5]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#0044ff" emissive="#0044ff" emissiveIntensity={0.2} />
        </mesh>
        <pointLight position={[0, 1, 0]} color="#ff3333" intensity={3} distance={25} />
      </group>

      {/* Second emergency vehicle */}
      <group ref={group2Ref} position={[-95, 0.8, -3.5]}>
        <mesh>
          <boxGeometry args={[2.5, 1, 1.5]} />
          <meshStandardMaterial color="#225588" />
        </mesh>
        <mesh ref={light2RedRef} position={[0, 0.7, -0.4]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.2} />
        </mesh>
        <mesh ref={light2BlueRef} position={[0, 0.7, 0.4]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#0044ff" emissive="#0044ff" emissiveIntensity={2} />
        </mesh>
        <pointLight position={[0, 0.9, 0]} color="#3366ff" intensity={2} distance={20} />
      </group>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Clickable Objects
// ─────────────────────────────────────────────────────────────────────────────

// 1. documentos_kit — folder with SDS documents and route maps
function DocumentosKit({
  onObjectClick,
  disabled,
}: {
  onObjectClick: (id: string) => void
  disabled: boolean
}) {
  return (
    <Interactive id="documentos_kit" onObjectClick={onObjectClick} disabled={disabled}>
      <group position={[8, 0.15, 6]}>
        {/* Folder base */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.08, 0.35]} />
          <meshStandardMaterial color={disabled ? "#555555" : "#cc8833"} />
        </mesh>
        {/* Folder tab */}
        <mesh position={[-0.15, 0.06, 0]}>
          <boxGeometry args={[0.12, 0.04, 0.1]} />
          <meshStandardMaterial color={disabled ? "#555555" : "#cc8833"} />
        </mesh>
        {/* Papers sticking out */}
        <mesh position={[0.05, 0.06, 0]}>
          <boxGeometry args={[0.4, 0.02, 0.3]} />
          <meshStandardMaterial color={disabled ? "#888888" : "#ffffff"} />
        </mesh>
        {/* SDS label */}
        <Text
          position={[0, 0.12, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={0.06}
          color={disabled ? "#666666" : "#cc0000"}
          anchorX="center"
          anchorY="middle"
          font="/fonts/Geist-Bold.ttf"
        >
          SDS / MAPA
        </Text>
      </group>
    </Interactive>
  )
}

// 2. telefono_dgaam — phone showing DGAAM number
function TelefonoDGAAM({
  onObjectClick,
  disabled,
}: {
  onObjectClick: (id: string) => void
  disabled: boolean
}) {
  return (
    <Interactive id="telefono_dgaam" onObjectClick={onObjectClick} disabled={disabled}>
      <group position={[6, 0.8, 7]}>
        {/* Phone body */}
        <mesh>
          <boxGeometry args={[0.4, 0.7, 0.08]} />
          <meshStandardMaterial color={disabled ? "#333333" : "#1a1a1a"} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0.05, 0.041]}>
          <boxGeometry args={[0.34, 0.5, 0.01]} />
          <meshStandardMaterial
            color={disabled ? "#222222" : "#003366"}
            emissive={disabled ? "#000000" : "#001133"}
            emissiveIntensity={0.5}
          />
        </mesh>
        {/* Phone label */}
        <Html position={[0, 0.05, 0.06]} transform distanceFactor={5} center>
          <div
            style={{
              color: disabled ? "#555" : "#00ff88",
              fontFamily: "monospace",
              fontSize: "8px",
              fontWeight: "bold",
              textAlign: "center",
              lineHeight: "1.3",
            }}
          >
            DGAAM
            <br />
            (01)411-1000
          </div>
        </Html>
      </group>
    </Interactive>
  )
}

// 3. civil_zona — civilian approaching (only visible when civilEnPeligro)
function CivilZona({
  onObjectClick,
  disabled,
  visible,
}: {
  onObjectClick: (id: string) => void
  disabled: boolean
  visible: boolean
}) {
  const indicatorRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (indicatorRef.current && visible) {
      const t = clock.getElapsedTime()
      indicatorRef.current.scale.setScalar(0.8 + Math.sin(t * 6) * 0.3)
      const mat = indicatorRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 1.5 + Math.sin(t * 8) * 0.8
    }
  })

  if (!visible) return null

  return (
    <Interactive id="civil_zona" onObjectClick={onObjectClick} disabled={disabled}>
      <group position={[18, 0, -1]}>
        {/* Simple stick figure */}
        {/* Body */}
        <mesh position={[0, 0.9, 0]}>
          <capsuleGeometry args={[0.2, 0.6, 8, 8]} />
          <meshStandardMaterial color={disabled ? "#444444" : "#5566aa"} />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.6, 0]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color={disabled ? "#666666" : "#ddccaa"} />
        </mesh>
        {/* Arms */}
        <mesh position={[0, 1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.08, 0.6, 4, 4]} />
          <meshStandardMaterial color={disabled ? "#444444" : "#5566aa"} />
        </mesh>
        {/* Legs */}
        <mesh position={[-0.12, 0.35, 0]}>
          <capsuleGeometry args={[0.1, 0.4, 4, 4]} />
          <meshStandardMaterial color={disabled ? "#333333" : "#333355"} />
        </mesh>
        <mesh position={[0.12, 0.35, 0]}>
          <capsuleGeometry args={[0.1, 0.4, 4, 4]} />
          <meshStandardMaterial color={disabled ? "#333333" : "#333355"} />
        </mesh>

        {/* Pulsing red danger indicator */}
        <mesh ref={indicatorRef} position={[0, 2.1, 0]}>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2} transparent opacity={0.9} />
        </mesh>
        <pointLight position={[0, 2.1, 0]} color="#ff0000" intensity={2} distance={8} />

        {/* Warning text */}
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.2}
          color="#ff3333"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Geist-Bold.ttf"
        >
          PELIGRO
        </Text>
      </group>
    </Interactive>
  )
}

// 4. valvula_reparacion — valve with wrench (interacting = error)
function ValvulaReparacion({
  onObjectClick,
  disabled,
}: {
  onObjectClick: (id: string) => void
  disabled: boolean
}) {
  return (
    <Interactive id="valvula_reparacion" onObjectClick={onObjectClick} disabled={disabled}>
      <group position={[6, 1.4, 5.5]}>
        {/* Valve body */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.25, 12]} />
          <meshStandardMaterial color={disabled ? "#444444" : "#666666"} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Valve wheel */}
        <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.12, 0.03, 8, 16]} />
          <meshStandardMaterial color={disabled ? "#333333" : "#cc3333"} />
        </mesh>
        {/* Wrench nearby */}
        <group position={[0.1, -0.5, 0.2]} rotation={[0, Math.PI / 6, Math.PI / 8]}>
          <mesh>
            <boxGeometry args={[0.08, 0.5, 0.02]} />
            <meshStandardMaterial color={disabled ? "#444444" : "#888888"} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Wrench head */}
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.15, 0.08, 0.02]} />
            <meshStandardMaterial color={disabled ? "#444444" : "#888888"} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
        {/* Warning label */}
        <Text
          position={[0, 0.35, 0]}
          fontSize={0.08}
          color={disabled ? "#555555" : "#ffaa00"}
          anchorX="center"
          anchorY="middle"
          font="/fonts/Geist-Bold.ttf"
        >
          NO TOCAR
        </Text>
      </group>
    </Interactive>
  )
}

// 5. zona_segura — green marked zone 50m from truck
function ZonaSegura({
  onObjectClick,
  disabled,
}: {
  onObjectClick: (id: string) => void
  disabled: boolean
}) {
  const ringRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    if (ringRef.current && !disabled) {
      const t = clock.getElapsedTime()
      const mat = ringRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.15
    }
  })

  return (
    <Interactive id="zona_segura" onObjectClick={onObjectClick} disabled={disabled}>
      <group position={[20, 0, 8]}>
        {/* Green zone circle */}
        <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[2, 2.5, 32]} />
          <meshStandardMaterial
            color={disabled ? "#333333" : "#00aa44"}
            emissive={disabled ? "#000000" : "#00ff66"}
            emissiveIntensity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Inner fill */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[2, 32]} />
          <meshStandardMaterial color={disabled ? "#222222" : "#004422"} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {/* Checkmark post */}
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
          <meshStandardMaterial color={disabled ? "#444444" : "#00aa44"} />
        </mesh>
        {/* Sign */}
        <mesh position={[0, 2.2, 0]}>
          <boxGeometry args={[1.2, 0.5, 0.05]} />
          <meshStandardMaterial color={disabled ? "#333333" : "#00aa44"} />
        </mesh>
        <Text
          position={[0, 2.2, 0.03]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Geist-Bold.ttf"
        >
          ZONA SEGURA
        </Text>
        <Text
          position={[0, 2.0, 0.03]}
          fontSize={0.08}
          color="#aaffaa"
          anchorX="center"
          anchorY="middle"
          font="/fonts/Geist-Regular.ttf"
        >
          50m del incidente
        </Text>
      </group>
    </Interactive>
  )
}

// 6. fin_simulacion — checkmark zone that appears when ready
function FinSimulacion({
  onObjectClick,
  disabled,
}: {
  onObjectClick: (id: string) => void
  disabled: boolean
}) {
  const groupRef = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    if (groupRef.current && !disabled) {
      const t = clock.getElapsedTime()
      groupRef.current.position.y = 0.5 + Math.sin(t * 2) * 0.1
      groupRef.current.rotation.y = t * 0.5
    }
  })

  return (
    <Interactive id="fin_simulacion" onObjectClick={onObjectClick} disabled={disabled}>
      <group ref={groupRef} position={[22, 0.5, 10]}>
        {/* Checkmark base */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.8, 32]} />
          <meshStandardMaterial
            color={disabled ? "#333333" : "#00cc55"}
            emissive={disabled ? "#000000" : "#00ff77"}
            emissiveIntensity={0.6}
          />
        </mesh>
        {/* Checkmark symbol using two boxes */}
        <group position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
          {/* Short leg */}
          <mesh position={[-0.15, 0, -0.1]} rotation={[0, 0, -Math.PI / 6]}>
            <boxGeometry args={[0.1, 0.3, 0.08]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Long leg */}
          <mesh position={[0.15, 0, 0.1]} rotation={[0, 0, Math.PI / 6]}>
            <boxGeometry args={[0.1, 0.5, 0.08]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
        {/* Label */}
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.15}
          color={disabled ? "#555555" : "#00ff88"}
          anchorX="center"
          anchorY="middle"
          font="/fonts/Geist-Bold.ttf"
        >
          FINALIZAR
        </Text>
        <pointLight position={[0, 0.5, 0]} color="#00ff88" intensity={disabled ? 0 : 2} distance={6} />
      </group>
    </Interactive>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Safety equipment already deployed (visual context)
// ─────────────────────────────────────────────────────────────────────────────

function DeployedTriangles() {
  return (
    <group>
      {/* Triangle 1 */}
      <group position={[-12, 0, 0]}>
        <mesh position={[0, 0.4, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[0.35, 0.7, 3]} />
          <meshStandardMaterial color="#cc2222" />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>
      {/* Triangle 2 */}
      <group position={[-18, 0, 0]}>
        <mesh position={[0, 0.4, 0]} rotation={[0, -Math.PI / 6, 0]}>
          <coneGeometry args={[0.35, 0.7, 3]} />
          <meshStandardMaterial color="#cc2222" />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.5, 0.1, 0.5]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </group>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene Contents
// ─────────────────────────────────────────────────────────────────────────────

function SceneContents({
  onObjectClick,
  disabledObjects,
  fugaPct,
  civilEnPeligro,
}: {
  onObjectClick: (id: string) => void
  disabledObjects: Set<string>
  fugaPct: number
  civilEnPeligro: boolean
}) {
  const isDisabled = useCallback((id: string) => disabledObjects.has(id), [disabledObjects])

  // Dynamic fog based on leak percentage
  const fogNear = 40 - fugaPct * 0.15
  const fogFar = 120 - fugaPct * 0.3

  return (
    <>
      <fog attach="fog" args={["#2a2535", fogNear, fogFar]} />

      {/* Dusk sky */}
      <Sky
        distance={450000}
        sunPosition={[-100, 5, -100]}
        inclination={0.48}
        azimuth={0.3}
        rayleigh={1.5}
        turbidity={12}
      />

      {/* Dusk lighting */}
      <ambientLight intensity={0.35} color="#9988aa" />
      <directionalLight position={[-20, 5, -15]} intensity={0.8} color="#ff9966" />
      <hemisphereLight args={["#554466", "#221a15", 0.45]} />

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.1}
        minDistance={5}
        maxDistance={60}
        target={[5, 1, 4]}
      />

      <Ground />
      <Road />
      <Mountains />
      <TankerTruck />
      <DeployedTriangles />
      <SirenLights />

      {/* Reduced acid leak */}
      <AcidLeak origin={[6, 1.4, 5.5]} fugaPct={fugaPct} />

      {/* Clickable objects */}
      <DocumentosKit onObjectClick={onObjectClick} disabled={isDisabled("documentos_kit")} />
      <TelefonoDGAAM onObjectClick={onObjectClick} disabled={isDisabled("telefono_dgaam")} />
      <CivilZona onObjectClick={onObjectClick} disabled={isDisabled("civil_zona")} visible={civilEnPeligro} />
      <ValvulaReparacion onObjectClick={onObjectClick} disabled={isDisabled("valvula_reparacion")} />
      <ZonaSegura onObjectClick={onObjectClick} disabled={isDisabled("zona_segura")} />
      <FinSimulacion onObjectClick={onObjectClick} disabled={isDisabled("fin_simulacion")} />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

export default function Scene3({
  onObjectClick,
  disabledObjects = new Set(),
  fugaPct = 30,
  civilEnPeligro = false,
}: Scene3Props) {
  const handleCreated = useCallback((state: { gl: THREE.WebGLRenderer }) => {
    const canvas = state.gl.domElement
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault()
      },
      false
    )
    canvas.addEventListener("webglcontextrestored", () => {}, false)
  }, [])

  return (
    <div className="w-full h-screen">
      <Canvas
        camera={{ position: [15, 6, 18], fov: 55 }}
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
          disabledObjects={disabledObjects}
          fugaPct={fugaPct}
          civilEnPeligro={civilEnPeligro}
        />
      </Canvas>
    </div>
  )
}
