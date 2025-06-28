import OpenAI from 'openai';
import { MCPClient } from '../mcp/mcp-client';
import { PersistenceManager } from '../persistence/persistence-manager';
import { randyPersonality } from './randy-personality';

export interface RandyConfig {
  openaiApiKey: string;
  mcpServers?: string[];
  persistenceEnabled?: boolean;
}

export interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: any;
  };
}

export class RandyAgent {
  private openai: OpenAI;
  private mcpClient: MCPClient;
  private persistence: PersistenceManager;
  private tools: Tool[] = [];
  private conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  
  constructor(config: RandyConfig) {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    
    this.mcpClient = new MCPClient(config.mcpServers || []);
    this.persistence = new PersistenceManager(config.persistenceEnabled ?? true);
    
    // Add system message with Randy's personality
    this.conversationHistory.push({
      role: 'system',
      content: randyPersonality.systemPrompt,
    });
  }
  
  async initialize(): Promise<void> {
    await this.mcpClient.connect();
    await this.persistence.initialize();
    
    // Register MCP tools
    const mcpTools = await this.mcpClient.getAvailableTools();
    for (const tool of mcpTools) {
      this.tools.push({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties: {
              input: {
                type: 'string',
                description: 'Input for the MCP tool',
              },
            },
            required: ['input'],
          },
        },
      });
    }
    
    console.log(`Randy initialized with ${this.tools.length} tools! Oh my God, this is amazing!`);
  }
  
  async chat(message: string, context?: any): Promise<string> {
    try {
      // Save user message
      await this.persistence.saveMessage({
        role: 'user',
        content: message,
        timestamp: new Date(),
      });
      
      // Add to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: message,
      });
      
      // Get response from OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: this.conversationHistory,
        tools: this.tools.length > 0 ? this.tools : undefined,
        tool_choice: 'auto',
        temperature: 0.8, // Randy is a bit unpredictable
      });
      
      const responseMessage = completion.choices[0].message;
      
      // Handle tool calls if any
      if (responseMessage.tool_calls) {
        const toolResults = await this.handleToolCalls(responseMessage.tool_calls);
        
        // Add tool results to conversation
        this.conversationHistory.push(responseMessage);
        this.conversationHistory.push({
          role: 'tool',
          content: JSON.stringify(toolResults),
        });
        
        // Get final response after tool execution
        const finalCompletion = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          messages: this.conversationHistory,
          temperature: 0.8,
        });
        
        const finalResponse = finalCompletion.choices[0].message.content || '';
        
        // Save assistant response
        await this.persistence.saveMessage({
          role: 'assistant',
          content: finalResponse,
          timestamp: new Date(),
          metadata: { hadToolCalls: true },
        });
        
        this.conversationHistory.push({
          role: 'assistant',
          content: finalResponse,
        });
        
        return finalResponse;
      }
      
      const response = responseMessage.content || '';
      
      // Save assistant response
      await this.persistence.saveMessage({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });
      
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      });
      
      // Trim conversation history if too long
      if (this.conversationHistory.length > 20) {
        // Keep system message and last 19 messages
        this.conversationHistory = [
          this.conversationHistory[0], // System message
          ...this.conversationHistory.slice(-19),
        ];
      }
      
      return response;
    } catch (error) {
      console.error('Randy encountered an error:', error);
      return randyPersonality.getErrorResponse();
    }
  }
  
  private async handleToolCalls(toolCalls: any[]): Promise<any[]> {
    const results = [];
    
    for (const toolCall of toolCalls) {
      const startTime = Date.now();
      
      try {
        // Find the MCP tool handler
        const mcpTools = await this.mcpClient.getAvailableTools();
        const tool = mcpTools.find(t => t.name === toolCall.function.name);
        
        if (tool) {
          const args = JSON.parse(toolCall.function.arguments);
          const result = await tool.handler(args);
          
          await this.persistence.saveMCPInteraction({
            serverName: toolCall.function.name.split('.')[0],
            toolName: toolCall.function.name,
            input: args,
            output: result,
            duration: Date.now() - startTime,
            success: true,
          });
          
          results.push({
            tool_call_id: toolCall.id,
            output: result,
          });
        } else {
          throw new Error(`Tool ${toolCall.function.name} not found`);
        }
      } catch (error) {
        await this.persistence.saveMCPInteraction({
          serverName: toolCall.function.name.split('.')[0],
          toolName: toolCall.function.name,
          input: toolCall.function.arguments,
          output: error.message,
          duration: Date.now() - startTime,
          success: false,
        });
        
        results.push({
          tool_call_id: toolCall.id,
          error: error.message,
        });
      }
    }
    
    return results;
  }
  
  async executeTask(task: string, mcpServer?: string): Promise<any> {
    try {
      // Execute task through MCP server if specified
      if (mcpServer) {
        return await this.mcpClient.executeOnServer(mcpServer, task);
      }
      
      // Otherwise use chat to handle the task
      return await this.chat(`Execute this task: ${task}`);
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
  
  async getAnalytics(): Promise<any> {
    return await this.persistence.getAnalytics();
  }
  
  async shutdown(): Promise<void> {
    await this.mcpClient.disconnect();
    await this.persistence.close();
    console.log('Randy shutting down... I\'ll be back! This isn\'t over!');
  }
}