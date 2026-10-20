// The 3D scene: the released STL plates, floating, seen through a curved CRT screen.
//   data-scene="carousel": every shipped graph on an arc; arrow keys, drag, wheel or the buttons move it; Enter or a
//     click on the centred plate opens its page. The caption under it follows the centred plate.
//   data-scene="single": one plate, turning slowly; drag to turn it.
// The scene is drawn off-screen and then through a barrel-distortion pass with a soft edge, like the glass of a
// CRT (the technique arcmarumo.com uses; this code is our own). The loader counts the real STL downloads.
import * as THREE from 'three'
import { STLLoader } from 'three/addons/loaders/STLLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const root = document.querySelector('[data-scene]')
const mode = root.dataset.scene
const graphs = JSON.parse(document.getElementById('graphs-data').textContent)
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
const loader = document.querySelector('.loader')
const flash = document.querySelector('.flash')
const count = document.querySelector('[data-count]')
const fill = document.querySelector('.loader .fill')

let finished = false
const finishLoading = () => {
  if (finished) return
  finished = true
  if (loader) loader.classList.add('done')
  if (flash && !reduced) flash.classList.add('on')
}
// Never leave a visitor on the loader: switch on after 8 s whatever happened.
setTimeout(finishLoading, 8000)

// The single plate is closer to the light than the carousel's: a little less exposure keeps its relief visible.
const carouselExposure = () => (mode === 'carousel' ? 0.95 : 0.8)

let renderer
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
} catch {
  finishLoading() // no WebGL: the flat drawing in .fallback stays visible
}

if (renderer) {
  root.classList.add('webgl')
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = carouselExposure()
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x121212, 1)
  root.prepend(renderer.domElement)
  renderer.domElement.setAttribute('aria-hidden', 'true')

  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x121212, 260, 520)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const light = () => { scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture }
  light()
  // A software GPU can drop the context (seen when the window is resized): light the scene again when it returns.
  renderer.domElement.addEventListener('webglcontextrestored', light)
  const key = new THREE.DirectionalLight(0xfff6ea, 1.25)
  key.position.set(-120, 160, 220)
  scene.add(key)

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 2000)
  const carousel = mode === 'carousel'
  camera.position.set(0, carousel ? 10 : 6, carousel ? 430 : 330)
  camera.lookAt(0, carousel ? -6 : 0, 0)

  // A grey PLA print: a little satin, a little warm.
  const material = new THREE.MeshPhysicalMaterial({ color: 0xcfccc4, roughness: 0.58, metalness: 0, clearcoat: 0.15, clearcoatRoughness: 0.6 })

  // Off-screen target and the curved-glass pass.
  const target = new THREE.WebGLRenderTarget(1, 1, { samples: 2 })
  const glass = new THREE.ShaderMaterial({
    uniforms: { picture: { value: target.texture }, bend: { value: 0.07 }, soft: { value: 0.06 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      uniform sampler2D picture;
      uniform float bend;
      uniform float soft;
      varying vec2 vUv;
      void main() {
        vec2 c = vUv * 2.0 - 1.0;
        // barrel distortion: points further from the centre are pushed outwards, as on bulging glass
        vec2 q = c * (1.0 + bend * dot(c, c));
        vec2 uv = q * 0.5 + 0.5;
        if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) { gl_FragColor = vec4(vec3(0.07), 1.0); return; }
        vec2 e = smoothstep(vec2(0.0), vec2(soft), uv) * smoothstep(vec2(0.0), vec2(soft), 1.0 - uv);
        vec3 col = texture2D(picture, uv).rgb;
        gl_FragColor = vec4(mix(vec3(0.07), col, e.x * e.y), 1.0);
      }`,
    depthTest: false,
    depthWrite: false
  })
  const post = new THREE.Scene()
  post.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), glass))
  const postCamera = new THREE.Camera()

  const resize = () => {
    const w = root.clientWidth
    const h = root.clientHeight
    renderer.setSize(w, h, false)
    const pr = renderer.getPixelRatio()
    target.setSize(Math.floor(w * pr), Math.floor(h * pr))
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
      geometry.translate(-(b.min.x + b.max.x) / 2, -(b.min.y + b.max.y) / 2, -b.min.z)
      geometry.computeVertexNormals()
      const mesh = new THREE.Mesh(geometry, material)
      group.add(mesh)
    })
    return { group, phase: i * 1.7 }
  })

  // Carousel state: `at` follows `goal` smoothly; drag and wheel move the goal.
  let goal = Math.max(0, graphs.length - 1)
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
  const go = (i) => {
    goal = Math.max(0, Math.min(graphs.length - 1, i))
    show(goal)
  }
  if (carousel) {
    show(goal)
    document.querySelector('[data-prev]')?.addEventListener('click', () => go(goal - 1))
    document.querySelector('[data-next]')?.addEventListener('click', () => go(goal + 1))
    window.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea')) return
      if (e.key === 'ArrowLeft') go(goal - 1)
      if (e.key === 'ArrowRight') go(goal + 1)
      if (e.key === 'Enter' && document.activeElement === document.body) location.href = graphs[goal].url
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
      const hit = ray.intersectObjects(items.map((it) => it.group), true)[0]
      if (hit) {
        const i = items.findIndex((it) => it.group === hit.object.parent)
        if (i === goal) location.href = graphs[i].url
        else go(i)
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
        const d = i - at
        const a = d * 0.5
        g.position.set(Math.sin(a) * 230, 18 + (reduced ? 0 : Math.sin(t * 0.9 + it.phase) * 3.2), (Math.cos(a) - 1) * 230)
        g.rotation.set(-0.42 + (reduced ? 0 : Math.sin(t * 0.7 + it.phase) * 0.05), -a * 0.9 + (reduced ? 0 : Math.sin(t * 0.5 + it.phase) * 0.08), (reduced ? 0 : Math.sin(t * 0.6 + it.phase) * 0.03))
        const s = 1 - Math.min(Math.abs(d), 2) * 0.14
        g.scale.setScalar(s)
      } else {
        g.position.set(0, reduced ? 0 : Math.sin(t * 0.9) * 2.5, 0)
        const auto = drag || reduced ? 0 : Math.sin(t * 0.35) * 0.35
        g.rotation.set(-0.5 + tilt, spin + auto, 0)
      }
    })
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
    renderer.setRenderTarget(null)
    renderer.render(post, postCamera)
    requestAnimationFrame(frame)
  }
  frame()
}
