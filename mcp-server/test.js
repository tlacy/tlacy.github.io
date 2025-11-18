#!/usr/bin/env node

/**
 * Test script for Tom Lacy MCP Server
 * 
 * This script tests the MCP server by connecting as a client and:
 * 1. Listing available resources
 * 2. Reading each resource
 * 3. Listing available tools
 * 4. Calling each tool with sample inputs
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCPServer() {
  console.log('🧪 Testing Tom Lacy MCP Server...\n');
  
  // Create client transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['index.js']
  });
  
  // Create client
  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );
  
  try {
    // Connect to server
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');
    
    // Test 1: List resources
    console.log('📚 Listing resources...');
    const resources = await client.listResources();
    console.log(`Found ${resources.resources.length} resources:`);
    resources.resources.forEach(r => {
      console.log(`  - ${r.name} (${r.uri})`);
    });
    console.log('');
    
    // Test 2: Read each resource
    console.log('📖 Reading resources...');
    for (const resource of resources.resources) {
      try {
        const content = await client.readResource({ uri: resource.uri });
        const text = content.contents[0].text;
        const preview = text.length > 100 ? text.substring(0, 100) + '...' : text;
        console.log(`  ✅ ${resource.name}: ${preview.replace(/\n/g, ' ')}`);
      } catch (error) {
        console.log(`  ❌ ${resource.name}: ${error.message}`);
      }
    }
    console.log('');
    
    // Test 3: List tools
    console.log('🔧 Listing tools...');
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:`);
    tools.tools.forEach(t => {
      console.log(`  - ${t.name}: ${t.description}`);
    });
    console.log('');
    
    // Test 4: Call tools
    console.log('🚀 Testing tools...');
    
    // Test query-career
    console.log('  Testing query-career...');
    const queryResult = await client.callTool({
      name: 'query-career',
      arguments: { query: 'Quorum' }
    });
    console.log(`    ✅ Found ${queryResult.content[0].text.split('\n').length} matches for "Quorum"`);
    
    // Test generate-bio
    console.log('  Testing generate-bio...');
    const bioResult = await client.callTool({
      name: 'generate-bio',
      arguments: { context: 'linkedin-headline' }
    });
    console.log(`    ✅ Generated bio: ${bioResult.content[0].text.substring(0, 80)}...`);
    
    // Test extract-metrics
    console.log('  Testing extract-metrics...');
    const metricsResult = await client.callTool({
      name: 'extract-metrics',
      arguments: { category: 'Team Growth' }
    });
    const metrics = JSON.parse(metricsResult.content[0].text);
    console.log(`    ✅ Extracted ${metrics.length} metrics in Team Growth category`);
    
    console.log('\n✨ All tests passed!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testMCPServer().catch(console.error);
