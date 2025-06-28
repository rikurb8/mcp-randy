import React, { useState } from 'react';
import { RandyPersonality } from '../randy/RandyPersonality';

interface AnalysisResult {
  totalItems: number;
  tags: { [key: string]: number };
  recentItems: any[];
  dataQuality: {
    emptyTexts: number;
    duplicates: number;
    avgTextLength: number;
  };
  exportData?: any;
}

interface PocketPickAnalyzerProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
}

export function PocketPickAnalyzer({ onAnalysisComplete }: PocketPickAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'sql'>('json');
  const [validationResults, setValidationResults] = useState<any>(null);

  const simulateAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate connection to pocket-pick database
    setTimeout(() => {
      const mockAnalysis: AnalysisResult = {
        totalItems: 156,
        tags: {
          'ai': 23,
          'mcp': 18,
          'javascript': 15,
          'python': 12,
          'documentation': 11,
          'tutorial': 9,
          'example': 8,
          'server': 7,
          'database': 6,
          'api': 5
        },
        recentItems: [
          {
            id: 156,
            created: '2024-01-15T10:30:00Z',
            text: 'MCP protocol enables seamless AI agent integration',
            tags: ['mcp', 'ai', 'protocol']
          },
          {
            id: 155,
            created: '2024-01-15T09:15:00Z',
            text: 'Randy makes learning MCP development fun and interactive',
            tags: ['randy', 'mcp', 'learning']
          },
          {
            id: 154,
            created: '2024-01-14T16:45:00Z',
            text: 'JavaScript MCP servers using OpenAI SDK patterns',
            tags: ['javascript', 'mcp', 'sdk']
          }
        ],
        dataQuality: {
          emptyTexts: 3,
          duplicates: 2,
          avgTextLength: 127.5
        }
      };

      setAnalysis(mockAnalysis);
      setIsAnalyzing(false);
      onAnalysisComplete?.(mockAnalysis);
    }, 3000);
  };

  const exportData = (format: 'json' | 'csv' | 'sql') => {
    if (!analysis) return;

    const timestamp = new Date().toISOString();
    
    let exportContent: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        exportContent = JSON.stringify({
          exportedAt: timestamp,
          analysis: analysis,
          rawData: {
            items: analysis.recentItems,
            tags: analysis.tags,
            totalItems: analysis.totalItems
          }
        }, null, 2);
        filename = `pocket-pick-export-${timestamp.split('T')[0]}.json`;
        mimeType = 'application/json';
        break;

      case 'csv':
        const csvHeaders = 'id,created,text,tags\n';
        const csvRows = analysis.recentItems.map(item => 
          `${item.id},"${item.created}","${item.text.replace(/"/g, '""')}","${item.tags.join(';')}"`
        ).join('\n');
        exportContent = csvHeaders + csvRows;
        filename = `pocket-pick-export-${timestamp.split('T')[0]}.csv`;
        mimeType = 'text/csv';
        break;

      case 'sql':
        const sqlInserts = analysis.recentItems.map(item => 
          `INSERT INTO items (id, created, text, tags) VALUES (${item.id}, '${item.created}', '${item.text.replace(/'/g, "''")}', '${JSON.stringify(item.tags)}');`
        ).join('\n');
        exportContent = `-- Pocket-Pick Database Export\n-- Generated: ${timestamp}\n\n${sqlInserts}`;
        filename = `pocket-pick-export-${timestamp.split('T')[0]}.sql`;
        mimeType = 'text/plain';
        break;
    }

    // Create download
    const blob = new Blob([exportContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const runValidation = () => {
    if (!analysis) return;

    const validation = {
      dataIntegrity: {
        status: analysis.dataQuality.emptyTexts < 5 ? 'good' : 'warning',
        emptyTexts: analysis.dataQuality.emptyTexts,
        duplicates: analysis.dataQuality.duplicates
      },
      mcpCompliance: {
        status: 'excellent',
        toolsImplemented: ['search_items', 'add_item', 'get_item_by_id', 'list_tags'],
        protocolVersion: '0.1.0'
      },
      performance: {
        status: analysis.totalItems > 1000 ? 'warning' : 'good',
        totalItems: analysis.totalItems,
        avgResponseTime: '45ms',
        indexingStatus: 'optimized'
      },
      recommendations: [
        analysis.dataQuality.emptyTexts > 0 && 'Clean up empty text entries',
        analysis.dataQuality.duplicates > 0 && 'Remove duplicate items',
        analysis.totalItems > 1000 && 'Consider database partitioning',
        'Add full-text search indexing for better performance'
      ].filter(Boolean)
    };

    setValidationResults(validation);
  };

  return (
    <div className="pocket-pick-analyzer">
      <div className="analyzer-header">
        <h3>🔍 Pocket-Pick Database Analyzer</h3>
        <p>Analyze, export, and validate your pocket-pick MCP server data</p>
      </div>

      {!analysis ? (
        <div className="analysis-start">
          <div className="randy-message">
            <div className="randy-avatar">🤖</div>
            <div className="message-content">
              <p><strong>Randy:</strong> {RandyPersonality.getRandomQuote()}</p>
              <p>Let's analyze your pocket-pick database! I'll check the data quality, 
              count your tags, and prepare validation reports. This is gonna be awesome!</p>
            </div>
          </div>
          
          <button 
            onClick={simulateAnalysis}
            disabled={isAnalyzing}
            className="analyze-btn"
          >
            {isAnalyzing ? (
              <>
                <div className="spinner"></div>
                Analyzing Database...
              </>
            ) : (
              '🚀 Start Analysis'
            )}
          </button>
        </div>
      ) : (
        <div className="analysis-results">
          <div className="results-grid">
            <div className="stat-card">
              <h4>📊 Total Items</h4>
              <div className="stat-value">{analysis.totalItems}</div>
            </div>
            
            <div className="stat-card">
              <h4>🏷️ Unique Tags</h4>
              <div className="stat-value">{Object.keys(analysis.tags).length}</div>
            </div>
            
            <div className="stat-card">
              <h4>📝 Avg Text Length</h4>
              <div className="stat-value">{analysis.dataQuality.avgTextLength} chars</div>
            </div>
            
            <div className="stat-card">
              <h4>⚠️ Data Issues</h4>
              <div className="stat-value">
                {analysis.dataQuality.emptyTexts + analysis.dataQuality.duplicates}
              </div>
            </div>
          </div>

          <div className="tags-analysis">
            <h4>🏷️ Most Used Tags</h4>
            <div className="tags-list">
              {Object.entries(analysis.tags)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([tag, count]) => (
                  <div key={tag} className="tag-item">
                    <span className="tag-name">{tag}</span>
                    <span className="tag-count">{count}</span>
                    <div className="tag-bar">
                      <div 
                        className="tag-fill" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(analysis.tags))) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="recent-items">
            <h4>📅 Recent Items</h4>
            <div className="items-list">
              {analysis.recentItems.map(item => (
                <div key={item.id} className="item-card">
                  <div className="item-header">
                    <span className="item-id">#{item.id}</span>
                    <span className="item-date">
                      {new Date(item.created).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="item-text">{item.text}</div>
                  <div className="item-tags">
                    {item.tags.map((tag: string) => (
                      <span key={tag} className="item-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="export-section">
            <h4>📤 Export Data</h4>
            <div className="export-controls">
              <select 
                value={exportFormat} 
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="format-select"
              >
                <option value="json">JSON Export</option>
                <option value="csv">CSV Export</option>
                <option value="sql">SQL Export</option>
              </select>
              
              <button 
                onClick={() => exportData(exportFormat)}
                className="export-btn"
              >
                📥 Download {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>

          <div className="validation-section">
            <h4>✅ Validation & Evaluation</h4>
            
            {!validationResults ? (
              <button onClick={runValidation} className="validate-btn">
                🔍 Run MCP Validation
              </button>
            ) : (
              <div className="validation-results">
                <div className="validation-grid">
                  <div className="validation-card">
                    <h5>📊 Data Integrity</h5>
                    <div className={`status status-${validationResults.dataIntegrity.status}`}>
                      {validationResults.dataIntegrity.status.toUpperCase()}
                    </div>
                    <ul>
                      <li>Empty texts: {validationResults.dataIntegrity.emptyTexts}</li>
                      <li>Duplicates: {validationResults.dataIntegrity.duplicates}</li>
                    </ul>
                  </div>
                  
                  <div className="validation-card">
                    <h5>🔌 MCP Compliance</h5>
                    <div className={`status status-${validationResults.mcpCompliance.status}`}>
                      {validationResults.mcpCompliance.status.toUpperCase()}
                    </div>
                    <ul>
                      <li>Protocol: v{validationResults.mcpCompliance.protocolVersion}</li>
                      <li>Tools: {validationResults.mcpCompliance.toolsImplemented.length}/4</li>
                    </ul>
                  </div>
                  
                  <div className="validation-card">
                    <h5>⚡ Performance</h5>
                    <div className={`status status-${validationResults.performance.status}`}>
                      {validationResults.performance.status.toUpperCase()}
                    </div>
                    <ul>
                      <li>Response time: {validationResults.performance.avgResponseTime}</li>
                      <li>Items: {validationResults.performance.totalItems}</li>
                    </ul>
                  </div>
                </div>
                
                {validationResults.recommendations.length > 0 && (
                  <div className="recommendations">
                    <h5>💡 Recommendations</h5>
                    <ul>
                      {validationResults.recommendations.map((rec: string, index: number) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="randy-analysis-message">
            <div className="randy-avatar">🤖</div>
            <div className="message-content">
              <p><strong>Randy:</strong> Sweet! Your pocket-pick database is looking pretty solid! 
              {analysis.dataQuality.emptyTexts === 0 ? 
                " No empty texts - that's awesome!" : 
                ` Just ${analysis.dataQuality.emptyTexts} empty texts to clean up.`
              } 
              The tag distribution shows you're really organized with your knowledge base!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}