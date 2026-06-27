import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import "leaflet/dist/leaflet.css";
import { RepositoryProvider } from './services/repository.ts';
import { AuthProvider } from './context/AuthContext.tsx';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RepositoryProvider>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </RepositoryProvider>
  </StrictMode>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("Service Worker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}

