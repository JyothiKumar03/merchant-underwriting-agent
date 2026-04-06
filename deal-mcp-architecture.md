**GrabOn Project 06 – FINALIZED ARCHITECTURE BLUEPRINT**  
**Multi-Channel Deal Distribution MCP Server**  
**One-to-Many Merchant Rail**  

---

### 1. Project Goal (One-Sentence)
Build a **single Express + MCP server** that exposes **one tool** (`distribute_deal`). When Claude Desktop calls it via natural language, the server generates **54 localized strings** (18 variants × 3 languages) + runs **mock webhook simulation** with retry logic, then returns everything in one clean JSON response.

---

### 2. High-Level Architecture (Text Diagram)

```
Claude Desktop (Client)
     ↓ Natural language prompt
     ↓ JSON-RPC over HTTP
Your Single Express Server (localhost:8000)   ←←← EVERYTHING RUNS HERE
     ├── /mcp endpoint (MCP Layer – official SDK)
     │    └── Tool: distribute_deal(params)
     │           ├── 1× Claude API call (master prompt) → 54 strings
     │           └── simulateWebhooks() [6 mock channels + retry]
     ├── Optional CRUD routes (/api/deals, /health, etc.)
     └── Returns JSON { variants, localized, deliveryLogs, successRate }
```

**Visual Flow (exactly what happens at runtime)**

```
[User in Claude Desktop]
          ↓ types “Distribute Zomato 30% off deal”
Claude Desktop → calls distribute_deal(merchant_id, category, ...)
          ↓ JSON-RPC POST to http://localhost:8000/mcp
YOUR EXPRESS SERVER
   ├── MCP Server (official TS SDK)
   ├── Tool Handler:
   │    1. Build masterPrompt (3 styles × 6 channels × 3 langs)
   │    2. anthropic.messages.create() → ONE LLM CALL
   │    3. Parse JSON → 54 strings
   │    4. simulateWebhooks() → 6 mock functions + retry logic
   │    5. Calculate success rate
   └── Return full JSON to Claude Desktop
Claude Desktop → displays all 54 strings + delivery logs beautifully
```

**No external platforms are ever called.**  
**No real webhooks.**  
**Everything stays in your laptop except 1 LLM call.**

---

### 3. Tech Stack (Copy-Paste Ready)

```bash
Node.js 20+ / TypeScript
Express
@modelcontextprotocol/typescript-sdk          ← official MCP SDK
@anthropic-ai/sdk                            ← for copy generation
zod                                          ← for input/output schemas (optional but recommended)
dotenv                                       ← for ANTHROPIC_API_KEY
```

---

### 4. Folder Structure

```
grabon-mcp-deal-distributor/
├── src/
│   ├── index.ts                 ← main Express + MCP server
│   ├── mcp/
│   │   ├── server.ts            ← MCP server setup
│   │   ├── tools/
│   │   │   └── distributeDeal.ts ← THE ONLY TOOL
│   │   └── transport.ts         ← Streamable HTTP transport
│   ├── core/
│   │   ├── masterPrompt.ts      ← the big prompt template
│   │   ├── webhookSimulator.ts  ← 6 mock endpoints + retry
│   │   └── types.ts             ← DealParams, Output schemas
│   └── utils/
│       └── parseLLMResponse.ts
├── .env
├── tsconfig.json
├── package.json
└── README.md                    ← demo instructions
```

---

### 5. MCP Basics (Since You’ve Never Used It)

**Official Resources (bookmark these now):**
- Main site: https://modelcontextprotocol.io
- Quickstart: https://modelcontextprotocol.io/quickstart
- Specification (2025-11-25): https://modelcontextprotocol.io/specification/2025-11-25
- TypeScript SDK GitHub: https://github.com/modelcontextprotocol/typescript-sdk
- Server Guide: https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md

**Key Concepts You Need (30-second version):**
- MCP = JSON-RPC 2.0 over HTTP (or stdio).
- You build a **Server** that registers **Tools**.
- Claude Desktop connects to your `/mcp` endpoint → discovers your tool automatically.
- Claude calls your tool → your code runs → you return result → Claude shows it.
- We use **StreamableHTTPServerTransport** → works perfectly with Express.

---

### 6. Detailed Implementation Steps (Do in This Order)

