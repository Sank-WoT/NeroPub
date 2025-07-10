export const mockNetworkData = {
  layers: [
    {
      name: "Input Layer",
      nodes: [
        { id: "I1", type: "input", bias: 0, activation: "Linear" },
        { id: "I2", type: "input", bias: 0, activation: "Linear" },
        { id: "I3", type: "input", bias: 0, activation: "Linear" },
        { id: "I4", type: "input", bias: 0, activation: "Linear" }
      ]
    },
    {
      name: "Hidden Layer 1",
      nodes: [
        { id: "H1", type: "hidden", bias: 0.1, activation: "ReLU", learningRate: 0.01 },
        { id: "H2", type: "hidden", bias: -0.05, activation: "ReLU", learningRate: 0.01 },
        { id: "H3", type: "hidden", bias: 0.2, activation: "ReLU", learningRate: 0.01 },
        { id: "H4", type: "hidden", bias: 0.0, activation: "ReLU", learningRate: 0.01 },
        { id: "H5", type: "hidden", bias: 0.15, activation: "ReLU", learningRate: 0.01 }
      ]
    },
    {
      name: "Hidden Layer 2",
      nodes: [
        { id: "H6", type: "hidden", bias: 0.08, activation: "ReLU", learningRate: 0.01 },
        { id: "H7", type: "hidden", bias: -0.12, activation: "ReLU", learningRate: 0.01 },
        { id: "H8", type: "hidden", bias: 0.3, activation: "ReLU", learningRate: 0.01 },
        { id: "H9", type: "hidden", bias: 0.05, activation: "ReLU", learningRate: 0.01 }
      ]
    },
    {
      name: "Hidden Layer 3",
      nodes: [
        { id: "H10", type: "hidden", bias: 0.25, activation: "ReLU", learningRate: 0.01 },
        { id: "H11", type: "hidden", bias: -0.08, activation: "ReLU", learningRate: 0.01 },
        { id: "H12", type: "hidden", bias: 0.12, activation: "ReLU", learningRate: 0.01 }
      ]
    },
    {
      name: "Output Layer",
      nodes: [
        { id: "O1", type: "output", bias: 0.0, activation: "Softmax", learningRate: 0.01 },
        { id: "O2", type: "output", bias: 0.0, activation: "Softmax", learningRate: 0.01 }
      ]
    }
  ],
  skipConnections: [
    // Skip connections from Input to Hidden Layer 2
    { from: 0, fromNode: 0, to: 2, toNode: 0, weight: 0.3 },
    { from: 0, fromNode: 1, to: 2, toNode: 1, weight: 0.2 },
    { from: 0, fromNode: 2, to: 2, toNode: 2, weight: 0.4 },
    { from: 0, fromNode: 3, to: 2, toNode: 3, weight: 0.1 },
    
    // Skip connections from Hidden Layer 1 to Hidden Layer 3
    { from: 1, fromNode: 0, to: 3, toNode: 0, weight: 0.25 },
    { from: 1, fromNode: 1, to: 3, toNode: 1, weight: 0.35 },
    { from: 1, fromNode: 2, to: 3, toNode: 2, weight: 0.15 },
    
    // Skip connections from Hidden Layer 1 to Output
    { from: 1, fromNode: 0, to: 4, toNode: 0, weight: 0.4 },
    { from: 1, fromNode: 2, to: 4, toNode: 1, weight: 0.3 }
  ]
};