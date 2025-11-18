#!/usr/bin/env node

/**
 * Tom Lacy MCP Server
 * 
 * Exposes professional context, career data, and site content via Model Context Protocol.
 * This server provides AI assistants with structured access to:
 * - Career history and achievements
 * - Professional expertise and metrics
 * - Resume and bio content
 * - Site content (passions, photos, contact info)
 * 
 * Resources exposed:
 * - career-summary: Executive summary and core expertise
 * - career-full: Complete career history with detailed achievements
 * - resume: Full resume content
 * - site-content: Current site content (content.json)
 * - expertise-areas: Categorized expertise and skills
 * 
 * Tools provided:
 * - query-career: Search career history by keyword or time period
 * - generate-bio: Generate bio variations for different contexts
 * - extract-metrics: Extract quantifiable achievements and metrics
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to content files (relative to repo root)
const CONTENT_JSON_PATH = path.join(__dirname, '..', 'content.json');
const CAREER_MD_PATH = path.join(__dirname, '..', 'career.md');

/**
 * Load and parse content.json
 */
async function loadSiteContent() {
  try {
    const content = await fs.readFile(CONTENT_JSON_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading content.json:', error);
    return null;
  }
}

/**
 * Load career.md content
 */
async function loadCareerContent() {
  try {
    return await fs.readFile(CAREER_MD_PATH, 'utf-8');
  } catch (error) {
    console.error('Error loading career.md:', error);
    return null;
  }
}

/**
 * Extract expertise areas from career content
 */
function extractExpertise(careerContent) {
  const expertise = {
    'Scaling Organizations': [
      'Grew engineering teams from 160 to 400+',
      'Improved engagement from 56% to 75%',
      'Retention above 90%, regrettable attrition ~7%'
    ],
    'M&A & Integration': [
      'Led technical diligence for 7 acquisitions',
      'Consolidated platforms for unified SaaS suite',
      '~20% ARR growth post-integration'
    ],
    'Operational Excellence': [
      'Reduced engineering OPEX from ~20% to <15% of revenue',
      'Improved customer NPS by 10+ points',
      '$2M annual hosting cost savings'
    ],
    'Product Leadership': [
      'Transformed services-led to product-led organization',
      'Launched first AI-enabled products',
      'Platform modernization and cloud transformation'
    ],
    'Board & Investor Relations': [
      'Board-level engineering transparency',
      'Quarterly presentations on technology investments',
      'Technical leadership through PE acquisition'
    ]
  };
  
  return expertise;
}

/**
 * Extract quantifiable metrics from career content
 */
function extractMetrics(careerContent) {
  const metrics = [
    { category: 'Team Growth', metric: 'Team size', value: '160 → 400+', context: 'Quorum Software' },
    { category: 'Engagement', metric: 'Employee engagement', value: '56% → 75%', context: 'Quorum Software' },
    { category: 'Retention', metric: 'Employee retention', value: '>90%', context: 'Quorum Software' },
    { category: 'Attrition', metric: 'Regrettable attrition', value: '~7%', context: 'Quorum Software' },
    { category: 'Revenue', metric: 'ARR growth', value: '~20%', context: 'On Demand suite' },
    { category: 'Cost', metric: 'Engineering OPEX', value: '~20% → <15% of revenue', context: 'Quorum Software' },
    { category: 'Customer', metric: 'NPS improvement', value: '10+ points', context: 'Quorum Software' },
    { category: 'Customer', metric: 'Hosting retention', value: '96%', context: 'Quorum Software' },
    { category: 'Cost', metric: 'Hosting cost savings', value: '$2M annually', context: 'Bazaarvoice' },
    { category: 'M&A', metric: 'Acquisitions integrated', value: '7', context: 'Quorum Software' },
    { category: 'Performance', metric: 'Platform performance improvement', value: '20%', context: 'Bazaarvoice' },
    { category: 'Usage', metric: 'Platform usage increase', value: '30%', context: 'Bazaarvoice' }
  ];
  
  return metrics;
}

/**
 * Generate bio variations for different contexts
 */
async function generateBio(context = 'general', length = 'medium') {
  const siteContent = await loadSiteContent();
  const careerContent = await loadCareerContent();
  
  const bios = {
    'linkedin-headline': 'Chief Technology Officer | Scaling Engineering Organizations for Growth, EBITDA Expansion, and Successful Exits',
    
    'executive-summary': 'Technology executive and proven CTO with 20+ years of leadership experience scaling engineering organizations, driving product innovation, and delivering measurable business outcomes across IPOs, PE acquisitions, and high-growth environments.',
    
    'results-focused': 'CTO and technology executive with proven track record scaling engineering organizations through IPOs and PE acquisitions. Led 7 M&A integrations, transformed services-led business to product-led growth, and delivered measurable EBITDA improvement through operational excellence and cloud transformation.',
    
    'leadership-focused': 'Engineering leader who builds high-performance teams and drives product innovation at scale. Grew engineering from 160 to 400+ with 75% engagement, launched AI-enabled SaaS suite with 20% ARR growth, and delivered double-digit NPS improvements through data-driven culture.',
    
    'business-impact': 'Technology executive transforming engineering into competitive advantage. Reduced OPEX from 20% to <15% of revenue while scaling teams 2.5x, led technical diligence for 7 acquisitions, and established board-level transparency that drove successful PE outcomes.',
    
    'current': siteContent?.bio || 'Technology executive specializing in scaling engineering organizations.'
  };
  
  return bios[context] || bios['executive-summary'];
}

/**
 * Query career history by keyword or company
 */
async function queryCareer(query) {
  const careerContent = await loadCareerContent();
  if (!careerContent) {
    return 'Career content not available';
  }
  
  // Simple keyword search - could be enhanced with more sophisticated search
  const queryLower = query.toLowerCase();
  const lines = careerContent.split('\n');
  const results = [];
  
  let currentSection = '';
  for (const line of lines) {
    if (line.startsWith('###')) {
      currentSection = line.replace(/^###\s*/, '');
    }
    if (line.toLowerCase().includes(queryLower)) {
      results.push({
        section: currentSection,
        content: line.trim()
      });
    }
  }
  
  return results.length > 0 ? results : 'No matches found for query: ' + query;
}

// Create MCP server instance
const server = new Server(
  {
    name: 'tomlacy-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * List available resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'tomlacy://career/summary',
        name: 'Career Summary',
        description: 'Executive summary and core expertise areas',
        mimeType: 'text/plain',
      },
      {
        uri: 'tomlacy://career/full',
        name: 'Full Career History',
        description: 'Complete career history with detailed achievements, metrics, and experience',
        mimeType: 'text/markdown',
      },
      {
        uri: 'tomlacy://site/content',
        name: 'Site Content',
        description: 'Current website content including bio, passions, and social links',
        mimeType: 'application/json',
      },
      {
        uri: 'tomlacy://expertise/areas',
        name: 'Expertise Areas',
        description: 'Categorized expertise with specific achievements in each area',
        mimeType: 'application/json',
      },
      {
        uri: 'tomlacy://metrics/all',
        name: 'Career Metrics',
        description: 'Quantifiable achievements and metrics across career',
        mimeType: 'application/json',
      },
    ],
  };
});

