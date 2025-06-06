import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext'; // ✅ nuevo

import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CarritoProvider> {/* ✅ envolvemos la app en el proveedor del carrito */}
        <App />
      </CarritoProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();