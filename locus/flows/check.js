// Checks a Duo custom flow YAML against the documented schema before it is pasted into the AI Catalog.
// Sources (read 16 Oct 2026):
// - flow registry v1: https://gitlab.com/gitlab-org/modelops/applied-ml/code-suggestions/ai-assist/-/blob/main/docs/flow_registry/v1.md
// - custom flow restrictions: https://docs.gitlab.com/user/duo_agent_platform/flows/custom_flows_schema/
// - size limit: https://docs.gitlab.com/user/duo_agent_platform/ai_catalog/#configuration-size-limits
// - tool names: ./tools.json
// Passing this check means the YAML follows the docs. It does not mean the flow has run (rule H3).

const fs = require('node:fs')
const path = require('node:path')
const YAML = require('yaml')

const tools = require('./tools.json')

const MAX_FLOW_BYTES = 40 * 1024
const TOP_LEVEL = new Set(['version', 'environment', 'coding_environment', 'components', 'routers', 'flow', 'prompts', 'response_schemas', 'include'])
const REJECTED_TOP_LEVEL = ['name', 'description', 'product_group']
const COMPONENT_TYPES = new Set(['AgentComponent', 'DeterministicStepComponent', 'OneOffComponent', 'HumanInputComponent'])
const BUILT_IN_TARGETS = new Set(['end', 'abort'])
const PROMPT_FIELDS = new Set(['prompt_id', 'name', 'unit_primitives', 'prompt_template', 'params', 'tool_output_security'])
const PARAMS_FIELDS = new Set(['timeout', 'vertex_location'])
const NAME = /^[A-Za-z0-9_]+$/
// H2: em dash, en dash, minus sign, and emoji / pictographs.
const H2 = /[\u2013\u2014\u2212\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u
const DRAFT = /^# DESIGN DRAFT/

const webUi = new Set(tools.webUi.tools)
const ideOnly = new Set(tools.ideOnly.tools)
const live = new Set(tools.live.tools)

/** Tools that change something in GitLab (everything except reads, searches and plan bookkeeping). */
const READ = /^(get|list|gitlab_|run_glql_query|extract_lines_from_text|build_review_merge_request_context|ci_linter|fetch_glql_schema)/
const PLAN = new Set(['add_new_task', 'create_plan', 'remove_task', 'set_task_status', 'update_task_description'])
const writeTools = (names) => [...new Set(names.filter((n) => !READ.test(n) && !PLAN.has(n)))].sort()

const toolName = (item) => (typeof item === 'string' ? item : Object.keys(item || {})[0])

/** Template variable a component input provides: `as`, else the last part of `context:<key>`. */
const inputVar = (input) => {
  if (typeof input === 'string') return input.replace(/^context:/, '').split('.').pop()
  return input && (input.as || String(input.from || '').replace(/^context:/, '').split('.').pop())
}

const placeholders = (text) => [...String(text || '').matchAll(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)/g)].map((m) => m[1])

/**
 * @param {string} text flow YAML
 * @returns {{ errors: string[], flow: object|null }}
 */
