import { motion } from 'framer-motion';

export function Card({ title, children, actions }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-white p-4 shadow-sm"
    >
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div>{actions}</div>
        </div>
      )}
      {children}
    </motion.section>
  );
}

export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input(props) {
  return (
    <input
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-blue-200 placeholder:text-gray-400 focus:ring-2"
      {...props}
    />
  );
}

export function Select(props) {
  return (
    <select
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-blue-200 focus:ring-2"
      {...props}
    />
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <p className="font-medium text-gray-700">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

export function Pill({ children, tone = 'default' }) {
  const toneClass =
    tone === 'success'
      ? 'bg-emerald-100 text-emerald-700'
      : tone === 'danger'
      ? 'bg-red-100 text-red-700'
      : 'bg-gray-100 text-gray-700';
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${toneClass}`}>{children}</span>;
}
