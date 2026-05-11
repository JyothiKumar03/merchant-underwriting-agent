import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  distribute_deal_input_shape,
  distribute_deal_handler,
} from "./tools/distribute-deal.js";

export const create_mcp_server = (): McpServer => {
  const server = new McpServer({
    name: "grabon-deal-distributor",
    version: "1.0.0",
  });

  server.tool(
    "distribute_deal",
    "Distribute one merchant deal across 6 channels (email, WhatsApp, push, Glance, PayU, Instagram) in 3 languages (English, Hindi, Telugu) with 3 copy styles (formal, casual, urgent) — generating 54 localized strings and simulating webhook delivery with retry logic.",
    distribute_deal_input_shape,
    async (params) => {
      try {
        return await distribute_deal_handler(params as Record<string, unknown>);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: message }),
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server;
};
