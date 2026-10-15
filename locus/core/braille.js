// Minimal Grade 1 (uncontracted) braille for short labels: letters, digits, decimal point, comma, minus, hyphen, capital,
// space. Every number gets its own number sign. Not checked by a braille transcriber yet (docs/decisions.md).
const cell = (...dots) => String.fromCharCode(0x2800 + dots.reduce((bits, d) => bits | (1 << (d - 1)), 0))

// Raised dots of a..z, in order.
const LETTER_DOTS = [
  '1', '12', '14', '145', '15', '124', '1245', '125', '24', '245', // a-j
  '13', '123', '134', '1345', '135', '1234', '12345', '1235', '234', '2345', // k-t
  '136', '1236', '2456', '1346', '13456', '1356' // u-z
]
const LETTERS = Object.fromEntries(LETTER_DOTS.map((dots, i) => [String.fromCharCode(97 + i), cell(...[...dots].map(Number))]))
const DIGITS = Object.fromEntries('1234567890'.split('').map((d, i) => [d, LETTERS['abcdefghij'[i]]]))
const NUMBER_SIGN = cell(3, 4, 5, 6)
const CAPITAL = cell(6)
const DECIMAL_POINT = cell(2, 5, 6)
const COMMA = cell(2)
const HYPHEN = cell(3, 6)
const MINUS = cell(5) + cell(3, 6)
const BLANK = cell()

/** Translate a short label to Unicode braille. Throws on any character outside the table. */
const toBraille = (text) => {
  let out = ''
  let inNumber = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (DIGITS[ch]) {
      if (!inNumber) out += NUMBER_SIGN
      out += DIGITS[ch]
      inNumber = true
    } else if (ch === '.' && inNumber && next && DIGITS[next]) {
      out += DECIMAL_POINT
    } else if (ch === '-' && next && (DIGITS[next] || next === '.') && !inNumber) {
      out += MINUS
    } else {
      inNumber = false
      if (ch === ',') out += COMMA
      else if (ch === '-') out += HYPHEN
      else if (ch === ' ') out += BLANK
      else if (LETTERS[ch]) out += LETTERS[ch]
      else if (LETTERS[ch.toLowerCase()]) out += CAPITAL + LETTERS[ch.toLowerCase()]
      else throw new Error(`no braille cell for "${ch}" in "${text}"`)
    }
  }
  return out
}

/** Raised dot numbers (1-6) of one Unicode braille cell. */
const dotsOf = (brailleCell) => {
  const bits = brailleCell.charCodeAt(0) - 0x2800
  return [1, 2, 3, 4, 5, 6].filter((d) => bits & (1 << (d - 1)))
}

/** Size of the box around `cells` braille cells, edge of dot to edge of dot (profile `braille`, contracts §2). */
const cellBox = (cells, { dotDiameterMm: d, dotPitchMm: p, cellPitchMm: cp }) => ({ w: (cells - 1) * cp + p + d, h: 2 * p + d })

/**
 * Dot centres, in plate mm (y up), for a braille string whose box is centred on (cx, cy).
 * Dots 1-3 run down the left column, 4-6 down the right. Same arithmetic as tools/prints/prints.js, so the
 * dots land on exactly the same coordinates as on the prototype prints.
 */
const brailleDots = (braille, cx, cy, b) => {
  const { dotDiameterMm: d, dotPitchMm: p, cellPitchMm: cp } = b
  const cells = [...braille]
  const { w, h } = cellBox(cells.length, b)
  const left = cx - w / 2 + d / 2
  const top = cy + h / 2 - d / 2
  return cells.flatMap((c, i) => dotsOf(c).map((n) => [
    left + i * cp + (n <= 3 ? 0 : p),
    top - ((n - 1) % 3) * p
  ]))
}

module.exports = { toBraille, dotsOf, cellBox, brailleDots }
