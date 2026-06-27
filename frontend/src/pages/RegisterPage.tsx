import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register, login, getCurrentUser } from "../lib/api";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e?: any) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(email, password);
      // auto-login
      await login(email, password);
      await getCurrentUser();
      navigate("/rooms");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ?? err?.message ?? "Register failed",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-800/80 p-6 shadow-glow">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create an account to save rooms and bets
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleRegister}>
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
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <p className="mt-4 text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/" className="text-blue-400">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