**Day 1 – Setup + MCP Skeleton**
1. `npx create-express-typescript-app` or your usual boilerplate.
2. Install deps:
   ```bash
   npm install express @modelcontextprotocol/typescript-sdk @anthropic-ai/sdk zod dotenv
   npm install -D typescript tsx @types/express
   ```
3. Create the files exactly as in the folder structure above.
4. Get your Anthropic API key and put in `.env`.

**Day 2 – Core Logic**
- Implement `masterPrompt.ts` (one big prompt)
- Implement `distributeDeal.ts` (tool handler)
- Implement `webhookSimulator.ts`

**Day 3 – Polish + Demo**
- Connect to Claude Desktop
- Test 3 merchant deals
- Record demo

---

### 7. Exact Code Skeletons (Copy-Paste Ready)

#### 7.1 src/index.ts (Main Server)

```ts
import express from 'express';
import dotenv from 'dotenv';
import { MCP } from '@modelcontextprotocol/typescript-sdk';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/typescript-sdk/transport';
import { distributeDealTool } from './mcp/tools/distributeDeal';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;

// ──────────────────────────────
// 1. NORMAL CRUD (optional but nice)
app.get('/health', (req, res) => res.json({ status: 'ok', mcp: 'ready' }));

// ──────────────────────────────
// 2. MCP SERVER
const mcpServer = new MCP({
  name: "grabon-deal-distributor",
  version: "1.0.0",
  tools: [distributeDealTool],
});

const transport = new StreamableHTTPServerTransport();

mcpServer.connect(transport);

app.post('/mcp', async (req, res) => {
  await transport.handleRequest(req, res);
});

app.listen(PORT, () => {
  console.log(`🚀 GrabOn MCP Server running on http://localhost:${PORT}`);
  console.log(`   MCP endpoint → http://localhost:${PORT}/mcp`);
});
```

#### 7.2 src/mcp/tools/distributeDeal.ts (THE ONLY TOOL)

```ts
import { Tool } from '@modelcontextprotocol/typescript-sdk';
import { z } from 'zod';
import { anthropic } from '../..'; // your anthropic client
import { buildMasterPrompt } from '../../core/masterPrompt';
import { simulateWebhooks } from '../../core/webhookSimulator';
import { parseLLMResponse } from '../../utils/parseLLMResponse';

const DealParamsSchema = z.object({
  merchant_id: z.string(),
  category: z.string(),
  discount_value: z.number(),
  discount_type: z.enum(['percentage', 'fixed']),
  expiry_timestamp: z.string(),
  min_order_value: z.number().optional(),
  max_redemptions: z.number().optional(),
  exclusive_flag: z.boolean().optional(),
});

export const distributeDealTool: Tool = {
  name: "distribute_deal",
  description: "Distribute one merchant deal across 6 channels in 3 languages with A/B variants and webhook simulation",
  inputSchema: DealParamsSchema,
  handler: async (params) => {
    const validated = DealParamsSchema.parse(params);

    // 1. ONE LLM CALL
    const prompt = buildMasterPrompt(validated);
    const llmResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000,
      temperature: 0.75,
      system: "You are GrabOn's senior Indian-market copywriter...",
      messages: [{ role: "user", content: prompt }],
    });

    const generated = parseLLMResponse(llmResponse);

    // 2. WEBHOOK SIMULATION
    const deliveryLogs = await simulateWebhooks(generated);

    return {
      variants: generated.variants,
      localized: generated.localized,
      delivery_logs: deliveryLogs,
      success_rate: `${Math.round((deliveryLogs.filter(l => l.status === 'delivered').length / deliveryLogs.length) * 100)}%`,
      total_strings: 54,
    };
  },
};
```

#### 7.3 src/core/masterPrompt.ts (Critical – copy this exactly)

(Full prompt template is ~150 lines – I can give it in the next message if you say “give me the full master prompt”. It forces 3 distinct styles + culturally accurate Hindi/Telugu.)

#### 7.4 src/core/webhookSimulator.ts (6 mock channels + retry)

```ts
type Channel = 'email' | 'whatsapp' | 'push' | 'glance' | 'payu' | 'instagram';

const mockEndpoints: Record<Channel, (payload: any) => Promise<{status: 'delivered'|'failed'|'pending' }>> = {
  email: async () => ({ status: Math.random() > 0.1 ? 'delivered' : 'failed' }),
  whatsapp: async () => ({ status: 'delivered' }),
  // ... implement all 6
};

