import { Agent } from 'openai-agents-js';
import { MCPClient } from '../mcp/mcp-client';
import { PersistenceManager } from '../persistence/persistence-manager';
import { randyPersonality } from './randy-personality';

export interface RandyConfig {
  openaiApiKey: string;
  mcpServers?: string[];
  persistenceEnabled?: boolean;
}

export class RandyAgent {
  private agent: Agent;
  private mcpClient: MCPClient;
  private persistence: PersistenceManager;
  
  constructor(config: RandyConfig) {
    this.agent = new Agent({
      apiKey: config.openaiApiKey,
      systemMessage: randyPersonality.systemPrompt,
      model: 'gpt-4o',
    });
    
    this.mcpClient = new MCPClient(config.mcpServers || []);
    this.persistence = new PersistenceManager(config.persistenceEnabled ?? true);
  }
  
  async initialize(): Promise<void> {
    await this.mcpClient.connect();
    await this.persistence.initialize();
    
    // Register MCP tools with the agent
    const mcpTools = await this.mcpClient.getAvailableTools();
    for (const tool of mcpTools) {
      this.agent.registerTool(tool.name, tool.handler);
    }
  }
  
  async chat(message: string, context?: any): Promise<string> {
    try {
      // Add Randy's personality flair to responses
      const randyMessage = this.addRandyFlair(message);
      
      // Save conversation to persistence
      await this.persistence.saveMessage({
        role: 'user',
        content: message,
        timestamp: new Date(),
      });
      
      // Get response from agent
      const response = await this.agent.complete({
        messages: [{ role: 'user', content: randyMessage }],
        context,
      });
      
      // Save assistant response
      await this.persistence.saveMessage({
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      });
      
      return response.content;
    } catch (error) {
      console.error('Randy encountered an error:', error);
      return randyPersonality.getErrorResponse();
    }
  }
  
  async executeTask(task: string, mcpServer?: string): Promise<any> {
    try {
      // Execute task through MCP server if specified
      if (mcpServer) {
        return await this.mcpClient.executeOnServer(mcpServer, task);
      }
      
      // Otherwise use agent's built-in capabilities
      return await this.agent.runTask(task);
    } catch (error) {
      console.error('Task execution failed:', error);
      throw error;
    }
  }
  
  async getConversationHistory(): Promise<any[]> {
    return await this.persistence.getConversationHistory();
  }
  
  async exportData(format: 'sqlite' | 'json' = 'sqlite'): Promise<Buffer> {
    return await this.persistence.exportData(format);
  }
  
  private addRandyFlair(message: string): string {
    // Add Randy's personality touches to messages
    const randyPhrases = randyPersonality.getContextualPhrase();
    return `${message} ${randyPhrases}`;
  }
  
  async shutdown(): Promise<void> {
    await this.mcpClient.disconnect();
    await this.persistence.close();
  }
}