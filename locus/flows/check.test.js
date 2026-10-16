const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const { checkFlow, flowFiles, isDraft, writeTools, MAX_FLOW_BYTES } = require('./check')

const minimal = `version: "v1"
environment: ambient
components:
  - name: "reader"
    type: AgentComponent
    prompt_id: "reader_prompt"
    inputs:
      - "context:goal"
      - from: "context:project_id"
        as: "project_id"
    toolset: ["get_issue", "create_issue_note"]
prompts:
  - prompt_id: "reader_prompt"
    name: "Reader"
    unit_primitives: []
    prompt_template:
      system: "Read the issue."
      user: "Project {{project_id}}: {{goal}}"
    params:
      timeout: 180
routers:
  - from: "reader"
    to: "end"
flow:
  entry_point: "reader"
`

const errorsOf = (text) => checkFlow(text).errors
const expectError = (text, pattern) => {
  const errors = errorsOf(text)
  assert.ok(errors.some((e) => pattern.test(e)), `expected an error matching ${pattern}, got: ${JSON.stringify(errors)}`)
}

test('a minimal ambient flow passes', () => {
  assert.deepEqual(errorsOf(minimal), [])
})

test('GitLab\'s own flow schema is applied: max_cycles on an AgentComponent is rejected (seen in the AI Catalog, 16 Oct)', () => {
  expectError(minimal.replace('    toolset:', '    max_cycles: 20\n    toolset:'), /GitLab schema: \/components\/0 must NOT have additional properties \(max_cycles\)/)
})

test('top-level name, description and product_group are rejected (custom flows)', () => {
  for (const field of ['name', 'description', 'product_group']) {
    expectError(`${field}: "x"\n${minimal}`, new RegExp(`top-level field "${field}"`))
  }
})

test('only environment ambient is allowed', () => {
  expectError(minimal.replace('environment: ambient', 'environment: chat'), /environment must be "ambient"/)
})

test('coding_environment must be full or none', () => {
  assert.deepEqual(errorsOf(`coding_environment: none\n${minimal}`), [])
  expectError(`coding_environment: partial\n${minimal}`, /coding_environment/)
})

test('a tool must be documented for the web UI and exist on GitLab.com', () => {
  expectError(minimal.replace('"create_issue_note"', '"merge_merge_request"'), /unknown tool "merge_merge_request"/)
  expectError(minimal.replace('"create_issue_note"', '"run_command"'), /"run_command" is IDE only/)
})

test('a tool with option overrides is checked by its name', () => {
  const text = minimal.replace('toolset: ["get_issue", "create_issue_note"]',
    'toolset:\n      - "get_issue"\n      - "create_issue_note":\n          "internal": false')
  assert.deepEqual(errorsOf(text), [])
  expectError(text.replace('"create_issue_note":', '"close_issue":'), /unknown tool "close_issue"/)
})

test('component names allow only letters, digits and underscores', () => {
  expectError(minimal.replaceAll('"reader"', '"read-er"'), /component name "read-er"/)
  expectError(minimal.replaceAll('"reader"', '"read.er"'), /component name "read.er"/)
})

test('response schemas are not supported on AgentComponent in custom flows', () => {
  expectError(minimal.replace('prompt_id: "reader_prompt"\n    inputs', 'prompt_id: "reader_prompt"\n    response_schema_id: "x"\n    inputs'),
    /response_schema_id/)
})

test('prompts may not set model or params.stop, and a local prompt must exist', () => {
  expectError(minimal.replace('    name: "Reader"', '    name: "Reader"\n    model: "x"'), /model/)
  expectError(minimal.replace('timeout: 180', 'timeout: 180\n      stop: ["x"]'), /stop/)
  expectError(minimal.replace('prompt_id: "reader_prompt"\n    inputs', 'prompt_id: "other"\n    inputs'), /prompt "other" is not defined/)
})

test('every prompt placeholder is fed by an input', () => {
  expectError(minimal.replace('{{goal}}', '{{goal}} {{mr_iid}}'), /placeholder "mr_iid"/)
})

test('routers must point at components, end or abort, and every component must be reachable', () => {
  expectError(minimal.replace('to: "end"', 'to: "nowhere"'), /router target "nowhere"/)
  const lonely = minimal
    .replace('prompts:', `  - name: "lonely"
    type: AgentComponent
    prompt_id: "reader_prompt"
    inputs: ["context:goal", "context:project_id"]
    toolset: []
prompts:`)
    .replace('flow:', '  - from: "lonely"\n    to: "end"\nflow:')
  expectError(lonely, /"lonely" is not reachable/)
  expectError(minimal.replace('  - from: "reader"\n    to: "end"\n', '  - from: "end"\n    to: "end"\n'), /"reader" has no router/)
})

test('a literal input needs "as", and then feeds that placeholder', () => {
  const text = minimal.replace('      - from: "context:project_id"\n        as: "project_id"',
    '      - from: "context:project_id"\n        as: "project_id"\n      - from: "2"\n        as: "attempt"\n        literal: true')
    .replace('{{goal}}', '{{goal}} attempt {{attempt}}')
  assert.deepEqual(errorsOf(text), [])
  expectError(text.replace('        as: "attempt"\n', ''), /literal input "2" needs "as"/)
})

