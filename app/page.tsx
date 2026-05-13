"use client"

import { Suspense, useState } from "react"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"

const Scene1A = dynamic(() => import("@/components/scene-1a"), { ssr: false })

const LABELS: Record<string, string> = {
  triangulos: "Triángulos de seguridad colocados",
  telefono: "Llamando al 116 - Emergencia",
  "indicador-viento": "Verificando dirección del viento",
  valvula: "Válvula con fuga identificada",
  extintor: "Extintor listo para usar",
}

function HomePage() {
  const [selected, setSelected] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const view = searchParams.get("view") ?? undefined
  const renderMode = searchParams.get("render") === "1"

  return (
    <main className="relative w-full h-screen bg-background">
      <Scene1A onObjectClick={(id) => setSelected(id)} view={view} />

      {!renderMode && <div className="pointer-events-none absolute top-0 left-0 right-0 p-4 flex flex-col gap-1">
        <h1 className="text-foreground text-balance font-sans text-lg font-semibold drop-shadow-md">
          Simulador de Emergencia Química
        </h1>
        <p className="text-foreground/80 text-pretty text-sm drop-shadow-md">
          Carretera de montaña - Fuga de gas en cisterna. Haz clic en los elementos para identificarlos.
        </p>
      </div>}

      {!renderMode && selected && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg border border-border bg-card/90 backdrop-blur px-4 py-3 shadow-lg">
          <p className="text-card-foreground font-sans text-sm">
            <span className="font-semibold">{selected}</span>
            {" — "}
            {LABELS[selected] ?? "Elemento seleccionado"}
          </p>
        </div>
      )}
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<main className="w-full h-screen bg-background" />}>
      <HomePage />
    </Suspense>
  )
}
