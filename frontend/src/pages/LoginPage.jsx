import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import logo from "../assets/indian-logo.png";
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
    <div className="min-h-screen bg-page px-4 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-soft lg:grid-cols-[1.05fr,0.95fr]">
        <section className="relative overflow-hidden bg-sidebar px-8 py-10 text-white lg:px-12 lg:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.35),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(211,47,47,0.35),_transparent_30%)]" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="rounded-[24px] bg-white/10 p-3">
                <img src={logo} alt="Indian Railways" className="h-20 w-20 object-contain" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-white/60">Railway Workflow</p>
                <h1 className="mt-2 font-display text-4xl">kavach_workflow Management</h1>
              </div>
            </div>

            <div className="mt-14 space-y-8">
              <div>
                <p className="inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                  Secure Operations Hub
                </p>
                <h2 className="mt-6 max-w-xl font-display text-5xl leading-tight">
                  Indian Railway workflow tracking built for departments, documents, and delivery control.
                </h2>
                <p className="mt-6 max-w-xl text-base leading-7 text-white/75">
                  Monitor DPR updates, design approvals, site images, and field records through a single secure command center.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  {
                    title: "Department Driven",
                    text: "Dedicated modules for each operational division with responsive dashboards.",
                    icon: ShieldCheck,
                  },
                  {
                    title: "Document Ready",
                    text: "Upload PDFs, Excel sheets, and images directly into workflow records.",
                    icon: LockKeyhole,
                  },
                ].map((feature) => (
                  <div key={feature.title} className="rounded-lg border border-white/10 bg-white/5 p-5">
                    <feature.icon className="text-white" />
                    <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/70">{feature.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 py-10 lg:px-12">
          <div className="mx-auto w-full max-w-lg">
            <div className="rounded-full bg-slate-100 p-1">
              <div className="grid grid-cols-2 gap-1">
                {["login", "register"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full px-4 py-3 text-sm font-semibold capitalize transition ${
                      activeTab === tab ? "bg-primary text-white shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "login" ? (
              <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Authorized Sign In</p>
                  <h2 className="mt-2 font-display text-4xl text-body">Access command dashboard</h2>
                </div>

                <label className="block space-y-2 text-sm font-medium text-body">
                  Email
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-body">
                  Password
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Signing In..." : "Sign In"}
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleRegister}>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary/70">Create Access</p>
                  <h2 className="mt-2 font-display text-4xl text-body">Register a new user</h2>
                </div>

                <label className="block space-y-2 text-sm font-medium text-body">
                  Full Name
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, name: event.target.value }))}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                <label className="block space-y-2 text-sm font-medium text-body">
                  Email
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) => setRegisterForm((current) => ({ ...current, email: event.target.value }))}
                    required
                    className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block space-y-2 text-sm font-medium text-body">
                    Password
                    <input
                      type="password"
                      value={registerForm.password}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, password: event.target.value }))}
                      required
                      className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  <label className="block space-y-2 text-sm font-medium text-body">
                    Role
                    <select
                      value={registerForm.role}
                      onChange={(event) => setRegisterForm((current) => ({ ...current, role: event.target.value }))}
                      className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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
                      className="w-full rounded-lg border border-border px-4 py-3 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                ) : null}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
