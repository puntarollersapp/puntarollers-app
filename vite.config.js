import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { cpSync, createReadStream, statSync } from 'node:fs'
import { resolve, extname } from 'node:path'

// Keep RollerMap's original design rules inside the native module.
const scopedRollerMap = {
  postcssPlugin: 'pr-rollermap-scope',
  Once(root, { result }) {
    if (!result.opts.from?.replaceAll('\\', '/').endsWith('/apps/rollermap/src/styles/global.css')) return
    root.walkRules(rule => {
      let parent = rule.parent
      while (parent) {
        if (parent.type === 'atrule' && /keyframes$/.test(parent.name)) return
        parent = parent.parent
      }
      rule.selectors = rule.selectors.map(selector => {
        if ([':root', 'body', 'html', '#root'].includes(selector.trim())) return '.pr-rollermap'
        return `.pr-rollermap ${selector}`
      })
    })
  }
}

function rollerMapAssets() {
  const source = resolve('apps/rollermap/public')
  let output
  return {
    name: 'pr-rollermap-assets',
    configResolved(config) { output = resolve(config.root, config.build.outDir, 'rollermap') },
    writeBundle() { cpSync(source, output, { recursive: true }) },
    configureServer(server) {
      server.middlewares.use('/rollermap', (req, res, next) => {
        let file
        try {
          file = resolve(source, '.' + decodeURIComponent((req.url || '/').split('?')[0]))
          if (!file.startsWith(source + '/') || !statSync(file).isFile()) return next()
        } catch { return next() }
        const type = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' }[extname(file)]
        if (type) res.setHeader('Content-Type', type)
        createReadStream(file).pipe(res)
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), rollerMapAssets()],
  css: { postcss: { plugins: [tailwindcss(), autoprefixer(), scopedRollerMap] } }
})