export async function simulateWebhooks(generated: any) {
  const logs = [];
  for (const channel of ['email','whatsapp','push','glance','payu','instagram'] as Channel[]) {
    let status = 'pending';
    let retries = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await mockEndpoints[channel](generated);
      status = result.status;
      if (status === 'delivered') break;
      retries++;
      await new Promise(r => setTimeout(r, 300 * (attempt + 1))); // exponential backoff
    }
    logs.push({ channel, status, retries });
  }
  return logs;
}
```

---

### 8. How to Connect to Claude Desktop

1. Open Claude Desktop.
2. Go to Settings → MCP Servers → Add local server.
3. Choose **URL transport**.
4. Paste: `http://localhost:8000/mcp`
5. Start your server → tool appears automatically.

---

### 9. Demo Script (What Evaluators Will Test)

Run server → open Claude Desktop → type:
- “Distribute the new Zomato 30% off deal for food category”
- “Distribute Swiggy 40% off grocery deal”
- “Distribute Myntra 50% off fashion deal”

Claude must return **all 54 strings + delivery logs + success rate**.

---


What we have - 
backend/src

1. ai-service which has the generic AI calling code, we just have to invoke it.
2. we have dedicated /tpyes (having all types), /data - having all static data
3. I'm pasting the static data with types, u properly organize them in the code!

```
// src/core/staticData.ts
export interface Merchant {
  merchant_id: string;
  name: string;
  logo_url: string;           // fake URL for demo
  primary_category: string;
  base_url: string;
}

export const MERCHANTS: Record<string, Merchant> = {
  "zomato-001": {
    merchant_id: "zomato-001",
    name: "Zomato",
    logo_url: "https://logo.clearbit.com/zomato.com",
    primary_category: "Food & Dining",
    base_url: "https://www.zomato.com",
  },
  "swiggy-001": {
    merchant_id: "swiggy-001",
    name: "Swiggy",
    logo_url: "https://logo.clearbit.com/swiggy.com",
    primary_category: "Food & Dining",
    base_url: "https://www.swiggy.com",
  },
  "myntra-001": {
    merchant_id: "myntra-001",
    name: "Myntra",
    logo_url: "https://logo.clearbit.com/myntra.com",
    primary_category: "Fashion & Lifestyle",
    base_url: "https://www.myntra.com",
  },
  "blinkit-001": {
    merchant_id: "blinkit-001",
    name: "Blinkit",
    logo_url: "https://logo.clearbit.com/blinkit.com",
    primary_category: "Grocery & Instant Delivery",
    base_url: "https://www.blinkit.com",
  },
};

// 3 FULL SAMPLE DEALS — ready to copy-paste into demo or test
export const SAMPLE_DEALS = [
  {
    // Deal 1 — Zomato (realistic April 2026 offer)
    merchant_id: "zomato-001",
    category: "Food & Dining",
    discount_value: 40,
    discount_type: "percentage" as const,
    expiry_timestamp: "2026-04-15T23:59:59Z",
    min_order_value: 349,
    max_redemptions: 5000,
    exclusive_flag: true,
  },
  {
    // Deal 2 — Swiggy
    merchant_id: "swiggy-001",
    category: "Food & Dining",
    discount_value: 50,
    discount_type: "percentage" as const,
    expiry_timestamp: "2026-04-20T23:59:59Z",
    min_order_value: 199,
    max_redemptions: 10000,
    exclusive_flag: false,
  },
  {
    // Deal 3 — Myntra
    merchant_id: "myntra-001",
    category: "Fashion & Lifestyle",
    discount_value: 60,
    discount_type: "percentage" as const,
    expiry_timestamp: "2026-04-12T23:59:59Z",
    min_order_value: 999,
    max_redemptions: 2500,
    exclusive_flag: true,
  },
] as const;

// Helper function — put this in the same file
export function getMerchant(merchant_id: string): Merchant | null {
  return MERCHANTS[merchant_id] || null;
}

// Inside handler: async (params) - Update distribute-deal.ts (add these 2 lines inside the handler)
const validated = DealParamsSchema.parse(params);
const merchant = getMerchant(validated.merchant_id);

const enrichedParams = {
  ...validated,
  merchant_name: merchant?.name || "Merchant",
  merchant_category: merchant?.primary_category || validated.category,
  merchant_logo: merchant?.logo_url,
};