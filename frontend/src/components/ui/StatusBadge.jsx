const statusStyles = {
  admin: "bg-primary/10 text-primary",
  staff: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-accent/10 text-accent",
};

const StatusBadge = ({ label, variant }) => (
  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[variant] || "bg-slate-100 text-slate-600"}`}>
    {label}
  </span>
);

export default StatusBadge;
