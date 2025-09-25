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

(async () => {
  await pca.initialize();

  try {
    if (window.location.hash) {
      await pca.handleRedirectPromise();
    }
  } catch (e: any) {
    if (e?.errorCode !== "hash_empty_error") {
      console.error("MSAL redirect error:", e);
    }
  }

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
})();
