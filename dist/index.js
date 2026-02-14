import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { NostrClient } from "./ndk.js";
import { NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
const server = new Server({
    name: "polymarket-dvm-mcp",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});
const nsec = process.env.NOSTR_NSEC;
const signer = nsec ? new NDKPrivateKeySigner(nsec) : undefined;
const nostrClient = new NostrClient(signer);
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "search_polymarket",
                description: "Search for prediction markets on Polymarket. Returns a list of markets with their questions, descriptions, and numerical 'id' values. Use these numerical IDs to call 'get_market' for detailed analysis. Note: May return a JSON object with a lightning invoice if payment is required due to high utilization.",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search term or question to search for (e.g., 'Will Bitcoin hit $100k?').",
                        },
                    },
                    required: ["query"],
                },
            },
            {
                name: "get_market",
                description: "Get a detailed AI summary and deep market analysis for a specific Polymarket event. Requires a numerical market 'id' obtained from 'search_polymarket'. If the DVM requires payment for the AI summary, this tool will return a lightning invoice to be paid before the summary is provided.",
                inputSchema: {
                    type: "object",
                    properties: {
                        marketId: {
                            type: "string",
                            description: "The numerical market ID from search results (e.g., '956590').",
                        },
                    },
                    required: ["marketId"],
                },
            },
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        await nostrClient.connect();
        if (name === "search_polymarket") {
            const query = String(args?.query);
            const result = await nostrClient.requestSearch(query);
            if ("status" in result && result.status === "payment-required") {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Payment required to perform this search due to high utilization.\n\nAmount: ${result.amount}\nInvoice: ${result.invoice}\n\nPlease pay the invoice and call this tool again once paid.`,
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        if (name === "get_market") {
            const marketId = String(args?.marketId);
            const result = await nostrClient.requestSummary(marketId);
            if ("status" in result && result.status === "payment-required") {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Payment required to access this summary.\n\nAmount: ${result.amount}\nInvoice: ${result.invoice}\n\nPlease pay the invoice and call this tool again once paid.`,
                        },
                    ],
                };
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        throw new Error(`Unknown tool: ${name}`);
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Polymarket DVM MCP server running on stdio");
}
main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
