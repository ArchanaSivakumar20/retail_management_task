import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AllCommunityModule } from 'ag-grid-community';
import { AgGridProvider } from 'ag-grid-react';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css'
import App from './App.jsx'

const modules = [AllCommunityModule];

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key — add VITE_CLERK_PUBLISHABLE_KEY to your .env file");
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <AgGridProvider modules={modules}>
        <App />
      </AgGridProvider>
    </ClerkProvider>
  </StrictMode>
);