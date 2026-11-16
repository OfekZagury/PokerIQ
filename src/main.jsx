import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter, useLocation } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { analyticsInit, page } from "@/lib/analytics";
import { DEMO_MODE } from "@/lib/demo";

analyticsInit();

// Static hosts (GitHub Pages) can't serve deep links like /game3 on refresh,
// so the demo build uses hash URLs (/#/game3).
const Router = DEMO_MODE ? HashRouter : BrowserRouter;

function PageViewTracker() {
  const loc = useLocation();
  React.useEffect(() => {
    page(loc.pathname);
  }, [loc.pathname]);
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <PageViewTracker />
      <App />
    </Router>
  </React.StrictMode>
);
