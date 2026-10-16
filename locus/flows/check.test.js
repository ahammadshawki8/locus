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

test('locus-ops and locus-probe are real flow YAML, not design drafts', () => {
  for (const name of ['locus-ops.yml', 'locus-probe.yml']) {
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

const toolNames = (component) => (component.toolset || []).map((t) => (typeof t === 'string' ? t : Object.keys(t)[0]))
