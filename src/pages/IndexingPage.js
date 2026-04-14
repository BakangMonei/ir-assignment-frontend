import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  buildIndex,
  fetchIndexConfigBundle,
  getIndexHealth,
  getIndexMetrics,
  getIndexStats,
  getIndexStatus,
  putNormalizationConfig,
  putRankingConfig,
  putStemmingConfig,
  putTokenizerConfig,
  recreateIndex,
} from '../features/indexing/api/indexingApi';
import { Button, Card, Select, Spinner } from '../shared/ui/UiPrimitives';
import { ConfirmDialog } from '../shared/ui/ConfirmDialog';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { setPlatformState } from '../shared/state/platformState';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';

export function IndexingPage() {
  const queryClient = useQueryClient();
  const readiness = usePlatformReadiness();
  const [recreateOpen, setRecreateOpen] = useState(false);

  const statusQuery = useQuery({
    queryKey: ['index-status'],
    queryFn: getIndexStatus,
    refetchInterval: 5000,
  });

  const healthQuery = useQuery({
    queryKey: ['index-health'],
    queryFn: getIndexHealth,
    retry: 1,
    refetchInterval: 15_000,
  });

  const statsQuery = useQuery({
    queryKey: ['index-stats'],
    queryFn: getIndexStats,
    retry: 1,
    refetchInterval: 15_000,
  });

  const metricsQuery = useQuery({
    queryKey: ['index-metrics'],
    queryFn: getIndexMetrics,
    retry: 1,
    refetchInterval: 15_000,
  });

  const configQuery = useQuery({
    queryKey: ['index-config-bundle'],
    queryFn: fetchIndexConfigBundle,
    retry: 0,
  });

  const buildMutation = useMutation({
    mutationFn: buildIndex,
    onSuccess: () => {
      toast.success('Index build triggered');
      setPlatformState({ indexBuilt: true });
      queryClient.invalidateQueries({ queryKey: ['index-status'] });
      queryClient.invalidateQueries({ queryKey: ['index-status-readiness'] });
      queryClient.invalidateQueries({ queryKey: ['index-stats'] });
      queryClient.invalidateQueries({ queryKey: ['index-metrics'] });
      statusQuery.refetch();
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const recreateMutation = useMutation({
    mutationFn: recreateIndex,
    onSuccess: async () => {
      toast.success('Index recreate completed');
      setPlatformState({ indexBuilt: false });
      await queryClient.invalidateQueries();
      statusQuery.refetch();
    },
    onError: error => toast.error(getErrorMessage(error, 'Index recreate failed')),
  });

  const health = healthQuery.data;
  const unhealthy = health && String(health.status || '').toUpperCase() !== 'UP';

  return (
    <div className="space-y-4">
      {unhealthy && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
          <p className="font-medium">Index health warning</p>
          <p className="mt-1 text-amber-200/90">
            {health?.details || health?.message || 'Index service is not healthy.'}
          </p>
        </div>
      )}

      <Card
        title="Indexing"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => buildMutation.mutate()} disabled={buildMutation.isPending}>
              {buildMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Building…
                </span>
              ) : (
                'Build / rebuild index'
              )}
            </Button>
            <Button
              className="border-red-500/50 bg-red-900/40 hover:bg-red-900/60"
              onClick={() => setRecreateOpen(true)}
              disabled={recreateMutation.isPending}
            >
              {recreateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Recreating…
                </span>
              ) : (
                'Recreate index'
              )}
            </Button>
          </div>
        }
      >
        {!readiness.importCompleted && (
          <p className="mb-3 text-sm text-amber-200">
            Import or upload data first in Data Source, then build the index.
          </p>
        )}
        <p className="mb-2 text-xs text-slate-400">Live status from /index/status</p>
        <pre className="overflow-auto rounded border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-200">
          {JSON.stringify(statusQuery.data || {}, null, 2)}
        </pre>
      </Card>

      <Card title="Index health & stats">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              /index/health
            </p>
            {healthQuery.isError ? (
              <p className="text-sm text-slate-400">
                Not available: {getErrorMessage(healthQuery.error)}
              </p>
            ) : healthQuery.isLoading ? (
              <Spinner />
            ) : (
              <pre className="max-h-48 overflow-auto rounded border border-slate-700 bg-slate-950/80 p-2 text-xs">
                {JSON.stringify(healthQuery.data || {}, null, 2)}
              </pre>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              /index/stats
            </p>
            {statsQuery.isError ? (
              <p className="text-sm text-slate-400">
                Not available: {getErrorMessage(statsQuery.error)}
              </p>
            ) : statsQuery.isLoading ? (
              <Spinner />
            ) : (
              <pre className="max-h-48 overflow-auto rounded border border-slate-700 bg-slate-950/80 p-2 text-xs">
                {JSON.stringify(statsQuery.data || {}, null, 2)}
              </pre>
            )}
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
            /index/metrics
          </p>
          {metricsQuery.isError ? (
            <p className="text-sm text-slate-400">
              Not available: {getErrorMessage(metricsQuery.error)}
            </p>
          ) : metricsQuery.isLoading ? (
            <Spinner />
          ) : (
            <pre className="max-h-56 overflow-auto rounded border border-slate-700 bg-slate-950/80 p-2 text-xs">
              {JSON.stringify(metricsQuery.data || {}, null, 2)}
            </pre>
          )}
        </div>
      </Card>

      <Card title="Server index configuration (PUT)">
        <p className="mb-3 text-sm text-slate-400">
          Persists tokenizer, stemming, ranking, and normalization on the backend (same routes as the
          standalone IR UI).
        </p>
        {configQuery.isLoading ? (
          <Spinner />
        ) : (
          <IndexConfigForm
            initial={configQuery.data}
            onRefresh={() => configQuery.refetch()}
          />
        )}
      </Card>

      <ConfirmDialog
        open={recreateOpen}
        onClose={() => setRecreateOpen(false)}
        title="Recreate index?"
        message="This deletes the existing Lucene index and rebuilds from stored documents. Use only when you intend to reset the collection."
        confirmLabel="Recreate"
        danger
        onConfirm={() => recreateMutation.mutateAsync()}
      />
    </div>
  );
}

