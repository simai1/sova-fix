/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WEB_URL: string;
  readonly VITE_OBJECTS_LIMIT: number | null;
  readonly VITE_UNITS_LIMIT: number | null;
  readonly VITE_PICTURE_NAME: string;
  readonly VITE_GLOBAL_OPEN_TO_BLOCK: string;
  readonly VITE_GLOBAL_OPEN_REPORT_BLOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
