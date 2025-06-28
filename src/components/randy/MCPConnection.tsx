import React, { useState, useEffect } from 'react';

interface MCPConnectionProps {
  onConnectionChange: (connected: boolean) => void;
  serverUrl?: string;
}

interface MCPServer {
  name: string;
  url: string;
  description: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export function MCPConnection({ onConnectionChange, serverUrl }: MCPConnectionProps) {
  const [servers, setServers] = useState<MCPServer[]>([
    {
      name: 'Pocket-Pick Demo',
      url: 'http://localhost:3000',
      description: 'Local pocket-pick server for testing',
      status: 'disconnected'
    },
    {
      name: 'Custom Server',
      url: serverUrl || '',
      description: 'Your custom MCP server',
      status: 'disconnected'
    }
  ]);
  
  const [selectedServer, setSelectedServer] = useState(0);
  const [customUrl, setCustomUrl] = useState(serverUrl || '');
  const [connectionInfo, setConnectionInfo] = useState<any>(null);

  useEffect(() => {
    if (serverUrl) {
      setCustomUrl(serverUrl);
      setServers(prev => prev.map((server, index) => 
        index === 1 ? { ...server, url: serverUrl } : server
      ));
    }
  }, [serverUrl]);

  const simulateConnection = async (serverIndex: number) => {
    const server = servers[serverIndex];
    
    // Update status to connecting
    setServers(prev => prev.map((s, i) => 
      i === serverIndex ? { ...s, status: 'connecting' } : s
    ));

    // Simulate connection process
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      
      if (success) {
        setServers(prev => prev.map((s, i) => 
          i === serverIndex ? { ...s, status: 'connected' } : { ...s, status: 'disconnected' }
        ));
        
        // Simulate server info
        setConnectionInfo({
          server: server.name,
          tools: ['search_items', 'add_item', 'get_item_by_id', 'list_tags'],
          version: '1.0.0',
          capabilities: ['search', 'read', 'write']
        });
        
        onConnectionChange(true);
      } else {
        setServers(prev => prev.map((s, i) => 
          i === serverIndex ? { ...s, status: 'error' } : s
        ));
        onConnectionChange(false);
      }
    }, 2000);
  };

  const disconnect = () => {
    setServers(prev => prev.map(s => ({ ...s, status: 'disconnected' })));
    setConnectionInfo(null);
    onConnectionChange(false);
  };

  const updateCustomServer = () => {
    setServers(prev => prev.map((server, index) => 
      index === 1 ? { ...server, url: customUrl } : server
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="mcp-connection">
      <div className="connection-header">
        <h4>MCP Server Connection</h4>
        {connectionInfo && (
          <button onClick={disconnect} className="disconnect-btn">
            Disconnect
          </button>
        )}
      </div>

      {!connectionInfo ? (
        <div className="server-selection">
          <div className="server-list">
            {servers.map((server, index) => (
              <div 
                key={index}
                className={`server-option ${selectedServer === index ? 'selected' : ''}`}
                onClick={() => setSelectedServer(index)}
              >
                <div className="server-info">
                  <span className="server-status">
                    {getStatusIcon(server.status)}
                  </span>
                  <div>
                    <div className="server-name">{server.name}</div>
                    <div className="server-url">{server.url || 'No URL set'}</div>
                    <div className="server-description">{server.description}</div>
                  </div>
                </div>
                <div className="server-actions">
                  {server.status === 'disconnected' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        simulateConnection(index);
                      }}
                      disabled={!server.url}
                      className="connect-btn"
                    >
                      Connect
                    </button>
                  )}
                  {server.status === 'connecting' && (
                    <div className="connecting-spinner">Connecting...</div>
                  )}
                  {server.status === 'error' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        simulateConnection(index);
                      }}
                      className="retry-btn"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedServer === 1 && (
            <div className="custom-server-config">
              <label>Custom Server URL:</label>
              <div className="url-input-group">
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="url-input"
                />
                <button onClick={updateCustomServer} className="update-btn">
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="connection-details">
          <div className="connection-status">
            <span className="status-indicator">🟢 Connected to {connectionInfo.server}</span>
          </div>
          
          <div className="server-capabilities">
            <h5>Available Tools:</h5>
            <div className="tools-list">
              {connectionInfo.tools.map((tool: string, index: number) => (
                <span key={index} className="tool-tag">{tool}</span>
              ))}
            </div>
          </div>

          <div className="server-info-grid">
            <div className="info-item">
              <strong>Version:</strong> {connectionInfo.version}
            </div>
            <div className="info-item">
              <strong>Capabilities:</strong> {connectionInfo.capabilities.join(', ')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}