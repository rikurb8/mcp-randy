import Database from 'better-sqlite3';
import { readFileSync } from 'fs';

export interface ValidationResult {
  passed: boolean;
  score: number;
  details: {
    test: string;
    result: boolean;
    message: string;
    score: number;
  }[];
}

export interface EvaluationMetrics {
  responseTime: number;
  successRate: number;
  mcpIntegration: number;
  personalityConsistency: number;
  taskCompletion: number;
}

export class RandyValidator {
  private db: Database.Database;
  
  constructor(dbPath: string = 'randy-conversations.db') {
    this.db = new Database(dbPath, { readonly: true });
  }
  
  async validateSystem(): Promise<ValidationResult> {
    const tests = [
      this.validateDatabaseIntegrity(),
      this.validateMCPConnections(),
      this.validateConversationFlow(),
      this.validatePersonalityConsistency(),
      this.validateTaskCompletion(),
    ];
    
    const results = await Promise.all(tests);
    const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const allPassed = results.every(r => r.result);
    
    return {
      passed: allPassed,
      score: totalScore,
      details: results,
    };
  }
  
  private async validateDatabaseIntegrity(): Promise<any> {
    try {
      // Check if all tables exist
      const tables = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table'"
      ).all() as any[];
      
      const requiredTables = ['sessions', 'messages', 'mcp_interactions', 'analytics'];
      const existingTables = tables.map(t => t.name);
      const allTablesExist = requiredTables.every(t => existingTables.includes(t));
      
      // Check data integrity
      const orphanedMessages = this.db.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE session_id NOT IN (SELECT session_id FROM sessions)
      `).get() as any;
      
      const hasOrphans = orphanedMessages.count > 0;
      
      return {
        test: 'Database Integrity',
        result: allTablesExist && !hasOrphans,
        message: allTablesExist 
          ? (hasOrphans ? `Found ${orphanedMessages.count} orphaned messages` : 'Database structure is valid')
          : 'Missing required tables',
        score: allTablesExist ? (hasOrphans ? 0.7 : 1.0) : 0,
      };
    } catch (error) {
      return {
        test: 'Database Integrity',
        result: false,
        message: `Database error: ${error.message}`,
        score: 0,
      };
    }
  }
  
  private async validateMCPConnections(): Promise<any> {
    try {
      const interactions = this.db.prepare(
        'SELECT COUNT(*) as total, SUM(success) as successful FROM mcp_interactions'
      ).get() as any;
      
      if (interactions.total === 0) {
        return {
          test: 'MCP Connections',
          result: true,
          message: 'No MCP interactions recorded yet',
          score: 0.5,
        };
      }
      
      const successRate = interactions.successful / interactions.total;
      
      return {
        test: 'MCP Connections',
        result: successRate >= 0.8,
        message: `MCP success rate: ${(successRate * 100).toFixed(1)}%`,
        score: successRate,
      };
    } catch (error) {
      return {
        test: 'MCP Connections',
        result: false,
        message: `MCP validation error: ${error.message}`,
        score: 0,
      };
    }
  }
  
  private async validateConversationFlow(): Promise<any> {
    try {
      const messages = this.db.prepare(`
        SELECT role, timestamp FROM messages 
        ORDER BY timestamp ASC
      `).all() as any[];
      
      if (messages.length < 2) {
        return {
          test: 'Conversation Flow',
          result: true,
          message: 'Not enough messages to validate flow',
          score: 0.5,
        };
      }
      
      // Check for proper alternation between user and assistant
      let properFlow = true;
      let lastRole = messages[0].role;
      
      for (let i = 1; i < messages.length; i++) {
        if (messages[i].role === lastRole && messages[i].role !== 'system') {
          properFlow = false;
          break;
        }
        lastRole = messages[i].role;
      }
      
      // Check response times
      const responseTimes: number[] = [];
      for (let i = 1; i < messages.length; i++) {
        if (messages[i-1].role === 'user' && messages[i].role === 'assistant') {
          const timeDiff = new Date(messages[i].timestamp).getTime() - 
                          new Date(messages[i-1].timestamp).getTime();
          responseTimes.push(timeDiff);
        }
      }
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;
      
      return {
        test: 'Conversation Flow',
        result: properFlow,
        message: properFlow 
          ? `Valid flow, avg response time: ${avgResponseTime}ms`
          : 'Invalid conversation flow detected',
        score: properFlow ? 1.0 : 0.3,
      };
    } catch (error) {
      return {
        test: 'Conversation Flow',
        result: false,
        message: `Flow validation error: ${error.message}`,
        score: 0,
      };
    }
  }
  
  private async validatePersonalityConsistency(): Promise<any> {
    try {
      const assistantMessages = this.db.prepare(`
        SELECT content FROM messages 
        WHERE role = 'assistant'
      `).all() as any[];
      
      if (assistantMessages.length === 0) {
        return {
          test: 'Personality Consistency',
          result: true,
          message: 'No assistant messages to analyze',
          score: 0.5,
        };
      }
      
      // Check for Randy's catchphrases and personality markers
      const randyPhrases = [
        'Oh my God',
        'Sharon',
        'Stan',
        'I thought this was',
        'future',
        'amazing',
        '!',
      ];
      
      let personalityScore = 0;
      for (const msg of assistantMessages) {
        const content = msg.content.toLowerCase();
        const phrasesFound = randyPhrases.filter(phrase => 
          content.includes(phrase.toLowerCase())
        ).length;
        personalityScore += phrasesFound > 0 ? 1 : 0;
      }
      
      const consistencyRate = personalityScore / assistantMessages.length;
      
      return {
        test: 'Personality Consistency',
        result: consistencyRate >= 0.6,
        message: `Randy personality consistency: ${(consistencyRate * 100).toFixed(1)}%`,
        score: consistencyRate,
      };
    } catch (error) {
      return {
        test: 'Personality Consistency',
        result: false,
        message: `Personality validation error: ${error.message}`,
        score: 0,
      };
    }
  }
  
  private async validateTaskCompletion(): Promise<any> {
    try {
      // Analyze if user requests were followed by appropriate actions
      const conversations = this.db.prepare(`
        SELECT m1.content as user_msg, m2.content as assistant_msg
        FROM messages m1
        JOIN messages m2 ON m2.id = m1.id + 1
        WHERE m1.role = 'user' AND m2.role = 'assistant'
      `).all() as any[];
      
      if (conversations.length === 0) {
        return {
          test: 'Task Completion',
          result: true,
          message: 'No conversations to analyze',
          score: 0.5,
        };
      }
      
      // Simple heuristic: check if assistant acknowledged the request
      let completionScore = 0;
      for (const conv of conversations) {
        const userRequest = conv.user_msg.toLowerCase();
        const assistantResponse = conv.assistant_msg.toLowerCase();
        
        // Check if assistant addressed the request
        if (
          assistantResponse.length > 20 && // Non-trivial response
          (assistantResponse.includes('i') || assistantResponse.includes('randy')) && // Self-reference
          (assistantResponse.includes('will') || assistantResponse.includes('can') || 
           assistantResponse.includes('done') || assistantResponse.includes('here')) // Action words
        ) {
          completionScore += 1;
        }
      }
      
      const completionRate = completionScore / conversations.length;
      
      return {
        test: 'Task Completion',
        result: completionRate >= 0.7,
        message: `Task completion rate: ${(completionRate * 100).toFixed(1)}%`,
        score: completionRate,
      };
    } catch (error) {
      return {
        test: 'Task Completion',
        result: false,
        message: `Task validation error: ${error.message}`,
        score: 0,
      };
    }
  }
  
  async generateEvaluationReport(): Promise<EvaluationMetrics> {
    const validation = await this.validateSystem();
    
    // Calculate detailed metrics
    const responseTimeMetric = this.db.prepare(`
      SELECT AVG(duration_ms) as avg FROM mcp_interactions
    `).get() as any;
    
    const successRateMetric = this.db.prepare(`
      SELECT AVG(success) as rate FROM mcp_interactions
    `).get() as any;
    
    const details = validation.details;
    
    return {
      responseTime: responseTimeMetric?.avg || 0,
      successRate: successRateMetric?.rate || 0,
      mcpIntegration: details.find(d => d.test === 'MCP Connections')?.score || 0,
      personalityConsistency: details.find(d => d.test === 'Personality Consistency')?.score || 0,
      taskCompletion: details.find(d => d.test === 'Task Completion')?.score || 0,
    };
  }
  
  close(): void {
    this.db.close();
  }
}