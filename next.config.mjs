import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Évite que Turbopack / le traçage de fichiers prennent un lockfile parent (ex. C:\Users\USER\package-lock.json)
  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: path.join(__dirname),
}

export default nextConfig
