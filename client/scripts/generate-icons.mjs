// Jednokratni generator PWA ikona za KOLEGA (pokreni: node scripts/generate-icons.mjs)
// Koristi brand gradijent #FF6B35 -> #FFB800 i bijelo "K".
import sharp from 'sharp'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')
mkdirSync(outDir, { recursive: true })

// K glif (vektorski, ne zavisi od fonta) unutar 512x512
const glyph = `
  <rect x="140" y="150" width="60" height="212" rx="22" fill="#fff"/>
  <path d="M190 256 L360 150" stroke="#fff" stroke-width="62" stroke-linecap="round"/>
  <path d="M190 256 L360 362" stroke="#fff" stroke-width="62" stroke-linecap="round"/>
`

const grad = `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FF6B35"/>
      <stop offset="1" stop-color="#FFB800"/>
    </linearGradient>
  </defs>
`

// "any" ikona: zaobljeni kvadrat sa providnim uglovima
const rounded = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${grad}
  <rect x="0" y="0" width="512" height="512" rx="112" fill="url(#g)"/>
  ${glyph}
</svg>`

// "maskable" + apple-touch: pun kvadrat do ivica (launcher ga sam maskira)
const fullBleed = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  ${grad}
  <rect x="0" y="0" width="512" height="512" fill="url(#g)"/>
  ${glyph}
</svg>`

const jobs = [
  { svg: rounded,   size: 192, name: 'pwa-192.png' },
  { svg: rounded,   size: 512, name: 'pwa-512.png' },
  { svg: fullBleed, size: 512, name: 'pwa-maskable-512.png' },
  { svg: fullBleed, size: 180, name: 'apple-touch-icon.png' },
]

for (const j of jobs) {
  await sharp(Buffer.from(j.svg)).resize(j.size, j.size).png().toFile(join(outDir, j.name))
  console.log('✔', j.name, `${j.size}x${j.size}`)
}
console.log('Gotovo →', outDir)
