import React, { useState } from 'react';
import './CodeParser.css';

const CodeParser = ({ onNetworkGenerated }) => {
  const [code, setCode] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const parseLayerDefinition = (line) => {
    // Parse nn.Linear(input, output)
    const linearMatch = line.match(/nn\.Linear\((\d+),\s*(\d+)\)/);
    if (linearMatch) {
      return {
        type: 'linear',
        inputSize: parseInt(linearMatch[1]),
        outputSize: parseInt(linearMatch[2])
      };
    }

    // Parse other layer types
    const conv2dMatch = line.match(/nn\.Conv2d\((\d+),\s*(\d+)/);
    if (conv2dMatch) {
      return {
        type: 'conv2d',
        inputChannels: parseInt(conv2dMatch[1]),
        outputChannels: parseInt(conv2dMatch[2])
      };
    }

    return null;
  };

  const parseActivation = (line) => {
    // Parse activation function definitions like self.relu = nn.ReLU()
    if (line.includes('nn.ReLU()')) return 'ReLU';
    if (line.includes('nn.Sigmoid()')) return 'Sigmoid';
    if (line.includes('nn.Tanh()')) return 'Tanh';
    if (line.includes('nn.LeakyReLU()')) return 'LeakyReLU';
    if (line.includes('nn.Softmax()')) return 'Softmax';
    if (line.includes('nn.ELU()')) return 'ELU';
    if (line.includes('nn.GELU()')) return 'GELU';
    if (line.includes('nn.Swish()')) return 'Swish';
    if (line.includes('nn.Mish()')) return 'Mish';
    return null;
  };

  const parseActivationDefinitions = (lines) => {
    const activationDefs = {};
    
    lines.forEach(line => {
      if (line.includes('self.') && line.includes('=') && !line.includes('nn.Linear') && !line.includes('nn.Conv')) {
        const match = line.match(/self\.(\w+)\s*=\s*(.*)/);
        if (match) {
          const activationName = match[1];
          const activationDef = match[2];
          const activationType = parseActivation(activationDef);
          
          if (activationType) {
            activationDefs[activationName] = activationType;
          }
        }
      }
    });
    
    return activationDefs;
  };

  const parseForwardPass = (forwardLines, activationDefs) => {
    const skipConnections = [];
    const layerFlow = [];
    const layerActivations = {};
    
    forwardLines.forEach((line, index) => {
      // Look for skip connections (additions)
      if (line.includes('+') && !line.includes('=')) {
        const additionMatch = line.match(/return\s+(\w+)\s*\+\s*(\w+)/);
        if (additionMatch) {
          skipConnections.push({
            mainPath: additionMatch[1],
            skipPath: additionMatch[2]
          });
        }
      }
      
      // Track layer flow and activation usage
      const outputMatch = line.match(/(\w+)\s*=\s*(.+)/);
      if (outputMatch) {
        const outputVar = outputMatch[1];
        const expression = outputMatch[2];
        
        // Check if this line uses an activation function
        Object.keys(activationDefs).forEach(actName => {
          if (expression.includes(`self.${actName}(`)) {
            // Extract the layer being activated
            const layerMatch = expression.match(/self\.(\w+)\((.+)\)/);
            if (layerMatch) {
              const layerName = layerMatch[1];
              if (layerName !== actName) { // Make sure it's not the activation itself
                layerActivations[layerName] = activationDefs[actName];
              }
            }
            // Also check for chained activations like self.relu(self.layer1(x))
            const chainedMatch = expression.match(/self\.(\w+)\(self\.(\w+)\(/);
            if (chainedMatch) {
              const activationName = chainedMatch[1];
              const layerName = chainedMatch[2];
              if (activationDefs[activationName]) {
                layerActivations[layerName] = activationDefs[activationName];
              }
            }
          }
        });
        
        // Track the flow
        const inputMatch = expression.match(/self\.(\w+)\((.+)\)/);
        if (inputMatch) {
          layerFlow.push({
            output: outputVar,
            layer: inputMatch[1],
            input: inputMatch[2]
          });
        }
      }
    });

    return { skipConnections, layerFlow, layerActivations };
  };

  const generateNetworkData = (parsedData) => {
    const { layers, activations, forwardAnalysis } = parsedData;
    const networkLayers = [];
    
    // Determine input size from first layer
    const firstLayer = Object.values(layers)[0];
    const inputSize = firstLayer?.inputSize || 5;
    
    // Create input layer
    networkLayers.push({
      name: `Input Layer (${inputSize} nodes)`,
      nodes: Array.from({ length: inputSize }, (_, i) => ({
        id: `I${i + 1}`,
        type: "input",
        bias: 0,
        activation: "Linear",
        description: `Input node ${i + 1}`
      }))
    });

    // Create hidden/output layers
    Object.entries(layers).forEach(([layerName, layerInfo], index) => {
      const isLastLayer = index === Object.keys(layers).length - 1;
      const layerType = isLastLayer ? "output" : "hidden";
      const outputSize = layerInfo.outputSize;
      
      const layerActivation = activations[layerName] || (isLastLayer ? "Linear" : "ReLU");
      
      if (isLastLayer && outputSize === 1) {
        // Single output node
        networkLayers.push({
          name: `Output Layer: ${layerName}`,
          nodes: [{
            id: "Output",
            type: "output",
            bias: 0.0,
            activation: layerActivation,
            description: `Output from ${layerName}`
          }]
        });
      } else {
        // Multiple nodes
        networkLayers.push({
          name: `${layerName}: ${layerInfo.type}(${layerInfo.inputSize}→${layerInfo.outputSize})`,
          nodes: Array.from({ length: outputSize }, (_, i) => ({
            id: `${layerName}_${i + 1}`,
            type: layerType,
            bias: Math.random() * 0.2 - 0.1,
            activation: layerActivation,
            description: `${layerName} node ${i + 1}`
          }))
        });
      }
    });

    // Generate skip connections based on forward pass analysis
    const skipConnections = [];
    if (forwardAnalysis.skipConnections.length > 0) {
      // Find the layer that has skip connections
      const skipInfo = forwardAnalysis.skipConnections[0];
      
      // For now, assume skip from layer 1 to output (most common pattern)
      if (networkLayers.length >= 3) {
        const skipFromLayer = 1; // Usually first hidden layer
        const skipToLayer = networkLayers.length - 1; // Output layer
        const fromLayerSize = networkLayers[skipFromLayer].nodes.length;
        
        for (let i = 0; i < fromLayerSize; i++) {
          skipConnections.push({
            from: skipFromLayer,
            fromNode: i,
            to: skipToLayer,
            toNode: 0,
            weight: Math.random() * 0.4 - 0.2,
            description: `Skip connection from ${networkLayers[skipFromLayer].name} to output`
          });
        }
      }
    }

    return {
      layers: networkLayers,
      skipConnections,
      architecture: {
        framework: "PyTorch",
        className: "ParsedNetwork",
        description: "Neural network parsed from PyTorch code",
        totalParams: calculateTotalParams(layers)
      }
    };
  };

  const calculateTotalParams = (layers) => {
    return Object.values(layers).reduce((total, layer) => {
      return total + (layer.inputSize * layer.outputSize) + layer.outputSize;
    }, 0);
  };

  const parseCode = () => {
    setIsLoading(true);
    
    try {
      const lines = code.split('\n').map(line => line.trim()).filter(line => line);
      
      const layers = {};
      const activations = {};
      let inForwardMethod = false;
      const forwardLines = [];
      
      lines.forEach(line => {
        // Skip comments and empty lines
        if (line.startsWith('#') || line.startsWith('//')) return;
        
        // Track when we're in forward method
        if (line.includes('def forward(')) {
          inForwardMethod = true;
          return;
        }
        
        if (inForwardMethod) {
          forwardLines.push(line);
        } else {
          // Parse layer definitions
          if (line.includes('self.') && line.includes('=')) {
            const layerMatch = line.match(/self\.(\w+)\s*=\s*(.*)/);
            if (layerMatch) {
              const layerName = layerMatch[1];
              const layerDef = layerMatch[2];
              
              const layerInfo = parseLayerDefinition(layerDef);
              if (layerInfo) {
                layers[layerName] = layerInfo;
              }
              
              const activation = parseActivation(layerDef);
              if (activation) {
                activations[layerName] = activation;
              }
            }
          }
        }
      });
      
      const forwardAnalysis = parseForwardPass(forwardLines);
      
      if (Object.keys(layers).length === 0) {
        alert('No PyTorch layers found in the code. Please make sure your code includes nn.Linear() definitions.');
        return;
      }
      
      const networkData = generateNetworkData({
        layers,
        activations,
        forwardAnalysis
      });
      
      onNetworkGenerated(networkData);
      setIsVisible(false);
      
    } catch (error) {
      console.error('Error parsing code:', error);
      alert('Error parsing the code. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sampleCode = `import torch.nn as nn

class CustomPerceptron(nn.Module):
    def __init__(self):
        super().__init__()
        self.layer1 = nn.Linear(5, 10)
        self.layer2 = nn.Linear(10, 10)
        self.layer3 = nn.Linear(10, 1)
        
        # Skip connection
        self.skip_connection = nn.Linear(10, 1)
        
        self.relu = nn.ReLU()

    def forward(self, x):
        out1 = self.relu(self.layer1(x))
        out2 = self.relu(self.layer2(out1))
        out3 = self.layer3(out2)
        
        # Skip connection
        skip_out = self.skip_connection(out1)
        
        return out3 + skip_out`;

  return (
    <div className="code-parser">
      <button 
        className="parse-code-btn"
        onClick={() => setIsVisible(true)}
      >
        📝 Parse PyTorch Code
      </button>

      {isVisible && (
        <div className="code-parser-modal">
          <div className="code-parser-content">
            <div className="parser-header">
              <h3>Parse PyTorch Neural Network Code</h3>
              <button 
                className="close-parser-btn"
                onClick={() => setIsVisible(false)}
              >
                ×
              </button>
            </div>

            <div className="parser-body">
              <div className="code-input-section">
                <label htmlFor="pytorch-code">Paste your PyTorch code here:</label>
                <textarea
                  id="pytorch-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your PyTorch neural network class here..."
                  rows={15}
                  className="code-textarea"
                />
              </div>

              <div className="sample-code-section">
                <h4>Sample Code:</h4>
                <pre className="sample-code">
                  <code>{sampleCode}</code>
                </pre>
                <button 
                  className="use-sample-btn"
                  onClick={() => setCode(sampleCode)}
                >
                  Use Sample Code
                </button>
              </div>
            </div>

            <div className="parser-actions">
              <button 
                className="parse-btn"
                onClick={parseCode}
                disabled={isLoading || !code.trim()}
              >
                {isLoading ? 'Parsing...' : 'Generate Network Visualization'}
              </button>
              <button 
                className="cancel-parser-btn"
                onClick={() => setIsVisible(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeParser;