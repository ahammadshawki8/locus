const test = require('node:test')
const assert = require('node:assert')
const { primitives } = require('@jscad/modeling')

const { toBinaryStl, readTriangleCount, countOpenEdges, readBounds } = require('./stl')

test('readBounds reads the extent of a binary STL from its vertices', () => {
  const stl = toBinaryStl(primitives.cuboid({ size: [10, 20, 4], center: [5, 10, 2] }))
  assert.deepStrictEqual(readBounds(stl), { min: [0, 0, 0], max: [10, 20, 4] })
})

test('a cube becomes 12 triangles in a valid binary STL', () => {
  const stl = toBinaryStl(primitives.cuboid({ size: [10, 10, 10] }), 'locus test')
  assert.strictEqual(readTriangleCount(stl), 12)
  assert.strictEqual(stl.length, 84 + 50 * 12)
  assert.strictEqual(stl.subarray(0, 10).toString('ascii'), 'locus test')
})

test('countOpenEdges finds a missing face', () => {
  const stl = toBinaryStl(primitives.cuboid({ size: [10, 10, 10] }))
  assert.strictEqual(countOpenEdges(stl), 0)
  assert.strictEqual(countOpenEdges(stl.subarray(0, 84 + 50 * 11).fill(0, 80, 84).fill(11, 80, 81)), 3)
})

test('a sliver hole of three open edges is filled, a real missing face is not', () => {
  const { fillSliverHoles } = require('./stl')
  // A tetrahedron with its base removed: the hole is a real 1 x 1 mm face, so it stays open.
  const V = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]]
  const sides = [[0, 1, 3], [1, 2, 3], [2, 0, 3]]
  const open = [[0, 2], [2, 1], [1, 0]]
  assert.strictEqual(fillSliverHoles(sides, open, V), sides)
  // The same with the base squashed to 4 micrometres wide: a rounding sliver, closed by one reversed triangle.
  const thin = [[0, 0, 0], [1, 0, 0], [0.5, 0.004, 0], [0.5, 0.002, 1]]
  const filled = fillSliverHoles(sides, open, thin)
  assert.strictEqual(filled.length, 4)
  assert.deepStrictEqual(filled[3], [1, 2, 0])
})
