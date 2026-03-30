export const Spinner = ({ label = "Loading..." }) => (
  <div className="flex items-center justify-center gap-3 py-10 text-body">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
    <span className="text-sm font-medium">{label}</span>
  </div>
);
