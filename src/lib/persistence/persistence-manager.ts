import Database from 'better-sqlite3';
import { writeFileSync } from 'fs';
import { join } from 'path';

export interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConversationSession {
  id?: number;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}

export class PersistenceManager {
  private db: Database.Database;
  private currentSessionId: string;
  private enabled: boolean;
  
  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    this.currentSessionId = this.generateSessionId();
  }
  
  async initialize(): Promise<void> {
    if (!this.enabled) return;
    
    // Initialize SQLite database
    this.db = new Database('randy-conversations.db');
    
    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        metadata TEXT
      );
      
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        metadata TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );
      
      CREATE TABLE IF NOT EXISTS mcp_interactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        server_name TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        input TEXT,
        output TEXT,
        timestamp DATETIME NOT NULL,
        duration_ms INTEGER,
        success BOOLEAN,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      );
      
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        timestamp DATETIME NOT NULL,
        session_id TEXT,
        metadata TEXT
      );
    `);
    
    // Create session
    this.createSession();
    
    console.log('Randy\'s memory initialized! I\'ll remember everything!');
  }
  
  private generateSessionId(): string {
    return `randy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private createSession(): void {
    if (!this.enabled) return;
    
    const stmt = this.db.prepare(`
      INSERT INTO sessions (session_id, start_time, metadata)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(
      this.currentSessionId,
      new Date().toISOString(),
      JSON.stringify({ agent: 'Randy', version: '1.0.0' })
    );
  }
  
  async saveMessage(message: Message): Promise<void> {
    if (!this.enabled) return;
    
    const stmt = this.db.prepare(`
      INSERT INTO messages (session_id, role, content, timestamp, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      this.currentSessionId,
      message.role,
      message.content,
      message.timestamp.toISOString(),
      JSON.stringify(message.metadata || {})
    );
  }
  
  async saveMCPInteraction(interaction: {
    serverName: string;
    toolName: string;
    input: any;
    output: any;
    duration: number;
    success: boolean;
  }): Promise<void> {
    if (!this.enabled) return;
    
    const stmt = this.db.prepare(`
      INSERT INTO mcp_interactions 
      (session_id, server_name, tool_name, input, output, timestamp, duration_ms, success)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      this.currentSessionId,
      interaction.serverName,
      interaction.toolName,
      JSON.stringify(interaction.input),
      JSON.stringify(interaction.output),
      new Date().toISOString(),
      interaction.duration,
      interaction.success ? 1 : 0
    );
  }
  
  async saveAnalytics(metricName: string, value: number, metadata?: any): Promise<void> {
    if (!this.enabled) return;
    
    const stmt = this.db.prepare(`
      INSERT INTO analytics (metric_name, metric_value, timestamp, session_id, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      metricName,
      value,
      new Date().toISOString(),
      this.currentSessionId,
      JSON.stringify(metadata || {})
    );
  }
  
  async getConversationHistory(sessionId?: string): Promise<Message[]> {
    if (!this.enabled) return [];
    
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `);
    
    const rows = stmt.all(sessionId || this.currentSessionId) as any[];
    
    return rows.map(row => ({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: new Date(row.timestamp),
      metadata: JSON.parse(row.metadata || '{}'),
    }));
  }
  
  async exportData(format: 'sqlite' | 'json' = 'sqlite'): Promise<Buffer> {
    if (!this.enabled) {
      throw new Error('Persistence is disabled! I can\'t remember anything!');
    }
    
    if (format === 'sqlite') {
      // Export the entire database file
      const dbBuffer = this.db.serialize();
      return Buffer.from(dbBuffer);
    } else {
      // Export as JSON
      const data = {
        sessions: this.db.prepare('SELECT * FROM sessions').all(),
        messages: this.db.prepare('SELECT * FROM messages').all(),
        mcp_interactions: this.db.prepare('SELECT * FROM mcp_interactions').all(),
        analytics: this.db.prepare('SELECT * FROM analytics').all(),
      };
      
      return Buffer.from(JSON.stringify(data, null, 2));
    }
  }
  
  async getAnalytics(): Promise<any> {
    if (!this.enabled) return {};
    
    const totalMessages = this.db.prepare(
      'SELECT COUNT(*) as count FROM messages WHERE session_id = ?'
    ).get(this.currentSessionId) as any;
    
    const mcpCalls = this.db.prepare(
      'SELECT COUNT(*) as count, AVG(duration_ms) as avg_duration FROM mcp_interactions WHERE session_id = ?'
    ).get(this.currentSessionId) as any;
    
    const successRate = this.db.prepare(
      'SELECT AVG(success) as rate FROM mcp_interactions WHERE session_id = ?'
    ).get(this.currentSessionId) as any;
    
    return {
      totalMessages: totalMessages.count,
      mcpCalls: mcpCalls.count,
      avgMCPDuration: mcpCalls.avg_duration,
      mcpSuccessRate: successRate.rate,
      sessionId: this.currentSessionId,
    };
  }
  
  async close(): Promise<void> {
    if (!this.enabled) return;
    
    // Mark session as ended
    const stmt = this.db.prepare(
      'UPDATE sessions SET end_time = ? WHERE session_id = ?'
    );
    stmt.run(new Date().toISOString(), this.currentSessionId);
    
    // Close database
    this.db.close();
    
    console.log('Randy\'s memory saved! Until next time!');
  }
}