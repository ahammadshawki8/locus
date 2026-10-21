// The 3D scene: the released STL plates, floating, seen through a curved CRT screen.
//   data-scene="carousel": every shipped graph on an arc that wraps around, so a plate is always on each side of the
//     centred one; arrow keys, drag or the wheel move it; Enter or a click on the centred plate opens its page. The
//     caption under it follows the centred plate.
//   data-scene="single": one plate, turning slowly; drag to turn it.
// Lit evenly and coloured by height (plate light, raised parts dark) so every line, dome and braille dot reads.
// The loader counts the real STL downloads.
import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'

const root = document.querySelector('[data-scene]')
const mode = root.dataset.scene
const graphs = JSON.parse(document.getElementById('graphs-data').textContent)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const loader = document.querySelector('.loader')
const count = document.querySelector('[data-count]')
const fill = document.querySelector('.loader .fill')

let finished = false
const finishLoading = () => {
  if (finished) return
  finished = true
  if (loader) loader.classList.add('done')
  root.classList.add('ready') // the picture fades up as the loader dims (site.css)
}
// Never leave a visitor on the loader: switch on after 8 s whatever happened.
setTimeout(finishLoading, 8000)

let renderer
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
} catch {
  finishLoading() // no WebGL: the flat drawing in .fallback stays visible
}

