# Deal Distribution MCP — Architecture

## Table of Contents

1. [What This Is](#what-this-is)
2. [Architecture](#architecture)
3. [How It Works](#how-it-works)
   - [The only tool: distribute_deal](#the-only-tool-distribute_deal)
   - [How copy generation works](#how-copy-generation-works)
   - [How webhook simulation works](#how-webhook-simulation-works)
4. [Folder Structure](#folder-structure)
5. [Setup](#setup)
   - [Connect to Claude Desktop](#connect-to-claude-desktop)
6. [Demo Script](#demo-script)

---

## What This Is

GrabOn needs to push a merchant deal across 6 different channels — email, WhatsApp, push, Glance, PayU, Instagram — in 3 languages — English, Hindi, Telugu — with 3 copy styles per channel. That's 54 strings per deal. Writing them manually is a non-starter. This system exposes a single MCP tool (`distribute_deal`) that Claude Desktop calls. One tool call → one LLM prompt → 54 localized, channel-optimized strings + a full webhook delivery simulation with retry logic. Claude returns everything in one clean JSON.

---

## Architecture

```
Claude Desktop (you, typing in natural language)
        |
        |  "Distribute the Zomato 40% off deal"
        |
        ▼
  JSON-RPC POST → http://localhost:8000/mcp
        |
        ▼
  Express + MCP Server (localhost:8000)
        |
        ├──  /mcp  →  McpServer (official SDK)
        │         └── Tool: distribute_deal(params)
        │                  |
        │                  ├── 1. Enrich with merchant metadata (DEAL_MERCHANTS lookup)
        │                  ├── 2. build_master_prompt() → one big prompt
        │                  ├── 3. ONE LLM call → 54 strings (3 langs × 3 styles × 6 channels)
        │                  └── 4. simulate_webhooks() → 6 channels concurrently + retry
        │
        ├──  /health  →  { status: "ok" }
        └──  /api/*   →  existing underwriting routes (untouched)
```

**Nothing external is called except one LLM API hit.** No real webhooks. No third-party channel APIs. Everything runs on your laptop.

---

## How It Works

### The only tool: distribute_deal

`distribute_deal` is registered on the MCP server via `server.tool()`. Claude Desktop discovers it automatically once the server is running. When Claude calls it, the handler does four things in order, always.

**Input the tool accepts:**

| Field | Type | Required | What it is |
|---|---|---|---|
| `merchant_id` | string | yes | e.g. `"zomato-001"` — looked up in `DEAL_MERCHANTS` |
| `category` | string | yes | e.g. `"Food & Dining"` |
| `discount_value` | number | yes | numeric — `40` for 40% or ₹40 |
| `discount_type` | `"percentage"` \| `"fixed"` | yes | determines how the label is formatted |
| `expiry_timestamp` | string | yes | ISO 8601, e.g. `"2026-04-15T23:59:59Z"` |
| `min_order_value` | number | no | minimum cart value in ₹ |
| `max_redemptions` | number | no | redemption cap |
| `exclusive_flag` | boolean | no | `true` if GrabOn-exclusive |

**Step 1 — Merchant enrichment.** `get_deal_merchant(merchant_id)` pulls the name, category, and logo from the in-memory `DEAL_MERCHANTS` map. If the ID isn't found, it falls back to the raw params. No DB call, no network.

**Step 2 — Prompt construction.** `build_master_prompt()` takes the enriched params and builds a single structured prompt. It handles formatting — `40% OFF` vs `₹40 OFF`, Indian date format for expiry, optional clauses for min order / redemption cap / exclusive flag — and then lays out the full 54-string task with per-channel character limits, style definitions, and language rules.

**Step 3 — One LLM call.** `generate_object()` from `ai-service` fires the prompt against the model with `ZDealCopyOutput` as the output schema. Zod validates the response. The schema enforces `english | hindi | telugu` → `urgency_driven | value_driven | social_proof_driven` → `email | whatsapp | push | glance | payu | instagram`. If the LLM returns something malformed, Zod throws and the tool surfaces the error cleanly.

**Step 4 — Webhook simulation.** `simulate_webhooks()` runs all 6 channel simulations concurrently via `Promise.all`. Each channel has a realistic success probability and base latency. Failed channels retry up to 3 times with exponential backoff (300ms, 600ms). The result is a `TWebhookLog[]` with `channel`, `status`, `retries`, and `latency_ms` per entry.

The final return is a single JSON blob: merchant name, deal summary, all 54 variants, delivery logs, success rate, and a timestamp.

---

### How copy generation works

The master prompt instructs the LLM to write for **psychological mechanism**, not just tone.

- **urgency_driven** — loss aversion, scarcity signals, expiry pressure. Makes the user feel they'll regret not acting now.
- **value_driven** — rational framing, savings math, "you're getting X for less". Speaks to the user who compares options.
- **social_proof_driven** — crowd as persuader. "Thousands grabbed this", "most popular deal today". Implies smart people are already on it.

Each style is applied across 6 channels, and each channel has a distinct context and hard character limit:

| Channel | Limit | Context |
|---|---|---|
| email | 60 chars | Inbox subject line competing with dozens of others |
| whatsapp | 120 chars | Personal message — warm, like a tip from a friend |
| push | 50 chars | Interruption — one punchy line to earn a tap |
| glance | 40 chars | Lock screen widget, zero context, must be instantly readable |
| payu | 55 chars | User is on the payment page, card in hand — reinforce the deal |
| instagram | 150 chars | Caption paired with a visual, 2–4 hashtags, soft CTA |

Languages: English (Indian — ₹, natural contractions), Hindi (pure Devanagari, no Roman transliteration), Telugu (pure Telugu script, urban Andhra/Telangana register).

All 54 strings must be unique. Every string must mention the merchant name and discount value. Character limits are hard limits.

---

### How webhook simulation works

`simulate_webhooks()` runs all 6 channels in parallel. Each channel gets its own success probability and base latency (with ±80ms jitter). A failed attempt retries twice more with exponential backoff before giving up.

| Channel | Success rate | Base latency |
|---|---|---|
| whatsapp | 98% | 110ms |
| email | 95% | 220ms |
| payu | 92% | 95ms |
| instagram | 88% | 200ms |
| push | 85% | 180ms |
| glance | 80% | 150ms |

No real network calls happen. It's all `setTimeout` + `Math.random`. The point is to get realistic-looking delivery logs with retry counts and latencies in the response.

---

## Folder Structure

This lives inside the existing `backend/src` — no new top-level folder needed.

```
backend/src/
├── index.ts                         ← starts the Express server + DB migrations
├── app.ts                           ← Express app setup
├── mcp/
│   ├── server.ts                    ← McpServer setup, tool registration
│   └── tools/
│       └── distribute-deal.ts       ← the only MCP tool
├── services/
│   ├── ai-service.ts                ← generic LLM call wrapper (existing)
│   ├── twilio-service.ts            ← WhatsApp sending (existing, untouched)
│   └── webhook-simulator.ts         ← 6 mock channels + retry logic
├── data/
│   ├── deal-merchants.ts            ← DEAL_MERCHANTS map + get_deal_merchant()
│   ├── category-benchmarks.ts       ← (existing underwriting data)
│   └── merchants.ts                 ← (existing underwriting data)
├── utils/
│   ├── master-prompt.ts             ← build_master_prompt() — the 54-string prompt
│   ├── ai-prompts.ts                ← (existing underwriting prompts)
│   ├── scoring-engine.ts            ← (existing)
│   ├── offer-calculator.ts          ← (existing)
│   └── llm-logger.ts                ← (existing)
├── types/
│   ├── deal-types.ts                ← TDealParams, TDealCopyOutput, TWebhookLog, etc.
│   └── index.ts                     ← (existing underwriting types)
├── constants/
│   ├── env.ts
│   └── index.ts
├── controllers/                     ← (existing underwriting controllers, untouched)
├── models/                          ← DB schema + migrations (existing, untouched)
└── routes/                          ← (existing underwriting routes, untouched)
```

The MCP server is mounted on top of the existing Express app. The underwriting routes are untouched.

---

## Setup

The deal distributor runs on the same backend server — no separate process.

```bash
cd backend
cp .env.example .env
```

The `.env` needs at minimum:

```
OPENAI_API_KEY=        ← used for the 54-string generation call
ANTHROPIC_API_KEY=     ← fallback / underwriting rationale
DB_URL=
PORT=8000
```

Install and start:

```bash
bun install
bun dev
```

Server starts on port 8000. MCP endpoint is at `http://localhost:8000/mcp`. The `/health` route returns `{ status: "ok" }` if everything is up.

### Connect to Claude Desktop

1. Open Claude Desktop.
2. Go to **Settings → MCP Servers → Add local server**.
3. Select **URL transport**.
4. Paste: `http://localhost:8000/mcp`
5. Start the backend — `distribute_deal` appears automatically in Claude's tool list.

---

## Demo Script

Start the server, open Claude Desktop, then type any of these:

```
Distribute the Zomato 40% off deal for food category, min order ₹349, expires April 15
Distribute Swiggy 50% off grocery deal, 10000 max redemptions
Distribute Myntra 60% off fashion deal, exclusive GrabOn offer
```

Claude calls `distribute_deal`, the handler runs, and you get back all 54 strings across 3 languages + delivery logs for all 6 channels with retry counts and latencies + a final success rate.

The 4 merchants wired up out of the box: `zomato-001`, `swiggy-001`, `myntra-001`, `blinkit-001`. Pass any other `merchant_id` and it falls back gracefully using the raw params.
