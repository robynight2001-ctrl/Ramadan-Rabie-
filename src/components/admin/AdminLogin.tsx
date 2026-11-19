import {ArrowLeft, Lock, ShieldCheck} from 'lucide-react';
import {useState} from 'react';
import {loginAdmin} from '../../lib/api.ts';

interface AdminLoginProps {
  onSuccess: (username: string) => void;
  onBackHome: () => void;
}

export function AdminLogin({onSuccess, onBackHome}: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginAdmin(username.trim(), password);
      onSuccess(res.username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#08090D] px-6 py-12">
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full opacity-25 blur-[120px]"
        style={{background: 'radial-gradient(circle, rgba(139,92,246,0.5), transparent 70%)'}}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md">
        <button
          type="button"
          onClick={onBackHome}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#9CA3AF] transition-colors hover:text-[#F5F5F7]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Portfolio</span>
        </button>

        <div className="rounded-2xl border border-white/[0.08] bg-[#11131B]/90 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#A855F7]">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-[#F5F5F7]">Settings</h1>
              <p className="text-xs text-[#9CA3AF]">Sign in to manage portfolio content</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-medium text-[#9CA3AF] mb-2"
              >
                Username
              </label>
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter admin username"
                className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-3 text-sm text-[#F5F5F7] placeholder-[#9CA3AF]/45 focus:border-[#8B5CF6] focus:outline-none"
                required
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#9CA3AF] mb-2"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-white/[0.1] bg-[#08090D] px-4 py-3 text-sm text-[#F5F5F7] placeholder-[#9CA3AF]/45 focus:border-[#8B5CF6] focus:outline-none"
                required
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-200"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>{loading ? 'Signing in...' : 'Sign In to Settings'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
