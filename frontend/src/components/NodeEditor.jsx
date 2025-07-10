import React, { useState } from 'react';
import './NodeEditor.css';

const NodeEditor = ({ node, onUpdate, onClose }) => {
  const [editedNode, setEditedNode] = useState({
    ...node,
    bias: node.bias || 0,
    activation: node.activation || 'ReLU',
    learningRate: node.learningRate || 0.01
  });

  const activationFunctions = ['ReLU', 'Sigmoid', 'Tanh', 'Leaky ReLU', 'ELU', 'Softmax'];

  const handleInputChange = (field, value) => {
    setEditedNode(prev => ({
      ...prev,
      [field]: field === 'bias' || field === 'learningRate' ? parseFloat(value) : value
    }));
  };

  const handleSave = () => {
    onUpdate(editedNode);
  };

  return (
    <div className="node-editor-overlay">
      <div className="node-editor">
        <div className="editor-header">
          <h3>Edit Perceptron: {node.id}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="editor-content">
          <div className="editor-section">
            <h4>Node Properties</h4>
            
            <div className="input-group">
              <label>Node ID:</label>
              <input
                type="text"
                value={editedNode.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                className="editor-input"
              />
            </div>

            <div className="input-group">
              <label>Bias:</label>
              <input
                type="number"
                step="0.01"
                value={editedNode.bias}
                onChange={(e) => handleInputChange('bias', e.target.value)}
                className="editor-input"
              />
            </div>

            <div className="input-group">
              <label>Activation Function:</label>
              <select
                value={editedNode.activation}
                onChange={(e) => handleInputChange('activation', e.target.value)}
                className="editor-select"
              >
                {activationFunctions.map(func => (
                  <option key={func} value={func}>{func}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Learning Rate:</label>
              <input
                type="number"
                step="0.001"
                value={editedNode.learningRate}
                onChange={(e) => handleInputChange('learningRate', e.target.value)}
                className="editor-input"
              />
            </div>
          </div>

          <div className="editor-section">
            <h4>Node Type</h4>
            <div className="node-type-indicator">
              <span className={`type-badge ${editedNode.type}`}>
                {editedNode.type?.toUpperCase() || 'HIDDEN'}
              </span>
            </div>
          </div>

          <div className="editor-section">
            <h4>Current Position</h4>
            <div className="position-info">
              <span>X: {Math.round(editedNode.x || 0)}</span>
              <span>Y: {Math.round(editedNode.y || 0)}</span>
            </div>
          </div>
        </div>

        <div className="editor-actions">
          <button className="save-btn" onClick={handleSave}>
            Save Changes
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;