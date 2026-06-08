// Gera os ícones do PWA a partir de public/app-icon.png (imagem 4, com fundo rosa).
// Uso: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pub = join(__dirname, '..', 'public')
const source = join(pub, 'app-icon.png')

if (!existsSync(source)) {
  console.error('ERRO: faltou o arquivo public/app-icon.png (a logo com fundo rosa, imagem 4).')
  process.exit(1)
}

const sizes = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-icon.png', size: 180 },
  { file: 'favicon.png', size: 48 },
]

for (const { file, size } of sizes) {
  await sharp(source)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(pub, file))
  console.log('gerado', file, `(${size}x${size})`)
}
console.log('OK — ícones gerados a partir de app-icon.png')
