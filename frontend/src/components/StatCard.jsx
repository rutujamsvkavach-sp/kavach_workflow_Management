const StatCard = ({ label, value, hint, accent = "primary" }) => (
  <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${accent === "accent" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
      {label}
    </div>
    <p className="mt-4 font-display text-4xl text-body">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{hint}</p>
  </div>
);

export default StatCard;
