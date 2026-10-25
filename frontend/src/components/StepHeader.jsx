export default function StepHeader({ step, title, hint }) {
  return (
    <div className="flex items-start gap-3">
      {step !== undefined && (
        <span
          aria-hidden="true"
          className="flex h-7 w-7 flex-none items-center justify-center rounded-sm border border-slate-800 text-sm font-semibold text-slate-900"
        >
          {step}
        </span>
      )}
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {hint && (
          <p className="mt-0.5 text-sm leading-snug text-slate-600">{hint}</p>
        )}
      </div>
    </div>
  );
}
