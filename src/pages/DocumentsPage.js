import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  createDocument,
  deleteDocument,
  getDocuments,
  updateDocument,
} from '../features/documents/api/documentsApi';
import { Button, Card, EmptyState, Input, Select } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { useDebouncedValue } from '../shared/hooks/useDebouncedValue';

function normalizeDocumentRows(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

/** Spring `Page` or similar; falls back when the API returns a bare array. */
function getPaginationMeta(raw, rowCount, pageIndex, pageSize) {
  const meta = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const totalElements =
    meta.totalElements != null
      ? Number(meta.totalElements)
      : meta.total != null
        ? Number(meta.total)
        : null;
  const apiTotalPages =
    meta.totalPages != null && Number.isFinite(Number(meta.totalPages))
      ? Math.max(0, Number(meta.totalPages))
      : null;
  const totalPages =
    apiTotalPages != null      ? apiTotalPages
      : totalElements != null && Number.isFinite(totalElements) && pageSize > 0
        ? Math.max(1, Math.ceil(totalElements / pageSize))
        : null;

  const startItem = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endItem = pageIndex * pageSize + rowCount;

  const hasNext =
    meta.last === false ||
    (meta.last !== true &&
      (totalPages != null ? pageIndex < totalPages - 1 : rowCount >= pageSize));

  const hasPrev = meta.first === false || (meta.first !== true && pageIndex > 0);

  const canGoLast = totalPages != null && totalPages > 0 && pageIndex < totalPages - 1;

  return {
    totalElements: Number.isFinite(totalElements) ? totalElements : null,
    totalPages,
    startItem,
    endItem,
    hasNext,
    hasPrev,
    canGoLast,
  };
}

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ page: 0, size: 20, category: '', year: '' });
  const [form, setForm] = useState({ title: '', content: '', category: '', year: '' });
  const [selectedDoc, setSelectedDoc] = useState(null);
  const debouncedCategory = useDebouncedValue(filters.category);
  const debouncedYear = useDebouncedValue(filters.year);
  const queryFilters = { ...filters, category: debouncedCategory, year: debouncedYear };

  const { data, isLoading } = useQuery({
    queryKey: ['documents', queryFilters],
    queryFn: () => getDocuments(queryFilters),
  });

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      toast.success('Document saved');
      setForm({ title: '', content: '', category: '', year: '' });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateDocument(id, payload),
    onSuccess: () => {
      toast.success('Document updated');
      setSelectedDoc(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted');
      setSelectedDoc(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const rows = useMemo(() => normalizeDocumentRows(data), [data]);

  const pagination = useMemo(
    () => getPaginationMeta(data, rows.length, filters.page, filters.size),
    [data, rows.length, filters.page, filters.size]
  );

  const showTableFooter = !isLoading && (rows.length > 0 || filters.page > 0);

  return (
    <div className="space-y-4">
      <Card
        title="Documents"
        actions={
          <Button
            onClick={() => createMutation.mutate(form)}
            disabled={
              !form.title?.trim() || !form.content?.trim() || !form.year || createMutation.isPending
            }
          >
            Create
          </Button>
        }
      >
        <div className="mb-3 grid gap-2 md:grid-cols-2">
          <Input
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(v => ({ ...v, title: e.target.value }))}
          />
          <Input
            placeholder="Category"
            value={form.category}
            onChange={e => setForm(v => ({ ...v, category: e.target.value }))}
          />
          <textarea
            className="min-h-[88px] w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-300/30 placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 md:col-span-2"
            placeholder="Content (required by API)"
            value={form.content}
            onChange={e => setForm(v => ({ ...v, content: e.target.value }))}
          />
          <Input
            placeholder="Year"
            value={form.year}
            type="number"
            onChange={e => setForm(v => ({ ...v, year: Number(e.target.value) }))}
          />
        </div>
        <div className="mb-3 grid gap-2 md:grid-cols-2">
          <Input
            placeholder="Filter category"
            value={filters.category}
            onChange={e => setFilters(v => ({ ...v, page: 0, category: e.target.value }))}
          />
          <Input
            placeholder="Filter year"
            value={filters.year}
            type="number"
            onChange={e => setFilters(v => ({ ...v, page: 0, year: e.target.value }))}
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-400">Loading documents…</p>
        ) : rows.length === 0 && filters.page === 0 ? (
          <EmptyState
            title="No documents found"
            description="Try changing filters or create a new document."
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-700">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-slate-200">
                <thead className="bg-slate-900/90">
                  <tr className="text-left text-slate-400">
                    <th className="px-3 py-2">ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Year</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                        No rows on this page. Go back to the previous page.
                      </td>
                    </tr>
                  ) : (
                    rows.map(doc => (
                      <tr
                        key={doc.id}
                        className="cursor-pointer border-t border-slate-700/80 hover:bg-slate-800/50"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <td className="px-3 py-2">{doc.id}</td>
                        <td>{doc.title}</td>
                        <td>{doc.category}</td>
                        <td>{doc.year}</td>
                        <td>
                          <Button
                            className="bg-red-600 hover:bg-red-700"
                            onClick={e => {
                              e.stopPropagation();
                              if (window.confirm('Delete document?')) deleteMutation.mutate(doc.id);
                            }}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {showTableFooter && (
              <div
                className="flex flex-col gap-3 border-t border-slate-700 bg-slate-950/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                role="navigation"
                aria-label="Documents pagination"
              >
                <div className="text-xs text-slate-400">
                  {pagination.totalElements != null ? (
                    <>
                      Showing{' '}
                      <span className="font-medium text-slate-200">
                        {pagination.startItem}–{pagination.endItem}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium text-slate-200">{pagination.totalElements}</span>
                    </>
                  ) : (
                    <>
                      Page{' '}
                      <span className="font-medium text-slate-200">{filters.page + 1}</span>
                      {pagination.totalPages != null && (
                        <>
                          {' '}
                          of <span className="font-medium text-slate-200">{pagination.totalPages}</span>
                        </>
                      )}
                      <span className="text-slate-500">
                        {' '}
                        · {rows.length} {rows.length === 1 ? 'row' : 'rows'}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    Per page
                    <Select
                      aria-label="Rows per page"
                      className="w-auto min-w-[4.5rem] py-1.5 text-xs"
                      value={String(filters.size)}
                      onChange={e =>
                        setFilters(v => ({
                          ...v,
                          page: 0,
                          size: Number(e.target.value) || 20,
                        }))
                      }
                    >
                      {[5, 10, 20, 25, 50, 100].map(n => (
                        <option key={n} value={String(n)}>
                          {n}
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      className="bg-slate-800 px-2 py-1.5 text-xs hover:bg-slate-700"
                      disabled={!pagination.hasPrev}
                      onClick={() => setFilters(v => ({ ...v, page: 0 }))}
                    >
                      First
                    </Button>
                    <Button
                      type="button"
                      className="bg-slate-800 px-2 py-1.5 text-xs hover:bg-slate-700"
                      disabled={!pagination.hasPrev}
                      onClick={() => setFilters(v => ({ ...v, page: Math.max(0, v.page - 1) }))}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      className="bg-slate-800 px-2 py-1.5 text-xs hover:bg-slate-700"
                      disabled={!pagination.hasNext}
                      onClick={() => setFilters(v => ({ ...v, page: v.page + 1 }))}
                    >
                      Next
                    </Button>
                    <Button
                      type="button"
                      className="bg-slate-800 px-2 py-1.5 text-xs hover:bg-slate-700"
                      disabled={!pagination.canGoLast}
                      onClick={() =>
                        setFilters(v => ({
                          ...v,
                          page: Math.max(0, (pagination.totalPages ?? 1) - 1),
                        }))
                      }
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      <DocumentDetailModal
        doc={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onSave={payload => updateMutation.mutateAsync({ id: payload.id, payload })}
        onDelete={id => deleteMutation.mutateAsync(id)}
        isBusy={updateMutation.isPending || deleteMutation.isPending}
      />
    </div>
  );
}

function DocumentDetailModal({ doc, onClose, onSave, onDelete, isBusy }) {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (doc) setDraft({ ...doc });
    else setDraft(null);
  }, [doc]);

  if (!doc || !draft) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    await onSave(draft);
  };

  return (
    <Transition appear show={true} as={Fragment}>
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
              <Dialog.Panel className="w-full max-w-lg rounded-xl border border-slate-600 bg-slate-900 p-6 text-slate-100 shadow-xl">
                <Dialog.Title className="text-lg font-semibold">Edit document</Dialog.Title>
                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Title</label>
                    <Input
                      value={draft.title ?? ''}
                      onChange={e => setDraft(v => ({ ...v, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Category</label>
                    <Input
                      value={draft.category ?? ''}
                      onChange={e => setDraft(v => ({ ...v, category: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Year</label>
                    <Input
                      type="number"
                      value={draft.year ?? ''}
                      onChange={e => setDraft(v => ({ ...v, year: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Content</label>
                    <textarea
                      className="min-h-[120px] w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
                      value={draft.content ?? ''}
                      onChange={e => setDraft(v => ({ ...v, content: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-wrap justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      className="bg-slate-700 hover:bg-slate-800"
                      onClick={onClose}
                      disabled={isBusy}
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isBusy}
                      onClick={async () => {
                        if (!window.confirm('Delete this document?')) return;
                        await onDelete(draft.id);
                      }}
                    >
                      Delete
                    </Button>
                    <Button type="submit" disabled={isBusy}>
                      Save
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
