import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} [props.confirmLabel]
 * @param {boolean} [props.danger]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onClose
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onClose,
}) {
  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-xl border border-slate-600 bg-slate-900 p-6 text-slate-100 shadow-xl">
                <Dialog.Title className="text-lg font-semibold text-slate-50">{title}</Dialog.Title>
                <p className="mt-2 text-sm text-slate-400">{message}</p>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                      danger
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-cyan-600 hover:bg-cyan-500'
                    }`}
                    onClick={async () => {
                      try {
                        await Promise.resolve(onConfirm());
                      } finally {
                        onClose();
                      }
                    }}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
