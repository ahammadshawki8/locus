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

/**
 * Dot centres for a braille string, in mm from the bottom-left of its box (y up).
 * Dots 1-3 run down the left column, 4-6 down the right.
 */
const cellLayout = (braille, { dotDiameterMm, dotSpacingMm, cellSpacingMm }) => {
  const r = dotDiameterMm / 2
  const cells = [...braille]
  const dots = []
  cells.forEach((c, i) => {
    for (const d of dotsOf(c)) {
      const col = d > 3 ? 1 : 0
      const row = (d - 1) % 3
      dots.push([r + i * cellSpacingMm + col * dotSpacingMm, r + (2 - row) * dotSpacingMm])
    }
  })
  return {
    widthMm: (cells.length - 1) * cellSpacingMm + dotSpacingMm + dotDiameterMm,
    heightMm: 2 * dotSpacingMm + dotDiameterMm,
    dots
  }
}

module.exports = { toBraille, dotsOf, cellLayout }
