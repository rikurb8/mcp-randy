import type { APIRoute } from 'astro';
import { RandyAgent } from '../../../lib/randy/randy-agent';
import { RandyValidator } from '../../../lib/validation/validator';

// Store Randy instance in memory (in production, use proper state management)
let randy: RandyAgent | null = null;

export const POST: APIRoute = async ({ params, request }) => {
  const action = params.action;
  
  try {
    switch (action) {
      case 'init':
        if (!randy) {
          // Initialize Randy with configuration
          randy = new RandyAgent({
            openaiApiKey: import.meta.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '',
            mcpServers: [
              // Add MCP server configurations here
            ],
            persistenceEnabled: true,
          });
          
          await randy.initialize();
        }
        
        return new Response(JSON.stringify({ 
          status: 'initialized',
          message: 'Randy is ready! Oh my God, this is amazing!'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      case 'chat':
        if (!randy) {
          return new Response(JSON.stringify({ 
            error: 'Randy not initialized! This is a disaster!' 
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
        
        const { message } = await request.json();
        const response = await randy.chat(message);
        
        return new Response(JSON.stringify({ response }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      default:
        return new Response(JSON.stringify({ 
          error: 'Unknown action! I thought this was America!' 
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
    }
  } catch (error) {
    console.error('Randy API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Randy encountered an error! SHARON!',
      details: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

export const GET: APIRoute = async ({ params, url }) => {
  const action = params.action;
  
  try {
    switch (action) {
      case 'capabilities':
        const capabilities = [
          'Chat with Randy Marsh personality',
          'Connect to MCP servers',
          'Execute tasks via MCP',
          'Persist conversations',
          'Export data (SQLite/JSON)',
          'Validate system performance',
        ];
        
        if (randy) {
          const mcpServers = randy['mcpClient']?.getConnectedServers() || [];
          capabilities.push(...mcpServers.map(s => `Connected to MCP: ${s}`));
        }
        
        return new Response(JSON.stringify({ capabilities }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      case 'analytics':
        if (!randy) {
          return new Response(JSON.stringify({ 
            error: 'Randy not initialized!' 
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
        
        const analytics = await randy.getAnalytics();
        
        return new Response(JSON.stringify(analytics), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      case 'export':
        if (!randy) {
          return new Response(JSON.stringify({ 
            error: 'Randy not initialized!' 
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
        
        const format = url.searchParams.get('format') as 'sqlite' | 'json' || 'sqlite';
        const data = await randy.exportData(format);
        
        return new Response(data, {
          status: 200,
          headers: {
            'Content-Type': format === 'sqlite' ? 'application/x-sqlite3' : 'application/json',
            'Content-Disposition': `attachment; filename="randy-export.${format === 'sqlite' ? 'db' : 'json'}"`,
          },
        });
        
      case 'validate':
        const validator = new RandyValidator();
        const validation = await validator.validateSystem();
        validator.close();
        
        return new Response(JSON.stringify(validation), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
      default:
        return new Response(JSON.stringify({ 
          error: 'Unknown action!' 
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        });
    }
  } catch (error) {
    console.error('Randy API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Randy encountered an error!',
      details: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};