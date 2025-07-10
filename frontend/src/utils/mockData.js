// PyTorch CustomPerceptron Architecture Visualization
// Based on the updated PyTorch code:
// - Input: 5 nodes
// - Layer1: Linear(5, 10) + ReLU
// - Layer2: Linear(10, 10) + ReLU  
// - Layer3: Linear(10, 1) (output)
// - Skip connection: Linear(10, 1) from layer1 to output
// - Final output: layer3_output + skip_output

export const mockNetworkData = {
  layers: [
    {
      name: "Input Layer (5 nodes)",
      nodes: Array.from({ length: 5 }, (_, i) => ({
        id: `I${i + 1}`,
        type: "input",
        bias: 0,
        activation: "Linear",
        description: `Input node ${i + 1}`
      }))
    },
    {
      name: "Layer 1: Linear(5→10) + ReLU",
      nodes: Array.from({ length: 10 }, (_, i) => ({
        id: `L1_${i + 1}`,
        type: "hidden",
        bias: Math.random() * 0.2 - 0.1,
        activation: "ReLU",
        learningRate: 0.01,
        description: `Hidden layer 1, node ${i + 1}`
      }))
    },
    {
      name: "Layer 2: Linear(10→10) + ReLU",
      nodes: Array.from({ length: 10 }, (_, i) => ({
        id: `L2_${i + 1}`,
        type: "hidden",
        bias: Math.random() * 0.2 - 0.1,
        activation: "ReLU",
        learningRate: 0.01,
        description: `Hidden layer 2, node ${i + 1}`
      }))
    },
    {
      name: "Output Layer: Linear(10→1) + Skip",
      nodes: [
        {
          id: "Output",
          type: "output",
          bias: 0.0,
          activation: "Linear",
          learningRate: 0.01,
          description: "Final output = Layer3(Layer2(Layer1(x))) + SkipConnection(Layer1(x))"
        }
      ]
    }
  ],
  skipConnections: [
    // Skip connection from Layer1 to Output (bypassing Layer2)
    // This represents the skip_connection = nn.Linear(10, 1) in the PyTorch code
    ...Array.from({ length: 10 }, (_, i) => ({
      from: 1, // from Layer1 (index 1)
      fromNode: i, // from each node in Layer1
      to: 3, // to Output Layer (index 3)
      toNode: 0, // to the single output node
      weight: Math.random() * 0.4 - 0.2,
      description: `Skip connection from L1_${i + 1} to Output`
    }))
  ],
  architecture: {
    framework: "PyTorch",
    className: "CustomPerceptron",
    description: "Custom neural network with skip connection from Layer1 to Output",
    forwardPass: [
      "out1 = ReLU(layer1(x))",
      "out2 = ReLU(layer2(out1))",
      "out3 = layer3(out2)",
      "skip_out = skip_connection(out1)",
      "return out3 + skip_out"
    ],
    parameterCount: {
      layer1: 5 * 10 + 10, // weights + bias
      layer2: 10 * 10 + 10, // weights + bias
      layer3: 10 * 1 + 1, // weights + bias
      skip_connection: 10 * 1 + 1, // weights + bias
      total: (5 * 10 + 10) + (10 * 10 + 10) + (10 * 1 + 1) + (10 * 1 + 1)
    }
  }
};