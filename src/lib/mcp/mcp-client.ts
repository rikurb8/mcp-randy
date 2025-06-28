import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

export interface MCPTool {
  name: string;
  description: string;
  handler: (params: any) => Promise<any>;
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export class MCPClient {
  private clients: Map<string, Client> = new Map();
  private serverConfigs: MCPServerConfig[] = [];
  
  constructor(serverConfigs: MCPServerConfig[] | string[]) {
    this.serverConfigs = serverConfigs.map(config => 
      typeof config === 'string' 
        ? { name: config, command: config } 
        : config
    );
  }
  
  async connect(): Promise<void> {
    for (const config of this.serverConfigs) {
      try {
        await this.connectToServer(config);
      } catch (error) {
        console.error(`Failed to connect to MCP server ${config.name}:`, error);
      }
    }
  }
  
  private async connectToServer(config: MCPServerConfig): Promise<void> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: { ...process.env, ...config.env },
    });
    
    const client = new Client({
      name: `randy-client-${config.name}`,
      version: '1.0.0',
    }, {
      capabilities: {
        tools: {},
        prompts: {},
        resources: {},
      }
    });
    
    await client.connect(transport);
    this.clients.set(config.name, client);
    
    console.log(`Randy connected to MCP server: ${config.name} - Oh my God, this is amazing!`);
  }
  
  async getAvailableTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];
    
    for (const [serverName, client] of this.clients) {
      try {
        const tools = await client.listTools();
        
        for (const tool of tools.tools) {
          allTools.push({
            name: `${serverName}.${tool.name}`,
            description: tool.description || '',
            handler: async (params: any) => {
              const result = await client.callTool({
                name: tool.name,
                arguments: params,
              });
              return result.content;
            },
          });
        }
      } catch (error) {
        console.error(`Failed to get tools from ${serverName}:`, error);
      }
    }
    
    return allTools;
  }
  
  async executeOnServer(serverName: string, task: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} not connected! This is not good!`);
    }
    
    // Parse task and execute appropriate tool
    // This is a simplified implementation - in reality, you'd need more sophisticated task parsing
    const tools = await client.listTools();
    if (tools.tools.length > 0) {
      // Use the first available tool as a demo
      const tool = tools.tools[0];
      const result = await client.callTool({
        name: tool.name,
        arguments: { task },
      });
      return result.content;
    }
    
    throw new Error(`No tools available on server ${serverName}`);
  }
  
  async getServerCapabilities(serverName: string): Promise<any> {
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server ${serverName} not connected!`);
    }
    
    return {
      tools: await client.listTools(),
      prompts: await client.listPrompts(),
      resources: await client.listResources(),
    };
  }
  
  async disconnect(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
        console.log(`Randy disconnected from ${name}. See you later!`);
      } catch (error) {
        console.error(`Error disconnecting from ${name}:`, error);
      }
    }
    this.clients.clear();
  }
  
  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }
  
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}