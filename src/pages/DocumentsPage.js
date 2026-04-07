import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  createDocument,
  deleteDocument,
  getDocuments,
} from '../features/documents/api/documentsApi';
import { Button, Card, EmptyState, Input } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { useDebouncedValue } from '../shared/hooks/useDebouncedValue';

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ page: 0, size: 10, category: '', year: '' });
  const [form, setForm] = useState({ title: '', category: '', year: '' });
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
      setForm({ title: '', category: '', year: '' });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const rows = useMemo(() => data?.content || data?.items || data || [], [data]);

  return (
    <div className="space-y-4">
      <Card
        title="Documents"
        actions={
          <Button
            onClick={() => createMutation.mutate(form)}
            disabled={!form.title?.trim() || !form.year || createMutation.isPending}
          >
            Create
          </Button>
        }
      >
        <div className="mb-3 grid gap-2 md:grid-cols-5">
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
          <Input
            placeholder="Year"
            value={form.year}
            type="number"
            onChange={e => setForm(v => ({ ...v, year: Number(e.target.value) }))}
          />
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
          <p className="text-sm text-gray-500">Loading documents...</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No documents found"
            description="Try changing filters or create a new document."
          />
        ) : (
          <div className="overflow-auto rounded-md border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-3 py-2">ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Year</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(doc => (
                  <tr
                    key={doc.id}
                    className="cursor-pointer border-t border-gray-100 hover:bg-blue-50/40"
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-500">Page {filters.page + 1}</p>
          <div className="flex gap-2">
            <Button
              className="bg-gray-700 hover:bg-gray-800"
              disabled={filters.page === 0}
              onClick={() => setFilters(v => ({ ...v, page: Math.max(v.page - 1, 0) }))}
            >
              Prev
            </Button>
            <Button onClick={() => setFilters(v => ({ ...v, page: v.page + 1 }))}>Next</Button>
          </div>
        </div>
      </Card>

      {selectedDoc && (
        <Card title="Document Details">
          <pre className="overflow-auto rounded bg-gray-100 p-3 text-xs">
            {JSON.stringify(selectedDoc, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}
