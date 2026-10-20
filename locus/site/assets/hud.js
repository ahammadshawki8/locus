// The television's HUD and the small interactions on text pages: the running timecode, the interactive touch
// checks on a graph page, and the request form that drafts the email. Plain script, no dependencies. Every storage
// access is guarded: it may be blocked.
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

  // Touch checks: choosing a rule lights up where it measured on the drawing and shows what it found.
  const checks = document.querySelector('[data-checks]')
  if (checks) {
    const buttons = [...checks.querySelectorAll('[data-rule]')]
    const detail = checks.querySelector('[data-rule-detail]')
    const select = (button) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === button)))
      checks.dataset.active = button.dataset.rule
      detail.textContent = button.dataset.text
    }
    buttons.forEach((b) => {
      b.addEventListener('click', () => select(b))
      b.addEventListener('mouseenter', () => select(b))
      b.addEventListener('focus', () => select(b))
    })
    if (buttons[0]) select(buttons[0])
  }

  // Request form: turns what the teacher wrote into an email Locus can act on, then opens Gmail or the mail app.
  const form = document.querySelector('[data-request]')
  if (form) {
    const $ = (name) => form.querySelector(`[name="${name}"]`)
    const preview = form.querySelector('[data-preview]')
    const store = {
      get: (k) => { try { return localStorage.getItem(k) || '' } catch { return '' } },
      set: (k, v) => { try { localStorage.setItem(k, v) } catch {} }
    }
    $('to').value = store.get('locus-to')
    $('agent').value = store.get('locus-agent') || form.dataset.agent

    // A light reading of the teacher's words, only to give the email a clear shape. The GitLab Duo intake agent does
    // the real understanding, and asks one question when something is missing.
    const read = (text) => {
      const t = text.replace(/\s+/g, ' ').trim()
      const fn = /\by\s*=\s*[-+0-9.x^ ()*/]+/i.exec(t)
      const range = /x\s*(?:from|between|=)\s*(-?[\d.]+)\s*(?:to|and|\.\.|,)\s*(-?[\d.]+)/i.exec(t)
      const points = []
      if (/highest|maximum|vertex|top of/i.test(t)) points.push('the highest point (vertex)')
      if (/lowest|minimum|bottom of/i.test(t)) points.push('the lowest point')
      if (/turning point/i.test(t)) points.push('the turning points')
      if (/y-?\s?axis|y-?\s?intercept/i.test(t)) points.push('where the curve crosses the y-axis')
      if (/x-?\s?axis|x-?\s?intercept|roots?|zeros?/i.test(t)) points.push('where the curve crosses the x-axis')
      return { fn: fn && fn[0].trim().replace(/[ .,]+$/, ''), range: range && [range[1], range[2]], points }
    }
    const draft = () => {
      const r = read($('note').value)
      const lines = ['Hello Locus,', '', 'Please make a tactile graph for my class.', '']
      lines.push(`Function: ${r.fn || 'not given yet (please ask me which function to use for the topic below)'}`)
      lines.push(`x range: ${r.range ? `from ${r.range[0]} to ${r.range[1]}` : 'not given (please choose a sensible range)'}`)
      lines.push(`Points to mark: ${r.points.length ? r.points.join(', ') : 'not given (please mark the most important points)'}`)
      if ($('copies').value) lines.push(`Printed copies needed: ${$('copies').value}`)
      lines.push('', 'In my own words:', $('note').value.trim() || '(nothing written yet)')
      lines.push('', 'Thank you.')
      if ($('agent').value.trim()) lines.push('', `/assign @${$('agent').value.trim().replace(/^@/, '')}`)
      return { subject: `Tactile graph: ${(r.fn || $('note').value.trim().split(/[.\n]/)[0] || 'request').slice(0, 60)}`, body: lines.join('\n') }
    }
    const update = () => {
      const d = draft()
      preview.textContent = `To: ${$('to').value || '(your Locus address)'}\nSubject: ${d.subject}\n\n${d.body}`
      return d
    }
    form.addEventListener('input', update)
    update()
    const send = (gmail) => {
      const to = $('to').value.trim()
      if (!to) {
        $('to').focus()
        form.querySelector('[data-error]').textContent = 'Paste your Locus address first: it is in your Locus project, Issues, then "Email a new issue".'
        return
      }
      form.querySelector('[data-error]').textContent = ''
      store.set('locus-to', to)
      store.set('locus-agent', $('agent').value.trim())
      const d = update()
      const q = (s) => encodeURIComponent(s)
      location.href = gmail
        ? `https://mail.google.com/mail/?view=cm&fs=1&to=${q(to)}&su=${q(d.subject)}&body=${q(d.body)}`
        : `mailto:${q(to)}?subject=${q(d.subject)}&body=${q(d.body)}`
    }
    form.querySelector('[data-gmail]').addEventListener('click', () => send(true))
    form.querySelector('[data-mailapp]').addEventListener('click', () => send(false))
  }
})()