if (renderer) {
  root.classList.add('webgl')
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.NoToneMapping
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x121212, 1)
  root.prepend(renderer.domElement)
  renderer.domElement.setAttribute('aria-hidden', 'true')

  // Plain, even light: the plate reads like a printed object on a desk, with no glare and no blur over it.
  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a8a, 1.9))
  const key = new THREE.DirectionalLight(0xffffff, 1.4)
  key.position.set(-90, 140, 260)
  scene.add(key)

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000)
  const carousel = mode === 'carousel'
  camera.position.set(0, carousel ? 10 : 6, carousel ? 430 : 300)
  camera.lookAt(0, carousel ? -6 : 0, 0)

  // Coloured by height, like the drawings: the plate light, everything raised above it (lines, domes, braille) dark.
  const PLATE = new THREE.Color(0xf1eee8)
  const RAISED = new THREE.Color(0x20272e)
  const material = new THREE.MeshLambertMaterial({ vertexColors: true })
  const paint = (geometry) => {
    const pos = geometry.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const top = 2.05 // the plate is 2 mm thick (profile fdm-handheld-v1); anything higher is a raised feature
    for (let i = 0; i < pos.count; i++) (pos.getZ(i) > top ? RAISED : PLATE).toArray(colors, i * 3)
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }

  const resize = () => {
    const w = root.clientWidth
    const h = root.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  new ResizeObserver(resize).observe(root)
  resize()

  // Load every plate; the loader shows the real progress.
  const manager = new THREE.LoadingManager()
  manager.onProgress = (_url, done, total) => {
    const pct = Math.round((done / total) * 100)
    if (count) count.textContent = String(pct)
    if (fill) fill.style.width = `${pct}%`
  }
  manager.onLoad = finishLoading
  manager.onError = () => finishLoading()
  const stl = new STLLoader(manager)

  const items = graphs.map((g, i) => {
    const group = new THREE.Group()
    scene.add(group)
    stl.load(g.stl, (geometry) => {
      geometry.computeBoundingBox()
      const b = geometry.boundingBox
      geometry.translate(0, 0, -b.min.z)
      paint(geometry)
      geometry.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, 0)
      geometry.computeVertexNormals()
      const mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)
    })
    return { group, phase: i * 1.7 }
  })

  // Carousel state: `at` follows `goal` smoothly; drag and wheel move the goal. Both count turns without end, and
  // `slot` maps them onto the plates, so the carousel wraps around (newest, then the oldest after it).
  const n = graphs.length
  const slot = (k) => ((Math.round(k) % n) + n) % n
  // A plate's offset from the centre, the short way round: in [-n/2, n/2).
  const around = (d) => (n < 2 ? d : d - n * Math.floor(d / n + 0.5))
  let goal = Math.max(0, n - 1)
  let at = goal
  const caption = {
    label: document.querySelector('[data-caption-label]'),
    title: document.querySelector('[data-caption-title]'),
    tags: document.querySelector('[data-caption-tags]')
  }
  const show = (i) => {
    const g = graphs[i]
    if (!g || !caption.title) return
    caption.label.textContent = g.label
    caption.title.innerHTML = `<a href="${g.url}">${g.titleHtml}</a>`
    caption.tags.textContent = g.tags
  }
  const go = (k) => {
    goal = k
    show(slot(goal))
  }
  if (carousel) {
    show(slot(goal))
    window.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return
      if (e.key === 'ArrowLeft') go(goal - 1)
      if (e.key === 'ArrowRight') go(goal + 1)
      if (e.key === 'Enter' && document.activeElement === document.body) location.href = graphs[slot(goal)].url
    })
    let wheelLock = 0
    root.addEventListener('wheel', (e) => {
      const now = performance.now()
      if (now < wheelLock || Math.abs(e.deltaX) + Math.abs(e.deltaY) < 8) return
      wheelLock = now + 450
      go(goal + Math.sign(e.deltaX || e.deltaY))
    }, { passive: true })
  }

  // Pointer: drag turns the single plate or moves the carousel; a click on a carousel plate opens or centres it.
  const ray = new THREE.Raycaster()
  let drag = null
  let spin = 0
  let tilt = 0
  renderer.domElement.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0, spin, tilt } })
  window.addEventListener('pointermove', (e) => {
    if (!drag) return
    const dx = e.clientX - drag.x
    const dy = e.clientY - drag.y
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy))
    if (!carousel) {
      spin = drag.spin + dx * 0.008
      tilt = Math.max(-0.6, Math.min(0.6, drag.tilt + dy * 0.004))
    }
  })
  window.addEventListener('pointerup', (e) => {
    if (!drag) return
    const dx = e.clientX - drag.x
    if (carousel && drag.moved > 40) go(goal - Math.sign(dx))
    else if (carousel && drag.moved < 6) {
      const r = renderer.domElement.getBoundingClientRect()
      ray.setFromCamera({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1 }, camera)
      const hit = ray.intersectObjects(items.filter((it) => it.group.visible).map((it) => it.group), true)[0]
      if (hit) {
        const i = items.findIndex((it) => it.group === hit.object.parent)
        if (i === slot(goal)) location.href = graphs[i].url
        else go(goal + Math.round(around(i - slot(goal))))
      }
    }
    drag = null
  })

  const clock = new THREE.Clock()
  const frame = () => {
    const t = clock.getElapsedTime()
    at += (goal - at) * 0.08
    items.forEach((it, i) => {
      const g = it.group
      if (carousel) {
        const d = around(i - at)
        const a = d * 0.5
        g.position.set(Math.sin(a) * 230, 2 + (reduced ? 0 : Math.sin(t * 0.9 + it.phase) * 3.2), (Math.cos(a) - 1) * 230)
        g.rotation.set(-0.42 + (reduced ? 0 : Math.sin(t * 0.7 + it.phase) * 0.05), -a * 0.9 + (reduced ? 0 : Math.sin(t * 0.5 + it.phase) * 0.08), (reduced ? 0 : Math.sin(t * 0.6 + it.phase) * 0.03))
        // The plate crossing the far edge (from one side to the other) shrinks away and grows back, never jumps. With
        // two plates both stay.
        const edge = n > 2 ? Math.min(1, (n / 2 - Math.abs(d)) / 0.5) : 1
        const s = (1 - Math.min(Math.abs(d), 2) * 0.14) * Math.max(0, edge)
        g.visible = s > 0.01
        g.scale.setScalar(Math.max(s, 0.001))
      } else {
        g.position.set(0, reduced ? 0 : Math.sin(t * 0.9) * 2.5, 0)
        const auto = drag || reduced ? 0 : Math.sin(t * 0.35) * 0.35
        g.rotation.set(-0.5 + tilt, spin + auto, 0)
      }
    })
    renderer.render(scene, camera)
    requestAnimationFrame(frame)
  }
  frame()
}