test('a conditional router lists its routes', () => {
  const text = minimal.replace('  - from: "reader"\n    to: "end"',
    '  - from: "reader"\n    condition:\n      input: "context:reader.final_answer"\n      routes:\n        "yes": "end"\n        "default_route": "abort"')
  assert.deepEqual(errorsOf(text), [])
  expectError(text.replace('"yes": "end"', '"yes": "elsewhere"'), /router target "elsewhere"/)
})

test('a flow over the 40 KiB catalog limit is rejected', () => {
  const big = minimal.replace('system: "Read the issue."', `system: "${'a'.repeat(MAX_FLOW_BYTES)}"`)
  expectError(big, /40 KiB/)
})

test('rule H2: no em dash, en dash, minus sign or emoji', () => {
  expectError(minimal.replace('Read the issue.', 'Read the issue \u2014 now.'), /H2/)
  expectError(minimal.replace('Read the issue.', 'Read the issue \u{1F600}'), /H2/)
})

test('writeTools lists the tools that change something', () => {
  assert.deepEqual(writeTools(['get_issue', 'create_issue_note', 'list_commits', 'update_issue', 'submit_mr_review']),
    ['create_issue_note', 'submit_mr_review', 'update_issue'])
})

// The committed flows.

const flowsDir = path.join(__dirname, '..', '..', '.gitlab', 'duo', 'flows')

test('every committed flow that is not a design draft passes the check', () => {
  const files = flowFiles(flowsDir)
  assert.ok(files.length > 0)
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    if (isDraft(text)) continue
    assert.deepEqual(checkFlow(text).errors, [], path.basename(file))
  }
})

test('locus-request, locus-ops and locus-probe are real flow YAML, not design drafts', () => {
  for (const name of ['locus-request.yml', 'locus-ops.yml', 'locus-probe.yml']) {
    assert.equal(isDraft(fs.readFileSync(path.join(flowsDir, name), 'utf8')), false, name)
  }
})

test('locus-ops agents can only write what docs/contracts.md section 7 allows', () => {
  const { flow } = checkFlow(fs.readFileSync(path.join(flowsDir, 'locus-ops.yml'), 'utf8'))
  const writes = Object.fromEntries(flow.components.map((c) => [c.name, writeTools(toolNames(c))]))
  assert.deepEqual(writes, {
    triage: [],
    impact_reviewer: ['create_merge_request_note'], // nothing; MR notes only
    regression_detective: ['create_commit', 'create_issue', 'create_issue_note', 'create_merge_request']
  })
})

test('locus-ops routes each triage answer, and anything else ends the flow', () => {
  const { flow } = checkFlow(fs.readFileSync(path.join(flowsDir, 'locus-ops.yml'), 'utf8'))
  assert.equal(flow.flow.entry_point, 'triage')
  const triage = flow.routers.find((r) => r.from === 'triage')
  assert.equal(triage.condition.input, 'context:triage.final_answer')
  assert.deepEqual(triage.condition.routes, {
    impact: 'impact_reviewer',
    regression: 'regression_detective',
    release: 'end', // release guard: Shawki, Gate 5c
    none: 'end',
    default_route: 'end'
  })
})

test('the regression detective pins its MR options so the model cannot change them', () => {
  const { flow } = checkFlow(fs.readFileSync(path.join(flowsDir, 'locus-ops.yml'), 'utf8'))
  const detective = flow.components.find((c) => c.name === 'regression_detective')
  const mr = detective.toolset.find((t) => typeof t === 'object' && t.create_merge_request)
  assert.deepEqual(mr.create_merge_request, { labels: 'regression', remove_source_branch: true, squash: false })
})

// locus-request: intake, then the fixer, in one session (docs/contracts.md D7, section 7).

const request = () => checkFlow(fs.readFileSync(path.join(flowsDir, 'locus-request.yml'), 'utf8')).flow
const component = (flow, name) => flow.components.find((c) => c.name === name)
const options = (c, tool) => (c.toolset.find((t) => typeof t === 'object' && t[tool]) || {})[tool]
const routesOf = (flow, name) => {
  const r = flow.routers.find((x) => x.from === name)
  return r.condition ? r.condition.routes : { always: r.to }
}

test('locus-request agents can only write what docs/contracts.md section 7 allows', () => {
  const flow = request()
  const writes = Object.fromEntries(flow.components.map((c) => [c.name, writeTools(toolNames(c))]))
  assert.deepEqual(writes, {
    intake: ['create_commit', 'create_issue_note', 'create_merge_request', 'update_issue'], // requests/<iid>/**, first commit
    fixer_1: ['create_issue_note'], // checks attempt 1 (the intake commit); writes nothing
    fixer_2: ['create_commit', 'create_issue_note'], // requests/<iid>/layout.json
    fixer_3: ['create_commit', 'create_issue_note'], // requests/<iid>/layout.json
    refuse: ['create_issue_note', 'update_issue'] // label cannot-make-readable
  })
})

