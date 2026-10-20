const test = require('node:test')
const assert = require('node:assert')

const { checkRevert } = require('./revert')

const T = 'a'.repeat(40) // the commit bisect-regression named
const R = 'b'.repeat(40) // the branch's one commit

// Tree entries ("mode blob") per commit and path. T changed scene.js and added new.js; T^1 is before it, R^1 is the
// branch's base (still holding T's content), R is the inverse.
const trees = {
  [`${T}^1`]: { 'locus/core/scene.js': '100644 old' },
  [T]: { 'locus/core/scene.js': '100644 new', 'locus/core/new.js': '100644 added' },
  [`${R}^1`]: { 'locus/core/scene.js': '100644 new', 'locus/core/new.js': '100644 added' },
  [R]: { 'locus/core/scene.js': '100644 old' }
}
const entryIn = (t) => (ref, path) => (t[ref] && t[ref][path]) || null

const exact = {
  name: T.slice(0, 8),
  target: { sha: T, onDefaultBranch: true, hasParent: true },
  commits: [{ sha: R, merge: false }],
  targetChanges: [{ status: 'M', path: 'locus/core/scene.js' }, { status: 'A', path: 'locus/core/new.js' }],
  revertChanges: [{ status: 'M', path: 'locus/core/scene.js' }, { status: 'D', path: 'locus/core/new.js' }],
  entry: entryIn(trees)
}

test('the exact inverse passes: same paths, each back to its content before the commit (an added file deleted)', () => {
  assert.deepStrictEqual(checkRevert(exact), { pass: true, errors: [] })
})

test('a branch name that is not a commit is blocked', () => {
  const result = checkRevert({ ...exact, target: null })
  assert.strictEqual(result.pass, false)
  assert.match(result.errors[0], /is not a commit/)
})

test('only a commit already on the default branch can be reverted', () => {
  const result = checkRevert({ ...exact, target: { ...exact.target, onDefaultBranch: false } })
  assert.match(result.errors.join('\n'), /not on the default branch/)
})

test('a root commit has no inverse', () => {
  assert.match(checkRevert({ ...exact, target: { ...exact.target, hasParent: false } }).errors.join('\n'), /root commit/)
})

test('the branch holds exactly one commit', () => {
  assert.match(checkRevert({ ...exact, commits: [] }).errors[0], /exactly one commit.*holds 0/)
  assert.match(checkRevert({ ...exact, commits: [{ sha: R, merge: false }, { sha: 'c'.repeat(40), merge: false }] }).errors[0], /holds 2/)
})

test('the inverse is a plain commit, not a merge', () => {
  assert.match(checkRevert({ ...exact, commits: [{ sha: R, merge: true }] }).errors.join('\n'), /not a merge/)
})

test('a path the commit changed but the inverse leaves alone is blocked', () => {
  const result = checkRevert({ ...exact, revertChanges: [{ status: 'M', path: 'locus/core/scene.js' }] })
  assert.strictEqual(result.pass, false)
  assert.match(result.errors.join('\n'), /locus\/core\/new\.js: .* changed it, but the inverse does not/)
})

test('a path the commit did not change is blocked', () => {
  const result = checkRevert({ ...exact, revertChanges: [...exact.revertChanges, { status: 'M', path: 'locus/touchcheck/remedies.json' }] })
  assert.match(result.errors.join('\n'), /remedies\.json: the inverse changes it, but .* did not/)
})

test('a near-inverse (right path, wrong content) is blocked', () => {
  const near = { ...trees, [R]: { 'locus/core/scene.js': '100644 almost-old' } }
  const result = checkRevert({ ...exact, entry: entryIn(near) })
  assert.strictEqual(result.pass, false)
  assert.deepStrictEqual(result.errors, [`locus/core/scene.js: not restored to its content before ${T.slice(0, 8)}`])
})

test('a file mode change counts: same bytes, different mode is not the inverse', () => {
  const mode = { ...trees, [R]: { 'locus/core/scene.js': '100755 old' } }
  assert.match(checkRevert({ ...exact, entry: entryIn(mode) }).errors.join('\n'), /scene\.js: not restored/)
})

test('a path changed again after the commit is blocked: restoring it would also undo later work', () => {
  const later = { ...trees, [`${R}^1`]: { 'locus/core/scene.js': '100644 newer', 'locus/core/new.js': '100644 added' } }
  const result = checkRevert({ ...exact, entry: entryIn(later) })
  assert.strictEqual(result.pass, false)
  assert.match(result.errors.join('\n'), /scene\.js: changed again after .*a person must/)
})
