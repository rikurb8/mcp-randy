import React, { useState, useRef, useEffect } from 'react';
import { RandyPersonality } from './RandyPersonality';
import { MCPConnection } from './MCPConnection';
import './RandyAssistant.css';

interface Message {
  id: string;
  type: 'user' | 'randy';
  content: string;
  timestamp: Date;
  mcpResult?: any;
}

interface RandyAssistantProps {
  mode?: 'chat' | 'request-response' | 'playground';
  mcpServerUrl?: string;
  showMCPControls?: boolean;
}

export function RandyAssistant({ 
  mode = 'chat', 
  mcpServerUrl,
  showMCPControls = true 
}: RandyAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'randy',
      content: RandyPersonality.getGreeting(),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [mcpConnected, setMcpConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    // Simulate Randy's response with personality
    setTimeout(() => {
      const randyResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'randy',
        content: RandyPersonality.generateResponse(input, mcpConnected),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, randyResponse]);
      setIsThinking(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessage = (message: Message) => (
    <div key={message.id} className={`message ${message.type}`}>
      <div className="message-header">
        <span className="sender">
          {message.type === 'randy' ? '🤖 Randy' : '👤 You'}
        </span>
        <span className="timestamp">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <div className="message-content">
        {message.content}
        {message.mcpResult && (
          <div className="mcp-result">
            <strong>MCP Result:</strong>
            <pre>{JSON.stringify(message.mcpResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`randy-assistant ${mode}`}>
      <div className="randy-header">
        <div className="randy-avatar">
          <div className="jarvis-ring">
            <div className="jarvis-core"></div>
          </div>
        </div>
        <div className="randy-info">
          <h3>Randy AI Assistant</h3>
          <p>Your JARVIS-like MCP companion</p>
          {mcpConnected && <span className="mcp-status">🟢 MCP Connected</span>}
        </div>
      </div>

      {showMCPControls && (
        <MCPConnection 
          onConnectionChange={setMcpConnected}
          serverUrl={mcpServerUrl}
        />
      )}

      <div className="messages-container">
        {messages.map(renderMessage)}
        {isThinking && (
          <div className="message randy thinking">
            <div className="message-header">
              <span className="sender">🤖 Randy</span>
            </div>
            <div className="message-content">
              <div className="thinking-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              {RandyPersonality.getThinkingText()}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={RandyPersonality.getInputPlaceholder(mode)}
          className="message-input"
          rows={mode === 'request-response' ? 4 : 2}
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isThinking}
          className="send-button"
        >
          {mode === 'request-response' ? '🚀 Execute' : '💬 Send'}
        </button>
      </div>

      {mode === 'playground' && (
        <div className="playground-controls">
          <button onClick={() => setMessages([messages[0]])}>
            🗑️ Clear Chat
          </button>
          <button onClick={() => window.location.reload()}>
            🔄 Reset Randy
          </button>
        </div>
      )}
    </div>
  );
}