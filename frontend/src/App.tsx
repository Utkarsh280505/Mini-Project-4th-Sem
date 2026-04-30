import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Products } from '@/pages/Products';
import { PricingEngine } from '@/pages/PricingEngine';
import { Analytics } from '@/pages/Analytics';
import { DataIO } from '@/pages/DataIO';

function Settings() {
  const { theme, setTheme } = useTheme();

  const [apiUrl, setApiUrl] = useState(() => {
    try {
      return localStorage.getItem('api_base_url') || '';
    } catch {
      return '';
    }
  });

  const saveApiUrl = () => {
    try {
      localStorage.setItem('api_base_url', apiUrl);
      window.location.reload();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">Configure your pricing optimization system.</p>
      </div>

      {/* Appearance */}
      <div className="p-6 border border-border rounded-lg bg-card">
        <h2 className="text-xl font-semibold text-foreground">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-1">Choose your theme preference.</p>
        <div className="mt-4 flex items-center gap-3">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                theme === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-border text-foreground hover:bg-accent'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Current theme: <span className="font-medium text-foreground">{theme}</span>
        </p>
      </div>

      {/* API URL override */}
      <div className="p-6 border border-border rounded-lg bg-card">
        <h2 className="text-xl font-semibold text-foreground">API Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Override the backend API base URL (stored locally in your browser).
        </p>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 border border-border rounded-md px-3 py-2 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://localhost:8001/api/v1"
          />
          <button
            onClick={saveApiUrl}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Save & Reload
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Default: <code className="bg-accent px-1 rounded">http://localhost:8001/api/v1</code>
        </p>
      </div>

      {/* System info */}
      <div className="p-6 border border-border rounded-lg bg-card">
        <h2 className="text-xl font-semibold text-foreground">System Information</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">System</span>
            <span className="font-medium text-foreground">Dynamic Pricing Optimization</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium text-foreground">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">ML Engine</span>
            <span className="font-medium text-foreground">Demand forecasting + Elasticity modeling</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Database</span>
            <span className="font-medium text-foreground">SQLite (dev) / PostgreSQL (prod)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes with layout */}
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/products" element={<Layout><Products /></Layout>} />
            <Route path="/pricing" element={<Layout><PricingEngine /></Layout>} />
            <Route path="/analytics" element={<Layout><Analytics /></Layout>} />
            <Route path="/data-io" element={<Layout><DataIO /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
