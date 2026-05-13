# Simulador de Emergencia Química

Proyecto Next.js con escena 3D interactiva de un camión cisterna en emergencia química.

## Stack
- Next.js 16
- React 19
- Three.js
- @react-three/fiber
- @react-three/drei

## Desarrollo local
```bash
pnpm install
pnpm dev
```

## Build de producción
```bash
pnpm build
pnpm start
```

## Deploy en Render
Este proyecto incluye `render.yaml` para desplegarse como Web Service.

### Valores clave
- **Root Directory:** `.`
- **Build Command:** `corepack enable && pnpm install --frozen-lockfile && pnpm build`
- **Start Command:** `pnpm start`
- **Node:** `22`

## Nota
Se corrigió el problema de build en producción relacionado con `useSearchParams`, así que ya está apto para deploy.
