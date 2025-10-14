/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_AAD_CLIENT_ID: string;
  readonly VITE_AAD_TENANT_ID: string;
  readonly VITE_API_SCOPE: string;
  readonly VITE_REDIRECT_URI: string;

  // 👇 novas
  readonly VITE_LIMIT_KG_MES?: string;
  readonly VITE_QTD_MINIMA_PADRAO?: string;
  readonly VITE_PEDIDOS_EDIT_WINDOW_OPENING_DAY?: string;
  readonly VITE_PEDIDOS_EDIT_WINDOW_CLOSING_DAY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
