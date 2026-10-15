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
