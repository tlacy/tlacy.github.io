# Tom Lacy MCP Server

Model Context Protocol (MCP) server that exposes Tom Lacy's professional context, career data, and site content to AI assistants.

## Overview

This MCP server provides structured access to:
- **Career history** with detailed achievements and metrics
- **Professional expertise** across scaling, M&A, operations, and leadership
- **Resume content** and bio variations
- **Site content** (passions, photos, contact info)
- **Quantifiable metrics** from 20+ years of leadership

## Features

### Resources

The server exposes these resources that AI assistants can read:

1. **`tomlacy://career/summary`** - Executive summary and core expertise
2. **`tomlacy://career/full`** - Complete career history (markdown)
3. **`tomlacy://site/content`** - Current website content (JSON)
4. **`tomlacy://expertise/areas`** - Categorized expertise with achievements
5. **`tomlacy://metrics/all`** - Quantifiable achievements and metrics

### Tools

The server provides these tools for AI assistants:

1. **`query-career`** - Search career history by keyword, company, or technology
   - Example: `query-career({ query: "M&A" })`
   - Example: `query-career({ query: "Quorum" })`

2. **`generate-bio`** - Generate bio variations for different contexts
   - Contexts: `linkedin-headline`, `executive-summary`, `results-focused`, `leadership-focused`, `business-impact`, `current`
   - Example: `generate-bio({ context: "linkedin-headline" })`

3. **`extract-metrics`** - Extract quantifiable achievements, optionally filtered by category
   - Categories: `Team Growth`, `Cost`, `Revenue`, `Customer`, `M&A`, `Performance`
   - Example: `extract-metrics({ category: "Team Growth" })`

## Installation

```bash
cd mcp-server
npm install
```

## Usage

### Running Locally

```bash
npm start
```

The server runs on stdio (standard input/output) for communication with MCP clients.

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Connecting from Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "tomlacy": {
      "command": "node",
      "args": ["/Users/tom.lacy/Desktop/VS Code Projects/tomlacy.net/tlacy.github.io/mcp-server/index.js"]
    }
  }
}
```

Then restart Claude Desktop. The server will appear in the MCP menu.

### Connecting from Other MCP Clients

Any MCP-compatible client can connect using stdio transport:

```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['path/to/mcp-server/index.js']
});

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
});

await client.connect(transport);
```

## Example Queries

Once connected, an AI assistant can:

1. **Read your career summary:**
   ```
   Read resource tomlacy://career/summary
   ```

2. **Search for specific achievements:**
   ```
   Use tool query-career with query: "team scaling"
   ```

3. **Generate a LinkedIn headline:**
   ```
   Use tool generate-bio with context: "linkedin-headline"
   ```

4. **Extract all metrics:**
   ```
   Use tool extract-metrics
   ```

5. **Filter metrics by category:**
   ```
   Use tool extract-metrics with category: "Revenue"
   ```

## Architecture

```
┌─────────────────┐
│  AI Assistant   │
│ (Claude, etc.)  │
└────────┬────────┘
         │ MCP Protocol (stdio)
         │
┌────────▼────────┐
│   MCP Server    │
│   (Node.js)     │
└────────┬────────┘
         │ File System
         │
┌────────▼────────┐
│  Content Files  │
│ - content.json  │
│ - career.md     │
└─────────────────┘
```

## Content Sources

The server reads from these files in the parent directory:

- **`content.json`** - Site content (bio, passions, social links)
- **`career.md`** - Full career history and achievements

Updates to these files are automatically reflected in the MCP server.

## Security

- **Local only:** This server runs locally on your machine via stdio
- **No network exposure:** No HTTP server, no open ports
- **Read-only:** The server only reads content files, never modifies them
- **No authentication needed:** Communication is local via stdio transport

## Deployment Options

### Option 1: Local MCP Server (Current)
- ✅ Simple, secure, no deployment needed
- ✅ Works with Claude Desktop and other MCP clients
- ❌ Only available on your local machine

### Option 2: Serverless Deployment (Future)
If you want to make this available remotely, you could deploy to:
- **Cloudflare Workers** - Modify to use HTTP transport
- **Vercel Functions** - Add HTTP endpoints
- **AWS Lambda** - Wrap in API Gateway

This would require adding authentication and switching from stdio to HTTP transport.

## Troubleshooting

**Server not appearing in Claude Desktop:**
- Check the config file path is correct
- Verify Node.js path in config (use `which node` to find it)
- Check Claude Desktop logs: `~/Library/Logs/Claude/mcp*.log`

**Resource not found errors:**
- Ensure `content.json` and `career.md` exist in the parent directory
- Check file permissions are readable

**Tool execution errors:**
- Check the server logs (stderr output)
- Verify the tool arguments match the schema

## License

MIT

## Author

Tom Lacy - CTO and Technology Executive
