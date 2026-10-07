import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ReduxProvider } from "./redux/provider.tsx";
import { LanguageProvider } from "./i18n/index.tsx";
import { TextTranslator } from "./components/text-translator.tsx";
import { Toaster } from "./components/ui/sonner.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ReduxProvider>
      <LanguageProvider>
        <TextTranslator />
    <Toaster richColors position="top-right" />
        <App />
      </LanguageProvider>
    </ReduxProvider>
  </StrictMode>,
);
  