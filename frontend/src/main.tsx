import React from "react";
import ReactDOM from "react-dom/client";
import { MsalProvider } from "@azure/msal-react";
import { pca } from "./auth/msal";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./shell/App";
import "./index.css";
import { CartProvider } from "./cart/CartContext";
import { ToastProvider } from "./ui/toast";

const router = createBrowserRouter([
  { path: "/*", element: <App /> }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MsalProvider instance={pca}>
      <CartProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </CartProvider>
    </MsalProvider>
  </React.StrictMode>
);
