import express from "express";
import router from "./routes/index.js";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { create_mcp_server } from "./mcp/server.js";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api/v1", router);

// MCP endpoint — stateless mode: new server + transport per request
app.post("/mcp", async (req, res) => {
  const server = create_mcp_server();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("finish", () => server.close());
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "MCP internal error" });
    }
  }
});

// MCP health probe — Claude Desktop uses GET to check availability
app.get("/mcp", (_req, res) => {
  res.json({ status: "ok", server: "grabon-deal-distributor", version: "1.0.0" });
});

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Merchant Underwriting API" });
});

export default app;
