# Using the Tom Lacy MCP Server with Claude Desktop

This guide shows you how to connect your MCP server to Claude Desktop so that Claude can access your professional context, career data, and metrics.

## Prerequisites

- **Node.js 18+** installed (check with `node --version`)
- **Claude Desktop** installed (download from [claude.ai](https://claude.ai/download))
- MCP server dependencies installed (`cd mcp-server && npm install`)

## Step 1: Locate Claude Desktop Config

On macOS, the config file is at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

On Windows, it's at:
```
%APPDATA%\Claude\claude_desktop_config.json
```

## Step 2: Edit the Config File

Open the config file in a text editor. If it doesn't exist, create it with this content:

```json
{
  "mcpServers": {
    "tomlacy": {
      "command": "node",
      "args": [
        "/Users/tom.lacy/Desktop/VS Code Projects/tomlacy.net/tlacy.github.io/mcp-server/index.js"
      ]
    }
  }
}
```

**Important:** Update the path in `args` to match your actual repository location.

If you already have other MCP servers configured, just add the `tomlacy` entry to the existing `mcpServers` object.

## Step 3: Restart Claude Desktop

Completely quit and restart Claude Desktop for the changes to take effect.

## Step 4: Verify Connection

In a new conversation with Claude, you should see:
- A 🔌 icon in the bottom corner showing connected MCP servers
- "tomlacy" in the list of connected servers

## Step 5: Test It Out

Try these prompts with Claude:

### Example 1: Read Career Summary
```
Can you read my career summary from the tomlacy MCP server?
```

Claude will use the `tomlacy://career/summary` resource.

### Example 2: Search Career History
```
Search my career for "M&A" achievements
```

Claude will use the `query-career` tool.

### Example 3: Generate Bio Variations
```
Generate a LinkedIn headline for me
```

Claude will use the `generate-bio` tool with context `linkedin-headline`.

### Example 4: Extract Metrics
```
Show me all my team growth metrics
```

Claude will use the `extract-metrics` tool with category filter.

### Example 5: Full Career Context
```
Read my full career history and help me create a compelling executive bio for a board presentation
```

Claude will use the `tomlacy://career/full` resource and generate content based on your complete career data.

## Available Resources

Claude can read these resources from your MCP server:

| Resource URI | Description |
|-------------|-------------|
| `tomlacy://career/summary` | Executive summary and core expertise |
| `tomlacy://career/full` | Complete career history with detailed achievements |
| `tomlacy://site/content` | Current website content (bio, passions, social links) |
| `tomlacy://expertise/areas` | Categorized expertise with specific achievements |
| `tomlacy://metrics/all` | All quantifiable achievements and metrics |

## Available Tools

Claude can use these tools:

### query-career
Search your career history by keyword, company name, or technology.

**Example prompts:**
- "Search my career for AI achievements"
- "Find mentions of Quorum in my career"
- "Show me references to team scaling"

### generate-bio
Generate bio variations for different contexts.

**Contexts available:**
- `linkedin-headline` - Short LinkedIn headline
- `executive-summary` - Comprehensive executive summary
- `results-focused` - Emphasis on measurable outcomes
- `leadership-focused` - Emphasis on team building and culture
- `business-impact` - Emphasis on EBITDA and business value
- `current` - Your current bio from content.json

**Example prompts:**
- "Generate a results-focused bio"
- "Create a leadership-focused bio for my website"
- "What's my current bio?"

### extract-metrics
Extract quantifiable achievements, optionally filtered by category.

**Categories available:**
- Team Growth
- Engagement
- Retention
- Revenue
- Cost
- Customer
- M&A
- Performance

**Example prompts:**
- "Extract all my metrics"
- "Show me revenue and cost metrics"
- "What are my customer satisfaction achievements?"

## Troubleshooting

### MCP Server Not Appearing

1. **Check the config file path:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Verify Node.js path:**
   ```bash
   which node
   ```
   Update the `command` field if it's not `node` (might be a full path like `/usr/local/bin/node`).

3. **Check Claude Desktop logs:**
   ```bash
   tail -f ~/Library/Logs/Claude/mcp*.log
   ```

4. **Test the server manually:**
   ```bash
   cd mcp-server
   npm test
   ```

### Resource Not Found Errors

Make sure `content.json` and `career.md` exist in the parent directory:
```bash
ls -la ../content.json ../career.md
```

### Permission Errors

Ensure the MCP server files are readable:
```bash
chmod +r index.js
```

## Advanced: Custom Prompts

You can create custom prompts that leverage multiple resources and tools:

**Example: Complete Career Package**
```
Using the tomlacy MCP server:
1. Read my full career history
2. Extract all metrics
3. Generate three bio variations (results-focused, leadership-focused, business-impact)
4. Create a 1-page executive summary highlighting my top 5 achievements
```

**Example: Targeted Search**
```
Search my career for all references to "AI" and "machine learning", 
then create a summary of my AI/ML experience and achievements
```

**Example: LinkedIn Optimization**
```
Generate a LinkedIn headline, then read my full career and suggest 
3-5 featured achievements to highlight in my LinkedIn About section
```

## Security & Privacy

- ✅ **Local only:** The MCP server runs on your machine, no external access
- ✅ **Read-only:** Server only reads your files, never modifies them
- ✅ **No network:** Uses stdio transport, no HTTP server or open ports
- ✅ **Private:** Your career data never leaves your machine (unless you share Claude conversations)

## Next Steps

Want to enhance the MCP server? Consider adding:

1. **Resume parsing:** Extract structured data from your PDF resume
2. **LinkedIn sync:** Read your LinkedIn profile data
3. **Project portfolio:** Add resources for specific projects or case studies
4. **Testimonials:** Add a resource with references and testimonials
5. **Skills taxonomy:** Add a structured skills and expertise tree

See `mcp-server/README.md` for technical details and development guide.
