import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, useLocation } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { analyticsInit, page } from "@/lib/analytics";

analyticsInit();

function PageViewTracker() {
  const loc = useLocation();
  React.useEffect(() => {
    page(loc.pathname);
  }, [loc.pathname]);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <PageViewTracker />
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