function IndexConfigForm({ initial, onRefresh }) {
  const tokenizerType =
    initial?.tokenizer?.type ?? initial?.tokenizer?.tokenizerType ?? 'standard';
  const useStemming = Boolean(initial?.stemming?.enabled ?? initial?.stemming?.useStemming);
  const rankingAlgorithm =
    initial?.ranking?.algorithm ?? initial?.ranking?.rankingAlgorithm ?? 'bm25';
  const lengthNorm = Boolean(
    initial?.normalization?.enabled ?? initial?.normalization?.lengthNormalization ?? true
  );

  const patchTokenizer = async type => {
    try {
      await putTokenizerConfig({ type });
      toast.success('Tokenizer updated');
      onRefresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Tokenizer update failed'));
    }
  };

  const patchStemming = async enabled => {
    try {
      await putStemmingConfig({ enabled });
      toast.success('Stemming updated');
      onRefresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Stemming update failed'));
    }
  };

  const patchRanking = async algorithm => {
    try {
      await putRankingConfig({ algorithm });
      toast.success('Ranking updated');
      onRefresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Ranking update failed'));
    }
  };

  const patchNorm = async enabled => {
    try {
      await putNormalizationConfig({ enabled });
      toast.success('Normalization updated');
      onRefresh();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Normalization update failed'));
    }
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Tokenizer</label>
          <Select
            defaultValue={tokenizerType}
            key={`tok-${tokenizerType}`}
            onChange={e => patchTokenizer(e.target.value)}
          >
            <option value="standard">Standard</option>
            <option value="custom">Custom</option>
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              defaultChecked={useStemming}
              key={`stem-${useStemming}`}
              onChange={e => patchStemming(e.target.checked)}
            />
            Stemming enabled
          </label>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Ranking (stored label)</label>
          <Select
            defaultValue={rankingAlgorithm}
            key={`rank-${rankingAlgorithm}`}
            onChange={e => patchRanking(e.target.value)}
          >
            <option value="bm25">BM25</option>
            <option value="tf-idf">TF-IDF</option>
            <option value="tf">Term frequency</option>
          </Select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              defaultChecked={lengthNorm}
              key={`norm-${lengthNorm}`}
              onChange={e => patchNorm(e.target.checked)}
            />
            Length normalization
          </label>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Current snapshot:{' '}
        <span className="font-mono text-slate-400">{JSON.stringify(initial || {})}</span>
      </p>
    </>
  );
}
