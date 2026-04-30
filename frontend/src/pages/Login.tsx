import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, TrendingUp, Mail, Phone, MessageCircle,
  BarChart3, Zap, ShieldCheck, Globe, ChevronRight,
} from 'lucide-react';

/* ── animated background blobs ─────────────────────────────────────────────── */
function BgBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* large slow blob top-left */}
      <div
        className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, hsl(130,70%,55%), transparent 70%)',
          animation: 'blobFloat 14s ease-in-out infinite',
        }}
      />
      {/* medium blob bottom-right */}
      <div
        className="absolute -bottom-24 -right-24 w-[400px] h-[400px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, hsl(160,65%,45%), transparent 70%)',
          animation: 'blobFloat 18s ease-in-out infinite reverse',
        }}
      />
      {/* small accent blob center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, hsl(90,80%,60%), transparent 70%)',
          animation: 'blobFloat 10s ease-in-out infinite',
        }}
      />
      {/* grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(130,60%,30%) 1px, transparent 1px), linear-gradient(90deg, hsl(130,60%,30%) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <style>{`
        @keyframes blobFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(30px,-20px) scale(1.05); }
          66%      { transform: translate(-20px,25px) scale(0.97); }
        }
      `}</style>
    </div>
  );
}

/* ── feature pill ───────────────────────────────────────────────────────────── */
function FeaturePill({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1.5 text-xs text-white/90">
      <span className="text-green-300">{icon}</span>
      {text}
    </div>
  );
}

/* ── contact row ────────────────────────────────────────────────────────────── */
function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0 text-green-200">
        {icon}
      </div>
      <div>
        <p className="text-xs text-white/50 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm text-white/90 font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

/* ── main component ─────────────────────────────────────────────────────────── */
export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/', { replace: true });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const detail = (err.response?.data as { detail?: string } | undefined)?.detail;
        setError(detail ?? (!err.response ? 'Cannot reach backend.' : 'Invalid email or password'));
      } else {
        setError('Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch">

      {/* ── LEFT PANEL — AI background + info ─────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-10 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, hsl(150,55%,12%) 0%, hsl(140,50%,18%) 40%, hsl(130,55%,22%) 100%)',
        }}
      >
        <BgBlobs />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-400/20 border border-green-400/30 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-green-300" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">PriceAI</p>
            <p className="text-green-400/70 text-xs">Dynamic Pricing System</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Intelligent Pricing,<br />
              <span className="text-green-300">Powered by AI</span>
            </h1>
            <p className="mt-3 text-white/60 text-sm leading-relaxed max-w-sm">
              Real-time demand forecasting, price elasticity modeling, and
              automated optimization — all in one platform.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            <FeaturePill icon={<Zap className="h-3 w-3" />} text="Real-time ingestion" />
            <FeaturePill icon={<BarChart3 className="h-3 w-3" />} text="Demand forecasting" />
            <FeaturePill icon={<ShieldCheck className="h-3 w-3" />} text="Rule-based safeguards" />
            <FeaturePill icon={<Globe className="h-3 w-3" />} text="Market simulation" />
          </div>

          {/* Pricing formula card */}
          <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-xl p-4">
            <p className="text-xs text-green-400/80 font-semibold uppercase tracking-wide mb-2">
              Core Pricing Formula
            </p>
            <code className="text-green-200 text-sm font-mono">
              price = base × demand × elasticity
            </code>
            <div className="mt-2 flex gap-4 text-xs text-white/50">
              <span>min = 0.5 × base</span>
              <span>max = 2.0 × base</span>
            </div>
          </div>
        </div>

        {/* Contact / Help panel */}
        <div className="relative z-10 space-y-4">
          <div className="h-px bg-white/10" />
          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold">
            Help &amp; Support
          </p>
          <div className="space-y-3">
            <ContactRow
              icon={<Mail className="h-4 w-4" />}
              label="Email Support"
              value="glauniversity@gmail.com"
            />
            <ContactRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone / WhatsApp"
              value="+91 98765 43210"
            />
            <ContactRow
              icon={<MessageCircle className="h-4 w-4" />}
              label="Live Chat"
              value="Available Mon–Fri, 9 AM – 6 PM IST"
            />
          </div>
          <p className="text-xs text-white/30 pt-1">
            © 2026 PriceAI · Dynamic Pricing Optimization System
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login form ───────────────────────────────────────── */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-12 relative bg-white"
      >
        {/* subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(hsl(130,60%,30%) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 w-full max-w-md space-y-8">

          {/* Mobile logo (shown only on small screens) */}
          <div className="flex lg:hidden items-center gap-3 justify-center">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <p className="font-bold text-xl text-foreground">PriceAI</p>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to your account to continue
            </p>
          </div>

          {/* Demo credentials badge */}
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
            <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
            <p className="text-xs text-gray-600">
              Demo: <span className="font-semibold text-gray-900">admin@example.com</span>
              {' / '}
              <span className="font-semibold text-gray-900">admin123</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-800">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-800">
                  Password
                </Label>
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline"
                >
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Signing in…</>
              ) : (
                <>Sign in <ChevronRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 font-semibold hover:text-green-700 hover:underline">
              Create one free
            </Link>
          </p>

          {/* Mobile help section */}
          <div className="lg:hidden border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Help &amp; Support
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4 text-green-600" />
                glauniversity@gmail.com
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4 text-green-600" />
                +91 98765 43210
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MessageCircle className="h-4 w-4 text-green-600" />
                Live Chat: Mon–Fri, 9 AM–6 PM IST
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
