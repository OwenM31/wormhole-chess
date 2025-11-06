import React from "react";
import ChessboardScene from "./components/ChessboardScene";

const App: React.FC = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ChessboardScene />
    </div>
  );
};

export default App;
