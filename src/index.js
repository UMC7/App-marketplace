// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // CSS global
import App from './App';
import { AuthProvider } from './context/AuthContext'; // Contexto de autenticación
import reportWebVitals from './reportWebVitals'; // Medición de rendimiento opcional

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Si quieres medir el rendimiento de tu app, pasa una función a reportWebVitals
reportWebVitals();