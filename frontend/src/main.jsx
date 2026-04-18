import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { SimpleModeProvider } from './context/SimpleModeContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <SimpleModeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SimpleModeProvider>
    </ThemeProvider>
  </StrictMode>
);