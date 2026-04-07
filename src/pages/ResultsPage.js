import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { resultsApi } from '../features/results/api/resultsApi';
import { Button, Card, Input } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';

export function ResultsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data, isLoading } = useQuery({ queryKey: ['results'], queryFn: resultsApi.list });

  const createMutation = useMutation({
    mutationFn: resultsApi.create,
    onSuccess: () => {
      toast.success('Result set saved');
      queryClient.invalidateQueries({ queryKey: ['results'] });
      setName('');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: resultsApi.remove,
    onSuccess: () => {
      toast.success('Result set deleted');
      queryClient.invalidateQueries({ queryKey: ['results'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rows = data?.content || data || [];

  return (
    <Card title="Results" actions={<Button onClick={() => createMutation.mutate({ name })}>Create Result Set</Button>}>
      <div className="mb-3 max-w-lg">
        <Input placeholder="Result set name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {isLoading ? <p className="text-sm text-gray-500">Loading...</p> : (
        <ul className="space-y-2">
          {rows.map((item) => (
            <li key={item.id} className="flex items-center justify-between rounded border border-gray-200 p-3 text-sm">
              <span>{item.name || item.title || item.id}</span>
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => window.confirm('Delete result set?') && removeMutation.mutate(item.id)}>Delete</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