const checkFlow = (text) => {
  const errors = []
  if (Buffer.byteLength(text, 'utf8') > MAX_FLOW_BYTES) errors.push(`flow is ${Buffer.byteLength(text, 'utf8')} bytes; the AI Catalog limit is 40 KiB`)
  text.split('\n').forEach((line, i) => { if (H2.test(line)) errors.push(`line ${i + 1}: rule H2 (no em dash, en dash, minus sign or emoji)`) })

  let flow
  try {
    flow = YAML.parse(text)
  } catch (e) {
    return { errors: [...errors, `YAML: ${e.message}`], flow: null }
  }
  if (!flow || typeof flow !== 'object') return { errors: [...errors, 'flow is not a YAML mapping'], flow: null }

  for (const field of REJECTED_TOP_LEVEL) if (field in flow) errors.push(`top-level field "${field}" is rejected in custom flows`)
  for (const field of Object.keys(flow)) if (!TOP_LEVEL.has(field) && !REJECTED_TOP_LEVEL.includes(field)) errors.push(`unknown top-level field "${field}"`)
  if (flow.version !== 'v1') errors.push('version must be "v1"')
  if (flow.environment !== 'ambient') errors.push('environment must be "ambient" in custom flows')
  if ('coding_environment' in flow && !['full', 'none'].includes(flow.coding_environment)) errors.push('coding_environment must be "full" or "none"')

  const components = Array.isArray(flow.components) ? flow.components : []
  if (!components.length) errors.push('components must be a non-empty list')
  const prompts = new Map((Array.isArray(flow.prompts) ? flow.prompts : []).map((p) => [p && p.prompt_id, p]))
  const routers = Array.isArray(flow.routers) ? flow.routers : []
  if (!Array.isArray(flow.routers)) errors.push('routers must be a list')

  // Prompts.
  for (const [id, p] of prompts) {
    if (!id) { errors.push('a prompt has no prompt_id'); continue }
    for (const field of Object.keys(p)) {
      if (field === 'model') errors.push(`prompt "${id}": model is not supported in custom flows`)
      else if (!PROMPT_FIELDS.has(field)) errors.push(`prompt "${id}": unknown field "${field}"`)
    }
    if (!p.name) errors.push(`prompt "${id}": name is required`)
    if (!Array.isArray(p.unit_primitives)) errors.push(`prompt "${id}": unit_primitives must be a list`)
    if (!p.prompt_template || !p.prompt_template.system || !p.prompt_template.user) errors.push(`prompt "${id}": prompt_template needs system and user`)
    for (const field of Object.keys(p.params || {})) {
      if (field === 'stop') errors.push(`prompt "${id}": params.stop is not supported in custom flows`)
      else if (!PARAMS_FIELDS.has(field)) errors.push(`prompt "${id}": unknown params field "${field}"`)
    }
  }

  // Components.
  const names = new Set()
  const subagents = new Set()
  for (const c of components) {
    const name = c && c.name
    if (!name || !NAME.test(name)) { errors.push(`component name "${name}" must use only letters, digits and underscores`); continue }
    if (names.has(name)) errors.push(`component name "${name}" is used twice`)
    names.add(name)
    if (!COMPONENT_TYPES.has(c.type)) errors.push(`component "${name}": unknown type "${c.type}"`)
    for (const s of c.subagents || []) subagents.add(s && s.name)
    // A literal input's value is its `from` text; ai-assist rejects one without `as` (state/base.py).
    for (const input of c.inputs || []) {
      if (input && input.literal === true && !input.as) errors.push(`component "${name}": literal input "${input.from}" needs "as"`)
    }

    if (c.type === 'AgentComponent' || c.type === 'OneOffComponent') {
      for (const field of ['response_schema_id', 'response_schema_version']) {
        if (field in c) errors.push(`component "${name}": ${field} is not supported in custom flows`)
      }
      if (c.type === 'OneOffComponent' && 'ui_role_as' in c) errors.push(`component "${name}": ui_role_as is not supported on OneOffComponent in custom flows`)
      if (c.prompt_version != null) {
        errors.push(`component "${name}": prompt_version points at the server prompt registry; custom flows define their prompts inline`)
      } else {
        const prompt = prompts.get(c.prompt_id)
        if (!prompt) errors.push(`component "${name}": prompt "${c.prompt_id}" is not defined in prompts`)
        else {
          const vars = new Set((c.inputs || ['context:goal']).map(inputVar))
          const template = prompt.prompt_template || {}
          for (const v of [...placeholders(template.system), ...placeholders(template.user)]) {
            if (!vars.has(v)) errors.push(`component "${name}": placeholder "${v}" in prompt "${c.prompt_id}" has no input`)
          }
        }
      }
    }
    for (const item of c.toolset || []) {
      const tool = toolName(item)
      if (typeof item === 'object' && Object.keys(item).length !== 1) errors.push(`component "${name}": a toolset entry with options must name exactly one tool`)
      if (ideOnly.has(tool)) errors.push(`component "${name}": "${tool}" is IDE only`)
      else if (!webUi.has(tool) || !live.has(tool)) errors.push(`component "${name}": unknown tool "${tool}"`)
    }
    if (c.type === 'DeterministicStepComponent' && !c.tool_name) errors.push(`component "${name}": tool_name is required`)
  }
  for (const s of subagents) {
    const c = components.find((x) => x && x.name === s)
    if (!c) errors.push(`subagent "${s}" is not a component`)
    else if (!c.description) errors.push(`subagent "${s}" needs a description`)
  }

  // Routers and reachability.
  const isTarget = (t) => names.has(t) || BUILT_IN_TARGETS.has(t)
  const edges = new Map()
  for (const r of routers) {
    if (!names.has(r.from)) { errors.push(`router from "${r.from}" is not a component`); continue }
    const targets = r.condition ? Object.values(r.condition.routes || {}) : [r.to]
    if (r.condition && !r.condition.input) errors.push(`router from "${r.from}": condition needs an input`)
    if (r.condition && !Object.keys(r.condition.routes || {}).length) errors.push(`router from "${r.from}": condition needs routes`)
    for (const t of targets) if (!isTarget(t)) errors.push(`router target "${t}" is not a component, end or abort`)
    edges.set(r.from, [...(edges.get(r.from) || []), ...targets])
  }
  const entry = flow.flow && flow.flow.entry_point
  if (!names.has(entry)) errors.push(`flow.entry_point "${entry}" is not a component`)
  const seen = new Set()
  const visit = (n) => {
    if (seen.has(n) || !names.has(n)) return
    seen.add(n)
    const c = components.find((x) => x.name === n)
    for (const s of c.subagents || []) visit(s && s.name)
    for (const t of edges.get(n) || []) visit(t)
  }
  visit(entry)
  for (const n of names) {
    if (!seen.has(n)) errors.push(`component "${n}" is not reachable from the entry point`)
    if (!subagents.has(n) && !edges.has(n)) errors.push(`component "${n}" has no router`)
  }

  return { errors, flow }
}

const flowFiles = (dir) => fs.readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).sort().map((f) => path.join(dir, f))
const isDraft = (text) => DRAFT.test(text)

module.exports = { checkFlow, flowFiles, isDraft, writeTools, MAX_FLOW_BYTES }
