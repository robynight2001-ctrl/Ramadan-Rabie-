import {ArrowLeft, Lock, ShieldCheck} from 'lucide-react';
import {useState} from 'react';
import {loginAdminWithGoogle} from '../../lib/api.ts';

interface AdminLoginProps {
  onSuccess: (username: string) => void;
  onBackHome: () => void;
}

export function AdminLogin({onSuccess, onBackHome}: AdminLoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await loginAdminWithGoogle();
      onSuccess(user.displayName || user.email || 'Admin');
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
              <p className="text-xs text-[#9CA3AF]">Administrator sign-in required</p>
            </div>
          </div>

          <p className="mt-6 text-sm leading-relaxed text-[#9CA3AF]">
            Sign in with your verified administrator Google account to manage portfolio projects,
            media, services, and website publishing.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-200"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="mt-6 flex min-h-[46px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <span>{loading ? 'Signing in...' : 'Sign In with Google'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