/**
 * Read specific resource
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  switch (uri) {
    case 'tomlacy://career/summary': {
      const careerContent = await loadCareerContent();
      const summary = careerContent?.split('---')[0] || 'Summary not available';
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: summary,
          },
        ],
      };
    }
    
    case 'tomlacy://career/full': {
      const careerContent = await loadCareerContent();
      return {
        contents: [
          {
            uri,
            mimeType: 'text/markdown',
            text: careerContent || 'Career content not available',
          },
        ],
      };
    }
    
    case 'tomlacy://site/content': {
      const siteContent = await loadSiteContent();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(siteContent, null, 2),
          },
        ],
      };
    }
    
    case 'tomlacy://expertise/areas': {
      const careerContent = await loadCareerContent();
      const expertise = extractExpertise(careerContent);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(expertise, null, 2),
          },
        ],
      };
    }
    
    case 'tomlacy://metrics/all': {
      const careerContent = await loadCareerContent();
      const metrics = extractMetrics(careerContent);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(metrics, null, 2),
          },
        ],
      };
    }
    
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query-career',
        description: 'Search career history by keyword, company name, or technology',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search term (e.g., "Quorum", "M&A", "AI", "team scaling")',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'generate-bio',
        description: 'Generate bio variations for different contexts (LinkedIn, executive summary, etc.)',
        inputSchema: {
          type: 'object',
          properties: {
            context: {
              type: 'string',
              enum: ['linkedin-headline', 'executive-summary', 'results-focused', 'leadership-focused', 'business-impact', 'current'],
              description: 'Type of bio to generate',
            },
          },
          required: ['context'],
        },
      },
      {
        name: 'extract-metrics',
        description: 'Extract quantifiable achievements and metrics, optionally filtered by category',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Optional category filter (e.g., "Team Growth", "Cost", "Revenue", "Customer")',
            },
          },
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case 'query-career': {
      const results = await queryCareer(args.query);
      return {
        content: [
          {
            type: 'text',
            text: typeof results === 'string' ? results : JSON.stringify(results, null, 2),
          },
        ],
      };
    }
    
    case 'generate-bio': {
      const bio = await generateBio(args.context);
      return {
        content: [
          {
            type: 'text',
            text: bio,
          },
        ],
      };
    }
    
    case 'extract-metrics': {
      const careerContent = await loadCareerContent();
      let metrics = extractMetrics(careerContent);
      
      if (args.category) {
        metrics = metrics.filter(m => m.category === args.category);
      }
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(metrics, null, 2),
          },
        ],
      };
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tom Lacy MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
