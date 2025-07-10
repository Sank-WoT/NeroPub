import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { mockNetworkData } from '../utils/mockData';
import NodeEditor from './NodeEditor';
import './NeuralNetworkVisualization.css';

const NeuralNetworkVisualization = () => {
  const svgRef = useRef();
  const [selectedNode, setSelectedNode] = useState(null);
  const [networkData, setNetworkData] = useState(mockNetworkData);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 1400;
    const height = 900;
    const margin = { top: 80, right: 50, bottom: 50, left: 50 };

    svg.attr("width", width).attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Create layers with special positioning for large layers
    const layerWidth = (width - margin.left - margin.right) / networkData.layers.length;
    const layers = networkData.layers.map((layer, layerIndex) => {
      const availableHeight = height - margin.top - margin.bottom;
      const nodeCount = layer.nodes.length;
      
      // For large layers, arrange nodes in a more compact way
      if (nodeCount > 10) {
        const nodesPerColumn = Math.ceil(Math.sqrt(nodeCount));
        const columns = Math.ceil(nodeCount / nodesPerColumn);
        const columnWidth = layerWidth * 0.6 / columns;
        const rowHeight = availableHeight / nodesPerColumn;
        
        return layer.nodes.map((node, nodeIndex) => {
          const column = Math.floor(nodeIndex / nodesPerColumn);
          const row = nodeIndex % nodesPerColumn;
          
          return {
            ...node,
            x: layerIndex * layerWidth + layerWidth / 2 - (columns - 1) * columnWidth / 2 + column * columnWidth,
            y: row * rowHeight + rowHeight / 2,
            layerIndex,
            nodeIndex
          };
        });
      } else {
        // For smaller layers, use vertical arrangement
        const nodeHeight = availableHeight / nodeCount;
        return layer.nodes.map((node, nodeIndex) => ({
          ...node,
          x: layerIndex * layerWidth + layerWidth / 2,
          y: nodeIndex * nodeHeight + nodeHeight / 2,
          layerIndex,
          nodeIndex
        }));
      }
    }).flat();

    // Create connections
    const connections = [];
    networkData.layers.forEach((layer, layerIndex) => {
      if (layerIndex < networkData.layers.length - 1) {
        layer.nodes.forEach((node, nodeIndex) => {
          const sourceNode = layers.find(n => n.layerIndex === layerIndex && n.nodeIndex === nodeIndex);
          networkData.layers[layerIndex + 1].nodes.forEach((targetNode, targetIndex) => {
            const targetNodeData = layers.find(n => n.layerIndex === layerIndex + 1 && n.nodeIndex === targetIndex);
            connections.push({
              source: sourceNode,
              target: targetNodeData,
              weight: Math.random() * 2 - 1,
              type: 'regular'
            });
          });
        });
      }
    });

    // Add skip connections
    networkData.skipConnections.forEach(skip => {
      const sourceNode = layers.find(n => n.layerIndex === skip.from && n.nodeIndex === skip.fromNode);
      const targetNode = layers.find(n => n.layerIndex === skip.to && n.nodeIndex === skip.toNode);
      if (sourceNode && targetNode) {
        connections.push({
          source: sourceNode,
          target: targetNode,
          weight: skip.weight,
          type: 'skip'
        });
      }
    });

    // Draw connections
    g.selectAll(".connection")
      .data(connections)
      .enter().append("line")
      .attr("class", d => `connection ${d.type}`)
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y)
      .attr("stroke", d => d.type === 'skip' ? '#e74c3c' : '#34495e')
      .attr("stroke-width", d => Math.abs(d.weight) * 2 + 0.5)
      .attr("stroke-opacity", d => Math.abs(d.weight) * 0.7 + 0.3)
      .attr("stroke-dasharray", d => d.type === 'skip' ? "5,5" : null);

    // Draw nodes with different sizes based on layer type
    const nodeGroups = g.selectAll(".node")
      .data(layers)
      .enter().append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    nodeGroups.append("circle")
      .attr("r", d => {
        if (d.type === 'input') return 12;
        if (d.type === 'output') return 20;
        return 8; // hidden nodes are smaller for better visibility
      })
      .attr("fill", d => {
        switch(d.type) {
          case 'input': return '#3498db';
          case 'output': return '#e74c3c';
          default: return '#2ecc71';
        }
      })
      .attr("stroke", "#2c3e50")
      .attr("stroke-width", 1.5);

    // Only show node IDs for input and output layers for clarity
    nodeGroups.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", d => d.type === 'output' ? "12px" : "8px")
      .attr("font-weight", "bold")
      .text(d => {
        if (d.type === 'input') return `I${d.id.split('I')[1]}`;
        if (d.type === 'output') return 'OUT';
        return ''; // Don't show text for hidden nodes to avoid clutter
      });

    // Only show activation labels for input and output layers
    nodeGroups.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => d.type === 'output' ? "35px" : "25px")
      .attr("fill", "#2c3e50")
      .attr("font-size", "9px")
      .text(d => {
        if (d.type === 'input' || d.type === 'output') {
          return d.activation || 'Linear';
        }
        return ''; // Don't show for hidden nodes
      });

    // Add bias display
    nodeGroups.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-35px")
      .attr("fill", "#7f8c8d")
      .attr("font-size", "9px")
      .text(d => `b: ${d.bias?.toFixed(2) || '0.00'}`);

    // Click handler for nodes
    nodeGroups.on("click", function(event, d) {
      event.stopPropagation();
      setSelectedNode(d);
      setShowEditor(true);
    });

    // Drag functions
    function dragstarted(event, d) {
      d3.select(this).raise().classed("active", true);
    }

    function dragged(event, d) {
      d.x = event.x;
      d.y = event.y;
      d3.select(this).attr("transform", `translate(${d.x},${d.y})`);
      
      // Update connections
      g.selectAll(".connection")
        .filter(conn => conn.source.id === d.id || conn.target.id === d.id)
        .attr("x1", conn => conn.source.x)
        .attr("y1", conn => conn.source.y)
        .attr("x2", conn => conn.target.x)
        .attr("y2", conn => conn.target.y);
    }

    function dragended(event, d) {
      d3.select(this).classed("active", false);
    }

    // Add layer labels and PyTorch layer information
    networkData.layers.forEach((layer, index) => {
      const layerGroup = g.append("g");
      
      // Layer name
      layerGroup.append("text")
        .attr("x", index * layerWidth + layerWidth / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("font-weight", "bold")
        .attr("fill", "#2c3e50")
        .text(layer.name);
      
      // Node count
      layerGroup.append("text")
        .attr("x", index * layerWidth + layerWidth / 2)
        .attr("y", -25)
        .attr("text-anchor", "middle")
        .attr("font-size", "11px")
        .attr("fill", "#7f8c8d")
        .text(`${layer.nodes.length} nodes`);
    });

    // Add PyTorch code reference
    g.append("text")
      .attr("x", (width - margin.left - margin.right) / 2)
      .attr("y", height - margin.top - margin.bottom + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .attr("fill", "#e74c3c")
      .text("PyTorch: return layer3(layer2(layer1(x))) + skip_connection(layer1(x))");

  }, [networkData]);

  const handleNodeUpdate = (updatedNode) => {
    setNetworkData(prev => ({
      ...prev,
      layers: prev.layers.map(layer => ({
        ...layer,
        nodes: layer.nodes.map(node => 
          node.id === updatedNode.id ? updatedNode : node
        )
      }))
    }));
    setShowEditor(false);
    setSelectedNode(null);
  };

  return (
    <div className="neural-network-container">
      <header className="network-header">
        <h1>PyTorch CustomPerceptron Visualization</h1>
        <p>Based on your neural network code • Click nodes to modify • Drag to reposition</p>
        <div className="pytorch-code-info">
          <code>
            Input(10) → Layer1(50) → Layer2(50) → Output(1) + Skip(Layer1→Output)
          </code>
        </div>
      </header>
      
      <div className="network-controls">
        <button 
          className="control-btn"
          onClick={() => setNetworkData(mockNetworkData)}
        >
          Reset Network
        </button>
        <button 
          className="control-btn"
          onClick={() => {
            // Add animation to show data flow
            const connections = document.querySelectorAll('.connection');
            connections.forEach((conn, index) => {
              setTimeout(() => {
                conn.style.strokeOpacity = '1';
                conn.style.strokeWidth = '3px';
                setTimeout(() => {
                  conn.style.strokeOpacity = '0.7';
                  conn.style.strokeWidth = '1px';
                }, 500);
              }, index * 100);
            });
          }}
        >
          Animate Flow
        </button>
      </div>

      <div className="network-svg-container">
        <svg ref={svgRef}></svg>
      </div>

      {showEditor && selectedNode && (
        <NodeEditor
          node={selectedNode}
          onUpdate={handleNodeUpdate}
          onClose={() => {
            setShowEditor(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
};

export default NeuralNetworkVisualization;