import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Mantienes tu CSS global
import App from './App';
import reportWebVitals from './reportWebVitals'; // También mantenemos el performance
import { AuthProvider } from './context/AuthContext'; // Nuevo: Importamos el contexto de autenticación

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider> {/* Envolvemos la App dentro del AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// Seguimos midiendo el performance si quieres
reportWebVitals();