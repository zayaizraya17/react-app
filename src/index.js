import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';

// Получаем корневой элемент
const container = document.getElementById('root');

if (!container) {
  // Создаем элемент, если он не существует
  const rootDiv = document.createElement('div');
  rootDiv.id = 'root';
  document.body.appendChild(rootDiv);
  
  const root = createRoot(rootDiv);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}