import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { buildIndex, getIndexStatus } from '../features/indexing/api/indexingApi';
import { Button, Card } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';

export function IndexingPage() {
  const { data, refetch } = useQuery({ queryKey: ['index-status'], queryFn: getIndexStatus, refetchInterval: 5000 });

  const mutation = useMutation({
    mutationFn: buildIndex,
    onSuccess: () => {
      toast.success('Index build triggered');
      refetch();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Card title="Indexing" actions={<Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Build/Rebuild Index</Button>}>
      <pre className="overflow-auto rounded bg-gray-100 p-3 text-xs">{JSON.stringify(data || {}, null, 2)}</pre>
    </Card>
  );
}
