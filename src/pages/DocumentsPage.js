import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { createDocument, deleteDocument, getDocuments } from '../features/documents/api/documentsApi';
import { Button, Card, Input } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ page: 0, size: 10, category: '', year: '' });
  const [form, setForm] = useState({ title: '', category: '', year: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => getDocuments(filters),
  });

  const createMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      toast.success('Document saved');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rows = useMemo(() => data?.content || data?.items || data || [], [data]);

  return (
    <div className="space-y-4">
      <Card title="Documents" actions={<Button onClick={() => createMutation.mutate(form)}>Create</Button>}>
        <div className="mb-3 grid gap-2 md:grid-cols-4">
          <Input placeholder="Title" onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} />
          <Input placeholder="Category" onChange={(e) => setForm((v) => ({ ...v, category: e.target.value }))} />
          <Input placeholder="Year" type="number" onChange={(e) => setForm((v) => ({ ...v, year: Number(e.target.value) }))} />
          <Input placeholder="Filter category" onChange={(e) => setFilters((v) => ({ ...v, category: e.target.value }))} />
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading documents...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No documents found.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">ID</th><th>Title</th><th>Category</th><th>Year</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((doc) => (
                  <tr key={doc.id} className="border-t border-gray-100">
                    <td className="py-2">{doc.id}</td>
                    <td>{doc.title}</td>
                    <td>{doc.category}</td>
                    <td>{doc.year}</td>
                    <td>
                      <Button className="bg-red-600 hover:bg-red-700" onClick={() => window.confirm('Delete document?') && deleteMutation.mutate(doc.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
