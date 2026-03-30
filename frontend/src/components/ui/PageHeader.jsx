const PageHeader = ({ eyebrow, title, description, action }) => (
  <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl text-body">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
    </div>
    {action}
  </div>
);

export default PageHeader;
