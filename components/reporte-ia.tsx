"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { CheckCircle2, AlertTriangle, BookOpen, Route, Sparkles } from "lucide-react"

interface ReporteIAProps {
  reporte: {
    resumen: string
    fortalezas: string[]
    temas_a_reforzar: string[]
    plan_estudio: string[]
    mensaje_motivacional: string
  } | null
  isLoading: boolean
  resultado: {
    porcentaje: number
    nivel: string
    camino_tomado: string[]
    trigger_fallo: string | null
  }
}

// Animated score circle component
function ScoreCircle({ porcentaje, nivel }: { porcentaje: number; nivel: string }) {
  const [animatedPct, setAnimatedPct] = useState(0)
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (animatedPct / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedPct(porcentaje), 100)
    return () => clearTimeout(timer)
  }, [porcentaje])

  // Color based on score
  const getColor = (pct: number) => {
    if (pct >= 80) return "#22c55e" // green
    if (pct >= 60) return "#f97316" // orange
    return "#ef4444" // red
  }

  const color = getColor(porcentaje)

  return (
    <div className="relative flex flex-col items-center">
      <svg width="200" height="200" className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="12"
        />
        {/* Animated progress circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-5xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {animatedPct}%
        </motion.span>
        <motion.span
          className="text-lg text-zinc-400 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {nivel}
        </motion.span>
      </div>
    </div>
  )
}

// Skeleton loader component
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-zinc-800 rounded animate-pulse ${className}`}
    />
  )
}

// Loading state component
function LoadingState() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Score skeleton */}
        <div className="flex justify-center">
          <Skeleton className="w-[200px] h-[200px] rounded-full" />
        </div>

        {/* Resumen skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Cards skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Plan skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

// Camino tomado breadcrumb component
function CaminoTomado({
  camino,
  triggerFallo,
}: {
  camino: string[]
  triggerFallo: string | null
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {camino.map((escena, idx) => {
        const isFallo = triggerFallo && escena.toLowerCase().includes(triggerFallo.toLowerCase())
        return (
          <motion.div
            key={idx}
            className="flex items-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                isFallo
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-zinc-800 text-zinc-300 border border-zinc-700"
              }`}
            >
              {escena}
            </div>
            {idx < camino.length - 1 && (
              <div className="mx-2 text-zinc-600">→</div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export default function ReporteIA({ reporte, isLoading, resultado }: ReporteIAProps) {
  if (isLoading) {
    return <LoadingState />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-10">
      <motion.div
        className="max-w-4xl mx-auto space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Score Circle */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <ScoreCircle porcentaje={resultado.porcentaje} nivel={resultado.nivel} />
        </motion.div>

        {/* Resumen */}
        {reporte && (
          <motion.div variants={itemVariants} className="space-y-3">
            <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Análisis de Desempeño
            </h2>
            <p className="text-zinc-400 leading-relaxed">{reporte.resumen}</p>
          </motion.div>
        )}

        {/* Camino Tomado */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
            <Route className="w-5 h-5 text-orange-500" />
            Camino Tomado
          </h2>
          <CaminoTomado
            camino={resultado.camino_tomado}
            triggerFallo={resultado.trigger_fallo}
          />
          {resultado.trigger_fallo && (
            <p className="text-sm text-red-400 mt-2">
              Punto de fallo: {resultado.trigger_fallo}
            </p>
          )}
        </motion.div>

        {/* Fortalezas y Temas a reforzar - two columns */}
        {reporte && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Fortalezas */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Fortalezas
              </h2>
              <div className="space-y-3">
                {reporte.fortalezas.map((fortaleza, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">{fortaleza}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Temas a reforzar */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Temas a Reforzar
              </h2>
              <div className="space-y-3">
                {reporte.temas_a_reforzar.map((tema, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                    <span className="text-zinc-300">{tema}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Plan de Estudio */}
        {reporte && (
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-semibold text-zinc-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-orange-500" />
              Plan de Estudio Recomendado
            </h2>
            <div className="space-y-3">
              {reporte.plan_estudio.map((paso, idx) => (
                <motion.div
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-500 font-bold text-sm shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-300 pt-1">{paso}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mensaje Motivacional */}
        {reporte && (
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl p-6 mt-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(234, 88, 12, 0.05) 100%)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-transparent" />
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-400 mb-2">
                  Mensaje del Instructor IA
                </h3>
                <p className="text-zinc-300 leading-relaxed italic">
                  &ldquo;{reporte.mensaje_motivacional}&rdquo;
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
