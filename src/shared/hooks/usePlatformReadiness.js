import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getIndexStatus } from '../../features/indexing/api/indexingApi';
import { getPlatformState } from '../state/platformState';

function getDocCount(status) {
  if (!status || typeof status !== 'object') return 0;
  return Number(status.docCount ?? status.numberOfDocuments ?? status.documents ?? 0);
}

function hasBuiltIndex(status) {
  if (!status || typeof status !== 'object') return false;
  const docCount = getDocCount(status);
  const size = Number(status.indexSize ?? status.sizeInBytes ?? 0);
  return docCount > 0 || size > 0;
}

/** Backend reachability from index ping: avoids showing "connected" before the first response. */
function getBackendStatus(query) {
  if (query.isSuccess) return 'connected';
  if (query.isError) return 'error';
  return 'pending';
}

export function usePlatformReadiness() {
  const state = getPlatformState();
  const indexQuery = useQuery({
    queryKey: ['index-status-readiness'],
    queryFn: getIndexStatus,
    retry: 2,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 8000),
    refetchInterval: 10000,
  });

  const indexBuilt = useMemo(() => {
    if (state.indexBuilt) return true;
    return hasBuiltIndex(indexQuery.data);
  }, [indexQuery.data, state.indexBuilt]);

  const importCompleted = useMemo(() => {
    if (state.importCompleted) return true;
    return hasBuiltIndex(indexQuery.data);
  }, [indexQuery.data, state.importCompleted]);

  const searchEnabled = importCompleted && indexBuilt;
  const evaluationEnabled = searchEnabled && state.relevanceAvailable;
  const backendStatus = getBackendStatus(indexQuery);

  return {
    dataset: state.dataset,
    importCompleted,
    indexBuilt,
    relevanceAvailable: state.relevanceAvailable,
    searchEnabled,
    evaluationEnabled,
    backendConnected: backendStatus === 'connected',
    backendStatus,
  };
}
