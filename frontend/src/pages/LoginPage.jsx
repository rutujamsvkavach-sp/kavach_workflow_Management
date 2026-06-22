import { ArrowRight, BadgeCheck, BriefcaseBusiness, Files, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import logo from "../assets/kavach-logo.jpeg";
import { useAuth } from "../context/AuthContext";

const initialRegisterState = {
  name: "",
  email: "",
  password: "",
  role: "staff",
  adminSecret: "",
};

const LoginPage = () => {
  const { isAuthenticated, login, register, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState(initialRegisterState);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      await login(loginForm);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to sign in.");
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    try {
      await register(registerForm);
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to register.");
    }
  };

  return (
    <div className="min-h-screen bg-page px-4 py-5 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1440px] overflow-hidden rounded-[32px] border border-white/80 bg-card shadow-soft lg:grid-cols-[1.1fr,0.9fr]">
        <section className="relative overflow-hidden bg-sidebar px-8 py-9 text-white sm:px-12 lg:px-14 lg:py-12">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#8FB7C9]/25 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#DDAE87]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_45%,transparent_100%)]" />
          <div className="relative flex min-h-full flex-col">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-2 shadow-lg shadow-slate-950/20">
                <img src={logo} alt="Kavach System" className="h-16 w-16 rounded-xl object-cover" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/60">Kavach System</p>
                <h1 className="mt-1 font-display text-3xl leading-tight">Project Management System</h1>
              </div>
            </div>

            <div className="my-auto max-w-2xl py-14 lg:py-16">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
                <BadgeCheck size={15} />
                Authorized operations portal
              </div>
              <h2 className="mt-7 font-display text-5xl leading-[1.08] text-white sm:text-6xl">
                Real-Time Project Visibility &amp; Progress Tracking
              </h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                A controlled workspace for DPR, design approvals, field documentation, site evidence, and delivery coordination.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Department control", icon: BriefcaseBusiness },
                { label: "Document traceability", icon: Files },
                { label: "Protected access", icon: ShieldCheck },
              ].map((feature) => (
                <div key={feature.label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <feature.icon size={18} className="text-[#D9EAF1]" />
                  <p className="mt-5 text-sm font-semibold leading-5 text-white">{feature.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex items-center px-6 py-10 sm:px-10 lg:px-14">
          <div className="absolute right-8 top-8 hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/70 lg:flex">
            <LockKeyhole size={14} /> Secure access
          </div>
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/70">Welcome</p>
              <h2 className="mt-2 font-display text-4xl text-body">{activeTab === "login" ? "Sign in to your workspace" : "Request system access"}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{activeTab === "login" ? "Use your approved project account to continue." : "Register a staff or authorized administrator account."}</p>
            </div>

            <div className="rounded-2xl bg-primary/10 p-1.5">
              <div className="grid grid-cols-2 gap-1">
                {["login", "register"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold capitalize transition ${
                      activeTab === tab ? "bg-card text-primary shadow-sm" : "text-slate-500 hover:text-primary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "login" ? (
              <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                <label className="block space-y-2 text-sm font-medium text-body">
                  Email
                  <span className="relative block">
                    <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" />
                    <input type="email" value={loginForm.email} onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))} required placeholder="name@organization.com" className="w-full rounded-xl border border-border bg-white px-11 py-3.5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
                  </span>
                </label>

                <label className="block space-y-2 text-sm font-medium text-body">
                  Password
                  <span className="relative block">
                    <KeyRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" />
                    <input type="password" value={loginForm.password} onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))} required placeholder="Enter your password" className="w-full rounded-xl border border-border bg-white px-11 py-3.5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing In..." : "Sign In"}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                <label className="block space-y-2 text-sm font-medium text-body">
                  Full Name
                  <span className="relative block"><UserRound size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" /><input type="text" value={registerForm.name} onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))} required placeholder="Full name" className="w-full rounded-xl border border-border bg-white px-11 py-3.5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" /></span>
                </label>

                <label className="block space-y-2 text-sm font-medium text-body">
                  Email
                  <span className="relative block"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/60" /><input type="email" value={registerForm.email} onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))} required placeholder="name@organization.com" className="w-full rounded-xl border border-border bg-white px-11 py-3.5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10" /></span>
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block space-y-2 text-sm font-medium text-body">
                    Password
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                      required
                      placeholder="Create password"
                      className="w-full rounded-xl border border-border bg-white px-4 py-3.5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </label>

                  <label className="block space-y-2 text-sm font-medium text-body">
                    Role
                    <select
                      value={registerForm.role}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, role: event.target.value }))}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3.5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                </div>

                {registerForm.role === "admin" ? (
                  <label className="block space-y-2 text-sm font-medium text-body">
                    Admin Registration Secret
                    <input
                      type="password"
                      value={registerForm.adminSecret}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, adminSecret: event.target.value }))}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3.5 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </label>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
            <p className="mt-8 text-center text-xs leading-5 text-slate-400">Protected access for approved project staff and authorized administrators.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
