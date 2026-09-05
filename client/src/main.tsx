import { createRoot } from "react-dom/client";
import App from "./App";
import { initAnalytics } from "./lib/analytics";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
initAnalytics();
