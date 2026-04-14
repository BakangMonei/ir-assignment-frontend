import { motion } from 'framer-motion';

export function Card({ title, children, actions }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-cyan-400/20 bg-slate-900/70 p-4 shadow-[0_0_30px_rgba(34,211,238,0.08)] backdrop-blur"
    >
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <div>{actions}</div>
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function Spinner({ className = 'h-4 w-4 border-2' }) {
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-cyan-200/30 border-t-cyan-100 ${className}`}
      aria-hidden
    />
  );
}

export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`rounded-md border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 ${className}`}
      {...props}
    />
  );
}

export function Select({ className = '', ...props }) {
  return (
    <select
      className={`w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 focus:border-cyan-300 focus:ring-2 ${className}`}
      {...props}
    />
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-md border border-dashed border-slate-600 bg-slate-900/40 p-6 text-center">
      <p className="font-medium text-slate-200">{title}</p>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
  );
}

export function Pill({ children, tone = 'default' }) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
      : tone === 'danger'
        ? 'bg-red-500/20 text-red-300 border border-red-400/30'
        : tone === 'warning'
          ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30';
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${toneClass}`}>{children}</span>
  );
}
