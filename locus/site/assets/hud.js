// The television's HUD: a running timecode, the viewer's local clock, the B&W switch, and the power-on flash on pages
// without a 3D scene. Plain script, no dependencies. Every storage access is guarded: it may be blocked.
(() => {
  const pad = (n) => String(n).padStart(2, '0')
  const start = performance.now()
  const timecode = document.querySelector('[data-timecode]')
  const clock = document.querySelector('[data-clock]')
  const tz = (() => {
    try {
      return new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName').value
    } catch {
      return ''
    }
  })()
  const tick = () => {
    const s = Math.floor((performance.now() - start) / 1000)
    if (timecode) timecode.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
    if (clock) {
      const d = new Date()
      clock.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())} ${tz}`
    }
  }
  tick()
  setInterval(tick, 1000)

  const bw = document.querySelector('[data-bw]')
  const setBw = (on) => {
    document.documentElement.classList.toggle('bw', on)
    if (bw) {
      bw.setAttribute('aria-checked', String(on))
      bw.querySelector('[data-state]').textContent = on ? '[ON]' : '[OFF]'
    }
  }
  let saved = false
  try { saved = localStorage.getItem('locus-bw') === '1' } catch {}
  setBw(saved)
  if (bw) {
    bw.addEventListener('click', () => {
      const on = !document.documentElement.classList.contains('bw')
      setBw(on)
      try { localStorage.setItem('locus-bw', on ? '1' : '0') } catch {}
    })
  }

  // Pages without a scene still switch on like the television does.
  if (!document.querySelector('[data-scene]')) {
    const flash = document.querySelector('.flash')
    if (flash && !matchMedia('(prefers-reduced-motion: reduce)').matches) flash.classList.add('on')
  }
})()
