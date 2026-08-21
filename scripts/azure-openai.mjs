/**
 * Azure OpenAI chat-completions client — the ONE place the model credential is
 * used, shared by every model-driven check (004; migrated off the Anthropic API).
 *
 * Plain fetch rather than an SDK: the calls are three POST shapes (text, JSON
 * schema, vision), the runtime ships fetch, and Principle VII asks a dependency
 * to earn itself. This module is why `@anthropic-ai/sdk` could be removed.
 *
 * Configuration comes from the environment:
 *   AZURE_OPENAI_API_KEY      the credential (repository secret — never a var)
 *   AZURE_OPENAI_ENDPOINT     resource base URL, or the full deployment URL
 *   AZURE_OPENAI_DEPLOYMENT   deployment name       (default: gpt-5.1-chat)
 *   AZURE_OPENAI_API_VERSION  api-version parameter (default: 2025-04-01-preview)
 *
 * Azure caches long identical prompt prefixes automatically and reports the
 * effect in `prompt_tokens_details.cached_tokens`. logUsage() surfaces that
 * number because a silently cold cache is invisible everywhere else: nothing
 * fails, no output changes, the bill just goes up (FR-037).
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'

export const hasCredential = () => Boolean(process.env.AZURE_OPENAI_API_KEY)

function endpointUrl() {
  const raw = (process.env.AZURE_OPENAI_ENDPOINT ?? '').replace(/\/+$/, '')
  if (!raw) {
    throw new Error(
      'AZURE_OPENAI_ENDPOINT is not set. Expected the resource base URL ' +
        '(https://<resource>.cognitiveservices.azure.com) or the full deployment URL.',
    )
  }
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.1-chat'
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2025-04-01-preview'
  // Accept either the bare resource or a URL that already names the deployment.
  const base = raw.includes('/openai/deployments/') ? raw : `${raw}/openai/deployments/${deployment}`
  return `${base}/chat/completions?api-version=${apiVersion}`
}

/** Cumulative usage across every call this process makes. */
export const usage = { calls: 0, prompt_tokens: 0, completion_tokens: 0, cached_tokens: 0 }

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

/**
 * One chat completion. `messages` is the raw chat-completions array; pass a
 * JSON Schema as `schema` for a structured reply (returned parsed as `json`).
 * Retries 429/5xx with the server's retry-after when it names one.
 */
export async function chat(messages, { maxTokens = 4096, schema, schemaName = 'result', retries = 5 } = {}) {
  if (!hasCredential()) throw new Error('AZURE_OPENAI_API_KEY is not set.')

  const body = { messages, max_completion_tokens: maxTokens }
  if (schema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: schemaName, strict: true, schema },
    }
  }

  let res
  /* oxlint-disable no-await-in-loop -- retry backoff is sequential by definition */
  for (let attempt = 0; ; attempt++) {
    res = await fetch(endpointUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.AZURE_OPENAI_API_KEY },
      body: JSON.stringify(body),
    })
    if ((res.status === 429 || res.status >= 500) && attempt < retries) {
      const hinted = Number(res.headers.get('retry-after') ?? '') * 1000
      const wait = Number.isFinite(hinted) && hinted > 0 ? hinted : Math.min(60_000, 2 ** attempt * 1000)
      console.log(`  Azure OpenAI ${res.status} — retrying in ${Math.round(wait / 1000)}s (attempt ${attempt + 1}/${retries})`)
      await sleep(wait)
      continue
    }
    break
  }
  /* oxlint-enable no-await-in-loop */

  if (!res.ok) {
    throw new Error(`Azure OpenAI returned ${res.status}: ${(await res.text()).slice(0, 2000)}`)
  }

  const data = await res.json()
  const choice = data.choices?.[0]
  usage.calls += 1
  usage.prompt_tokens += Number(data.usage?.prompt_tokens ?? 0)
  usage.completion_tokens += Number(data.usage?.completion_tokens ?? 0)
  usage.cached_tokens += Number(data.usage?.prompt_tokens_details?.cached_tokens ?? 0)

  if (choice?.finish_reason === 'content_filter') {
    throw new Error('Azure OpenAI ended the reply with finish_reason=content_filter.')
  }
  if (choice?.message?.refusal) {
    throw new Error(`Azure OpenAI refused: ${choice.message.refusal}`)
  }
  if (choice?.finish_reason === 'length') {
    console.log(`  ⚠ reply hit max_completion_tokens (${maxTokens}) — it may be cut off.`)
  }

  const text = choice?.message?.content ?? ''
  if (!schema) return { text }
  try {
    return { text, json: JSON.parse(text) }
  } catch {
    // Structured output should make this unreachable; salvage a JSON object
    // from the text rather than losing the verdict to a formatting slip.
    const salvaged = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
    return { text, json: JSON.parse(salvaged) }
  }
}

/** A vision content part from a PNG on disk. */
export const imagePart = (path) => ({
  type: 'image_url',
  image_url: { url: `data:image/png;base64,${readFileSync(path).toString('base64')}` },
})

/**
 * The per-run usage record (FR-037/FR-039): written to the job summary in CI,
 * to stdout everywhere, and — structured — to `model-usage.json` so the
 * overall results report (report.yml) can show every AI run's outcome and
 * cost. `outcome` is one line saying what the run concluded or produced.
 *
 * `cached prompt` is the number to watch — the prompts lead with a large
 * stable prefix (constitution, contracts, rubric), so repeat runs should read
 * most of it back from Azure's prompt cache. A zero there across repeated
 * runs means the prefix has stopped matching and every run is paying full
 * price, and nothing else will tell you.
 */
export function logUsage(job, outcome = '') {
  const records = existsSync('model-usage.json') ? JSON.parse(readFileSync('model-usage.json', 'utf8')) : []
  records.push({
    job,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5.1-chat',
    outcome,
    calls: usage.calls,
    prompt_tokens: usage.prompt_tokens,
    completion_tokens: usage.completion_tokens,
    cached_tokens: usage.cached_tokens,
    at: new Date().toISOString(),
  })
  writeFileSync('model-usage.json', JSON.stringify(records, null, 2) + '\n')
  const lines = [
    `### Model usage — \`${job}\``,
    '',
    ...(outcome ? [`> ${outcome}`, ''] : []),
    '| calls | prompt | completion | cached prompt |',
    '| ----- | ------ | ---------- | ------------- |',
    `| ${usage.calls} | ${usage.prompt_tokens} | ${usage.completion_tokens} | ${usage.cached_tokens} |`,
    '',
    usage.cached_tokens === 0
      ? '> **No cached prompt tokens.** Expected on the first run of a changed prompt; if it stays zero across repeated runs, something volatile has drifted ahead of the stable prefix (FR-037).'
      : `> Cache covered ${Math.round((usage.cached_tokens / Math.max(1, usage.prompt_tokens)) * 100)}% of prompt tokens.`,
    '',
  ]
  console.log(lines.join('\n'))
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
  }
}
