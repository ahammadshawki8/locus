// Scene -> SVG preview at true size (1 user unit = 1 mm). SVG y points down, so y is flipped.
const round = (v) => Math.round(v * 1000) / 1000

const escapeXml = (text) => text.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c])

const colours = { grid: '#b0b0b0', axis: '#555555', curve: '#000000' }

const toSvg = (scene, title) => {
  const { widthMm: w, heightMm: h } = scene.plate
  const flip = ([x, y]) => `${round(x)},${round(h - y)}`
  const body = [
    `  <rect class="plate" x="0" y="0" width="${round(w)}" height="${round(h)}" fill="#ffffff" stroke="#dddddd" stroke-width="0.5"/>`,
    ...scene.lines.map((l) =>
      `  <polyline class="${l.kind}" data-id="${l.id}" points="${l.points.map(flip).join(' ')}" fill="none" stroke="${colours[l.kind]}" stroke-width="${l.widthMm}" stroke-linecap="round" stroke-linejoin="round"/>`),
    ...scene.marks.map((m) =>
      `  <circle class="mark" data-mark="${m.id}" cx="${round(m.xMm)}" cy="${round(h - m.yMm)}" r="${m.diameterMm / 2}" fill="#000000"/>`)
  ]
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${round(w)} ${round(h)}">`,
    `  <title>${escapeXml(title)}</title>`,
    ...body,
    '</svg>',
    ''
  ].join('\n')
}

module.exports = { toSvg }
