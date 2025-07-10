import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NeuralNetworkVisualization from "./components/NeuralNetworkVisualization";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NeuralNetworkVisualization />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;