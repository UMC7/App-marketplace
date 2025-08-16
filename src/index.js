// src/index.js

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext'; // ✅ proveedor carrito
import { UnreadMessagesProvider } from './context/UnreadMessagesContext'; // ✅ proveedor mensajes no leídos
import { FavoritesProvider } from './context/FavoritesContext'; // ✅ proveedor favoritos

import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CarritoProvider> {/* ✅ envolvemos la app en el proveedor del carrito */}
        <UnreadMessagesProvider> {/* ✅ envolvemos la app en el proveedor de mensajes */}
          <FavoritesProvider> {/* ✅ envolvemos la app en el proveedor de favoritos */}
            <App />
          </FavoritesProvider>
        </UnreadMessagesProvider>
      </CarritoProvider>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();