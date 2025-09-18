// Buffer polyfill for browser
import { Buffer } from "buffer";
window.Buffer = window.Buffer || Buffer;
if (typeof global === "undefined") {
  window.global = window;
}

import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./styles/qr-scanner.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
