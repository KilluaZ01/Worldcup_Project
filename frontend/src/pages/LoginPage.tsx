import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, register, isLoggedIn, getCurrentUser } from "../lib/api";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e?: any) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      // fetch user
      await getCurrentUser();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-800/80 p-6 shadow-glow">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-slate-400">
          Sign in to continue to Bet Tracker
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleLogin}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <p className="mt-4 text-sm text-slate-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-400">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
