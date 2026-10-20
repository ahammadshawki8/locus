// Checks the graph request issue template (.gitlab/issue_templates/) against what intake reads and docs/contracts.md §7.
// Passing this check does not mean the template's quick actions have started the flow (rule H3).
const test = require('node:test')
const assert = require('node:assert')
const fs = require('fs')
const path = require('path')

const { H2 } = require('./flows/check')
const agents = require('./guards/agents.json')

const root = path.join(__dirname, '..')
const templatePath = path.join(root, '.gitlab', 'issue_templates', 'graph-request.md')
const contractLabels = ['locus-request', 'needs-info', 'cannot-make-readable', 'incident', 'regression']
const read = () => fs.readFileSync(templatePath, 'utf8')
const quickActions = (text) => text.split('\n').filter((line) => line.startsWith('/'))

test('the graph request template exists', () => {
  assert.ok(fs.existsSync(templatePath), `${path.relative(root, templatePath)} is missing`)
})

test('the template asks for the function, the x range and the points to mark', () => {
  const text = read().toLowerCase()
  for (const ask of ['function', 'x range', 'points to mark']) assert.ok(text.includes(ask), `no "${ask}" section`)
  // The mark words intake maps to spec marks (locus-request.yml intake step 3).
  for (const word of ['lowest point', 'turning points', 'y-axis', 'x-axis']) assert.ok(text.includes(word), `no "${word}"`)
})

test('the template asks for no learner personal data', () => {
  assert.match(read(), /do not (write|include) .*names/i)
})

test('quick actions: the locus-request label and an assign to the locus-request flow only', () => {
  const actions = quickActions(read())
  assert.deepStrictEqual(actions.map((a) => a.split(' ')[0]), ['/label', '/assign'])
  const labels = actions[0].split(' ').slice(1)
  assert.deepStrictEqual(labels, ['~locus-request'])
  for (const label of labels) assert.ok(contractLabels.includes(label.slice(1)), `${label} is not a contracts §7 label`)
  const assignees = actions[1].split(' ').slice(1)
  assert.strictEqual(assignees.length, 1)
  // GitLab adds a _<hex> suffix when the group already has a flow account of that name: the team project's
  // locus-request is ai-locus-request-gitlab-ai-hackathon_b127f8 (docs/decisions.md 21 Oct (b)).
  const flow = assignees[0].match(/^@ai-([a-z-]+?)-gitlab-ai-hackathon(?:_[0-9a-f]+)?$/)
  assert.ok(flow, `${assignees[0]} is not a flow service account (ai-<flow>-<group>[_<suffix>])`)
  assert.strictEqual(flow[1], 'locus-request')
  assert.ok(flow[1] in agents.flows)
})

test('rule H2: no em dash, en dash, minus sign or emoji in the template', () => {
  read().split('\n').forEach((line, i) => assert.ok(!H2.test(line), `line ${i + 1}: rule H2`))
})
