import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getIndexStatus } from '../../features/indexing/api/indexingApi';
import { getPlatformState } from '../state/platformState';

function hasBuiltIndex(status) {
  if (!status || typeof status !== 'object') return false;
  const docCount = Number(status.docCount ?? status.numberOfDocuments ?? status.documents ?? 0);
  const size = Number(status.indexSize ?? status.sizeInBytes ?? 0);
  return docCount > 0 || size > 0;
}

export function usePlatformReadiness() {
  const state = getPlatformState();
  const indexQuery = useQuery({
    queryKey: ['index-status-readiness'],
    queryFn: getIndexStatus,
    retry: 0,
    refetchInterval: 10000,
  });

  const indexBuilt = useMemo(() => {
    if (state.indexBuilt) return true;
    return hasBuiltIndex(indexQuery.data);
  }, [indexQuery.data, state.indexBuilt]);

  const searchEnabled = state.importCompleted && indexBuilt;
  const evaluationEnabled = searchEnabled && state.relevanceAvailable;

  return {
    dataset: state.dataset,
    importCompleted: state.importCompleted,
    indexBuilt,
    relevanceAvailable: state.relevanceAvailable,
    searchEnabled,
    evaluationEnabled,
    backendConnected: !indexQuery.isError,
  };
}
