import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '@repo/auth';
import { App } from './App';
import { AppUIProvider } from './ui-providers';
import { loginScopes, mockUser, msal } from './auth';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');

createRoot(container).render(
  <StrictMode>
    <AuthProvider msal={msal} loginScopes={loginScopes} mockUser={mockUser}>
      <AppUIProvider>
        <App />
      </AppUIProvider>
    </AuthProvider>
  </StrictMode>,
);
