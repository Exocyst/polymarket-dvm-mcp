# Polymarket DVM MCP Server

A Model Context Protocol (MCP) server that interfaces with the Polymarket Data Verification Mechanism (DVM) via Nostr. This server allows AI agents to search for prediction markets and obtain detailed AI summaries.

## Getting Started (Quick Start)

The easiest way to use this server is via `npx`. You do not need to install anything globally.

### 1. Configure Environment

Create a `.env` file in your current directory (or where you run the server) and add your Nostr private key:

```env
NOSTR_NSEC=nsec1...
```

> [!TIP]
> If you don't provide a `NOSTR_NSEC`, the server will generate a random, ephemeral identity for the session.

### 2. Run with npx

To run the server directly:

```bash
npx polymarket-dvm-mcp
```

### 3. Using with Claude Desktop

To add this server to Claude Desktop, update your `claude_desktop_config.json`:

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

> [!NOTE]
> For Claude Desktop, it's often easier to define the `env` block directly in the config as shown above, but the server will also check for a `.env` file in its execution context.

## MCP Tools

The server provides tools for searching and analyzing prediction markets:

1.  **`search_polymarket`**: Search for active markets on Polymarket.
2.  **`get_market`**: Obtain a deep AI analysis for a specific market.

## Alternative Options

### Docker

```bash
docker build -t polymarket-dvm-mcp .
docker run -i --env-file .env polymarket-dvm-mcp
```

### Manual Build

```bash
git clone https://github.com/yourusername/polymarket-dvm-mcp.git
cd polymarket-dvm-mcp
npm install
npm run build
npm start
```

## Security

Your `nsec` is a private key. Handle it with the same care as a password or API secret. Using a `.env` file (and ensuring it's in your `.gitignore`) is the recommended way to manage this.
