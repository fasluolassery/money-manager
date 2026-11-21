import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { Providers } from "./app/providers.js";
import { router } from "./app/router.js";
import "./styles.css";

const rootEl = document.getElementById("root");
if (rootEl === null) throw new Error("root element not found");

createRoot(rootEl).render(
  <React.StrictMode>
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  </React.StrictMode>,
);
