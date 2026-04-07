import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { buildIndex, getIndexStatus } from '../features/indexing/api/indexingApi';
import { Button, Card } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { setPlatformState } from '../shared/state/platformState';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';

export function IndexingPage() {
  const readiness = usePlatformReadiness();
  const { data, refetch } = useQuery({ queryKey: ['index-status'], queryFn: getIndexStatus, refetchInterval: 5000 });

  const mutation = useMutation({
    mutationFn: buildIndex,
    onSuccess: () => {
      toast.success('Index build triggered');
      setPlatformState({ indexBuilt: true });
      refetch();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div className="space-y-4">
      <Card title="Indexing" actions={<Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Build/Rebuild Index</Button>}>
        {!readiness.importCompleted && (
          <p className="mb-3 text-sm text-amber-700">Import/upload data first in Data Source, then build index.</p>
        )}
        <pre className="overflow-auto rounded bg-gray-800 p-3 text-xs border border-gray-700">{JSON.stringify(data || {}, null, 2)}</pre>
      </Card>
    </div>
  );
}
