# Polymarket DVM MCP Server

A Model Context Protocol (MCP) server that interfaces with the Polymarket Data Verification Mechanism (DVM) via Nostr. This server allows AI agents to search for prediction markets and obtain detailed AI summaries.

## Getting Started (Quick Start)

The easiest way to use this server is via `npx`. You do not need to install anything globally.

### Direct Execution

To run the server directly from your terminal:

```bash
# Set your Nostr private key (optional, will generate random if missing)
export NOSTR_NSEC=nsec1...

# Execute with npx
npx polymarket-dvm-mcp
```

### Using with Claude Desktop

To add this server to Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "polymarket": {
      "command": "npx",
      "args": ["-y", "polymarket-dvm-mcp"],
      "env": {
        "NOSTR_NSEC": "your_nsec_here"
      }
    }
  }
}
```

## Configuration

The server is configured via environment variables:

- `NOSTR_NSEC`: (Optional) Your Nostr private key in `nsec` format. Used for signing Nostr events. If omitted, the server will generate an ephemeral identity for the session.

## MCP Tools

The server provides tools for searching and analyzing prediction markets:

1.  **`search_polymarket`**: Search for active markets on Polymarket.
    - Argument: `query` (e.g., "Will Bitcoin hit $100k in 2025?")
2.  **`get_market`**: Obtain a deep AI analysis for a specific market.
    - Argument: `marketId` (The numerical ID returned from search results)

> [!NOTE]
> Some requests may return a Lightning Invoice if the DVM requires payment for the analysis due to high utilization.

## Alternative Installation

### Docker

```bash
docker build -t polymarket-dvm-mcp .
docker run -i -e NOSTR_NSEC=your_nsec_here polymarket-dvm-mcp
```

### Manual Build (From Source)

```bash
git clone https://github.com/yourusername/polymarket-dvm-mcp.git
cd polymarket-dvm-mcp
npm install
npm run build
npm start
```

## Security

Your `nsec` is a private key. Handle it with the same care as a password or API secret. For most use cases, leaving it blank and using an ephemeral key (default) is recommended.
