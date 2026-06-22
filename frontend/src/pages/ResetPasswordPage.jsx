import { ArrowRight, KeyRound } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import logo from "../assets/kavach-logo.jpeg";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";

const ResetPasswordPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const token = searchParams.get("token") || "";

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("This password reset link is invalid.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.resetPassword({ token, password });
      toast.success(response.data.message || "Password reset successfully.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <img src={logo} alt="Kavach System" className="h-12 w-12 rounded-lg object-contain" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Secure Access</p>
            <h1 className="font-display text-3xl text-body">Set a new password</h1>
          </div>
        </div>

        <p className="mt-6 text-sm leading-6 text-slate-500">Choose a strong password with at least eight characters, an uppercase letter, lowercase letter, and number.</p>

        <label className="mt-6 block space-y-2 text-sm font-medium text-body">
          New Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <label className="mt-5 block space-y-2 text-sm font-medium text-body">
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !token}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          <KeyRound size={16} />
          {loading ? "Resetting Password..." : "Reset Password"}
          <ArrowRight size={16} />
        </button>

        <Link to="/login" className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">
          Back to sign in
        </Link>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
