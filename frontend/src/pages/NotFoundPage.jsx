import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="max-w-xl rounded-lg border border-border bg-card p-10 text-center shadow-soft">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">404</p>
      <h1 className="mt-4 font-display text-4xl text-body">Page not found</h1>
      <p className="mt-4 text-sm leading-6 text-slate-500">
        The requested kavach_workflow Management module could not be found. Return to the dashboard to continue managing workflow records.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-hover"
      >
        Go to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