test('locus-request makes at most 3 attempts: no route goes back, and only fixer_2 and fixer_3 commit after intake', () => {
  const flow = request()
  assert.equal(flow.flow.entry_point, 'intake')
  assert.deepEqual(routesOf(flow, 'intake'), { asked: 'end', exists: 'end', default_route: 'fixer_1' })
  assert.deepEqual(routesOf(flow, 'fixer_1'), { pass: 'end', fail: 'fixer_2', refuse: 'refuse', default_route: 'end' })
  assert.deepEqual(routesOf(flow, 'fixer_2'), { pass: 'end', fail: 'fixer_3', refuse: 'refuse', default_route: 'end' })
  assert.deepEqual(routesOf(flow, 'fixer_3'), { pass: 'end', fail: 'refuse', refuse: 'refuse', default_route: 'end' })
  assert.deepEqual(routesOf(flow, 'refuse'), { always: 'end' })

  // No cycle: every path through the flow visits each component at most once, so there is no fourth commit.
  const next = (n) => Object.values(routesOf(flow, n)).filter((t) => t !== 'end' && t !== 'abort')
  const walk = (n, seen) => {
    assert.ok(!seen.includes(n), `cycle through ${[...seen, n].join(' > ')}`)
    for (const t of next(n)) walk(t, [...seen, n])
  }
  walk('intake', [])
  const committers = flow.components.filter((c) => toolNames(c).includes('create_commit')).map((c) => c.name)
  assert.deepEqual(committers, ['intake', 'fixer_2', 'fixer_3'])
})

test('each fixer step is told which attempt it checks, as a literal input', () => {
  const flow = request()
  for (const [name, attempt] of [['fixer_1', '1'], ['fixer_2', '2'], ['fixer_3', '3']]) {
    const input = component(flow, name).inputs.find((i) => i.as === 'attempt')
    assert.deepEqual(input, { from: attempt, as: 'attempt', literal: true }, name)
    assert.equal(component(flow, name).prompt_id, 'fixer_prompt', name)
  }
})

test('locus-request pins its labels and MR options so the model cannot change them', () => {
  const flow = request()
  assert.deepEqual(options(component(flow, 'intake'), 'update_issue'), { add_labels: 'needs-info' })
  assert.deepEqual(options(component(flow, 'refuse'), 'update_issue'), { add_labels: 'cannot-make-readable' })
  // squash false keeps one commit per attempt, which guard-scope and the attempt count read.
  assert.deepEqual(options(component(flow, 'intake'), 'create_merge_request'), { remove_source_branch: true, squash: false })
})

test('intake writes attempt 1 with exactly the default layout, print A (docs/contracts.md D4)', () => {
  const prompt = request().prompts.find((p) => p.prompt_id === 'intake_prompt').prompt_template.system
  const written = prompt.match(/"requests\/n\/layout\.json": exactly the profile's default layout: (\{[\s\S]*?\})\.\n/)
  assert.ok(written, 'the intake prompt spells out layout.json')
  assert.deepEqual(JSON.parse(written[1].replace(/\s+/g, ' ')), require('../../tools/prints/layout-A.json'))
})

test('the fixer prompt names exactly the allowed fixes of locus/touchcheck/remedies.json, and refuses when there is none', () => {
  const remedies = require('../touchcheck/remedies.json')
  const prompt = request().prompts.find((p) => p.prompt_id === 'fixer_prompt').prompt_template.system
  const listed = new Set([...prompt.matchAll(/^\s*- ([a-z-]+): changes ([A-Za-z, ]+?)\./gm)].map((m) => `${m[1]}: ${m[2]}`))
  const expected = new Set()
  for (const fixes of Object.values(remedies.rules)) for (const f of fixes) expected.add(`${f.id}: ${f.edits.join(', ')}`)
  assert.deepEqual([...listed].sort(), [...expected].sort())
  for (const [rule, fixes] of Object.entries(remedies.rules)) {
    if (!fixes.length) assert.match(prompt, new RegExp(`${rule} has no allowed fix`), rule)
  }
})

const toolNames = (component) => (component.toolset || []).map((t) => (typeof t === 'string' ? t : Object.keys(t)[0]))

test('every locus-request commit message ends with its session URL as a Locus-Session trailer (bundle agentSessions)', () => {
  const flow = request()
  const system = (id) => flow.prompts.find((p) => p.prompt_id === id).prompt_template.system
  for (const name of ['intake', 'fixer_2', 'fixer_3']) {
    const c = component(flow, name)
    assert.ok(c.inputs.some((i) => i.from === 'context:session_url' && i.as === 'session_url'), name)
    const prompt = system(c.prompt_id).replace(/\s+/g, ' ')
    assert.match(prompt, /a blank line, then the line "Locus-Session: " followed by the session URL given below/, name)
  }
})
