# Polymarket DVM MCP Server

A Model Context Protocol (MCP) server that interfaces with the Polymarket Data Verification Mechanism (DVM) via Nostr. This server allows AI agents to search for prediction markets and obtain detailed AI summaries.

## Features

- **Search Markets**: Search for prediction markets on Polymarket using keywords.
- **AI Summary**: Get deep market analysis and AI-generated summaries for specific markets using their numerical IDs.
- **Payment Handling**: Seamlessly handles Nostr DVM feedback (Kind 7000), providing lightning invoices when payment is required for searches or summaries.
- **NDK Integration**: Uses the Nostr Dev Kit (NDK) for robust Nostr communication.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository and navigate to the project directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

The server can be configured via environment variables:

- `NOSTR_NSEC`: (Optional) Your Nostr private key in `nsec` format. If not provided, a random identity will be generated for each session.

## Usage

### Running the Server

Start the server using `ts-node`:
```bash
npm start
```

Or run the compiled JavaScript (after building):
```bash
npm run serve
```

### MCP Tools

The server exposes the following tools to MCP clients (like Claude Desktop):

1. **`search_polymarket`**
   - **Description**: Search for prediction markets. Returns markets with their questions and IDs.
   - **Arguments**: `query` (string)
   - **Note**: May return a lightning invoice during high utilization.

2. **`get_market`**
   - **Description**: Get a detailed AI summary for a specific market.
   - **Arguments**: `marketId` (string, the numerical ID from search results)
   - **Note**: Usually requires payment via lightning invoice.

## Deployment with Docker

You can run the MCP server using Docker:

1. Build the image:
   ```bash
   docker build -t polymarket-dvm-mcp .
   ```
2. Run the container:
   ```bash
   docker run -i -e NOSTR_NSEC=your_nsec_here polymarket-dvm-mcp
   ```

## Security Note

Your `nsec` is sensitive information. Never commit it to version control. Use environment variables to pass it safely to the application.
