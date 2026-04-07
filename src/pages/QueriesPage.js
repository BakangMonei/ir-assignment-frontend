import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { queriesApi } from '../features/queries/api/queriesApi';
import { Button, Card, Input } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';

export function QueriesPage() {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['queries'], queryFn: queriesApi.list });

  const createMutation = useMutation({
    mutationFn: queriesApi.create,
    onSuccess: () => {
      toast.success('Query saved');
      queryClient.invalidateQueries({ queryKey: ['queries'] });
      setText('');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: queriesApi.remove,
    onSuccess: () => {
      toast.success('Query deleted');
      queryClient.invalidateQueries({ queryKey: ['queries'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rows = data?.content || data || [];

  return (
    <Card title="Queries" actions={<Button onClick={() => createMutation.mutate({ text })}>Create Query</Button>}>
      <div className="mb-3 max-w-lg">
        <Input placeholder="Query text" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <ul className="space-y-2">
          {rows.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
              <span>{item.text || item.queryText || item.id}</span>
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => window.confirm('Delete query?') && removeMutation.mutate(item.id)}>Delete</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
