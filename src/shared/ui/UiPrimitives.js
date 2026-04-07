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
  return <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...props} />;
}
