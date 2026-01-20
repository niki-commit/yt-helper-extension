import React from "react";
import ReactDOM from "react-dom/client";
import "../../styles/app.css";

function App() {
  return (
    <div className="flex h-[500px] w-[400px] flex-col gap-4 bg-background p-4 text-foreground">
      <h1 className="text-xl font-bold">VideoNotes</h1>
      <p className="text-muted-foreground">Extension Ready.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
