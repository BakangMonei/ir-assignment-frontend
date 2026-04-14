import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'react-toastify';
import {
  compareEvaluationBy,
  getEvaluationMetrics,
  getPRCurve,
  runEvaluationSearch,
  runEvaluation,
} from '../features/evaluation/api/evaluationApi';
import { Button, Card, EmptyState, Input } from '../shared/ui/UiPrimitives';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';
import { getErrorMessage } from '../shared/utils/errorUtils';

function fmtMetric(v) {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  return Number(v).toFixed(4);
}

export function EvaluationPage() {
  const queryClient = useQueryClient();
  const readiness = usePlatformReadiness();
  const [payload, setPayload] = useState({ relevantDocIds: '', retrievedDocIds: '' });
  const [comparison, setComparison] = useState({ kind: 'tokenizer', data: null, error: '' });

  const metricsQuery = useQuery({
    queryKey: ['evaluation-metrics'],
    queryFn: getEvaluationMetrics,
    retry: 2,
  });
  const prCurveQuery = useQuery({
    queryKey: ['evaluation-pr'],
    queryFn: getPRCurve,
    retry: 2,
  });

  const runMutation = useMutation({
    mutationFn: runEvaluation,
    onSuccess: () => {
      toast.success('Evaluation stored. Refreshed metrics and PR curve from the server.');
      queryClient.invalidateQueries({ queryKey: ['evaluation-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-pr'] });
    },
    onError: error => toast.error(getErrorMessage(error, 'Evaluation run failed')),
  });

  const evaluationSearchMutation = useMutation({
    mutationFn: params => runEvaluationSearch(params),
    onError: error => toast.error(getErrorMessage(error, 'Evaluation search failed')),
  });

  const comparisonMutation = useMutation({
    mutationFn: kind => compareEvaluationBy(kind),
    onSuccess: (data, kind) => setComparison({ kind, data, error: '' }),
    onError: error =>
      setComparison(v => ({
        ...v,
        data: null,
        error: getErrorMessage(error, 'Comparison failed'),
      })),
  });

  const relevantList = payload.relevantDocIds
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  const retrievedList = payload.retrievedDocIds
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
  const canRun = relevantList.length > 0 && retrievedList.length > 0;

  const metrics = metricsQuery.data || runMutation.data || null;
  const prData = Array.isArray(prCurveQuery.data) ? prCurveQuery.data : [];

  return (
    <div className="space-y-4">
      {!readiness.evaluationEnabled && (
        <EmptyState
          title="Evaluation is disabled"
          description="Evaluation requires import/upload + built index + relevance data (e.g. CISI)."
        />
      )}

      <Card title="Run evaluation (IRPlatformService)">
        <p className="mb-3 text-sm text-slate-400">
          <strong className="text-slate-200">POST</strong> uses the root controller{' '}
          <code className="text-cyan-600/90">/evaluation/run</code> (not under{' '}
          <code className="text-cyan-600/90">/api</code>), with body{' '}
          <code className="text-cyan-600/90">retrievedDocIds</code> and{' '}
          <code className="text-cyan-600/90">relevantDocIds</code>. That populates the in-memory
          “last evaluation”. Then{' '}
          <strong className="text-slate-200">GET /api/evaluation/metrics</strong> and{' '}
          <strong className="text-slate-200">GET /api/evaluation/pr-curve</strong> return{' '}
          <code className="text-cyan-600/90">ApiResponse.data</code> (already unwrapped by the HTTP
          client).
        </p>
        <p className="mb-3 text-xs text-slate-500">
          Other routes under <code className="text-cyan-600/90">/api/evaluation/search</code> and{' '}
          <code className="text-cyan-600/90">/api/evaluation/compare/…</code> use EvaluationService
          and return plain maps — do not parse those as ApiResponse.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            placeholder="Relevant doc IDs (comma-separated)"
            value={payload.relevantDocIds}
            onChange={e => setPayload(v => ({ ...v, relevantDocIds: e.target.value }))}
          />
          <Input
            placeholder="Retrieved doc IDs (comma-separated, ranked order)"
            value={payload.retrievedDocIds}
            onChange={e => setPayload(v => ({ ...v, retrievedDocIds: e.target.value }))}
          />
        </div>
        <div className="mt-3">
          <Button
            disabled={!readiness.evaluationEnabled || !canRun || runMutation.isPending}
            onClick={() =>
              runMutation.mutate({
                relevantDocIds: relevantList,
                retrievedDocIds: retrievedList,
              })
            }
          >
            {runMutation.isPending ? 'Running…' : 'Run'}
          </Button>
          {!canRun && readiness.evaluationEnabled && (
            <p className="mt-2 text-xs text-amber-200/90">Enter at least one ID in both lists.</p>
          )}
        </div>
      </Card>

      <Card title="Metrics (last evaluation)">
        {metricsQuery.isError ? (
          <EmptyState
            title="Could not load metrics"
            description={getErrorMessage(metricsQuery.error)}
          />
        ) : metricsQuery.isLoading && !runMutation.data && !metrics ? (
          <p className="text-sm text-slate-400">Loading metrics…</p>
        ) : !metrics ? (
          <EmptyState
            title="No metrics yet"
            description="Run an evaluation above. Until then, the API may return zeros or empty defaults."
          />
        ) : (
          <>
            <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MetricTile label="Precision" value={fmtMetric(metrics.precision)} />
              <MetricTile label="Recall" value={fmtMetric(metrics.recall)} />
              <MetricTile label="F1" value={fmtMetric(metrics.f1Score)} />
              <MetricTile label="MAP" value={fmtMetric(metrics.map)} />
            </div>
            <pre className="rounded border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-300">
              {JSON.stringify(metrics, null, 2)}
            </pre>
          </>
        )}
      </Card>

      <Card title="PR curve (last evaluation)">
        {prCurveQuery.isError ? (
          <EmptyState
            title="Could not load PR curve"
            description={getErrorMessage(prCurveQuery.error)}
          />
        ) : prCurveQuery.isLoading ? (
          <p className="text-sm text-slate-400">Loading PR curve…</p>
        ) : prData.length === 0 ? (
          <EmptyState
            title="No PR curve data"
            description="Run /evaluation/run with valid ID lists. Points are [precision, recall] pairs from the API."
          />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prData}>
                <XAxis dataKey="recall" name="Recall" />
                <YAxis dataKey="precision" name="Precision" domain={[0, 1]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="precision"
                  stroke="#2563eb"
                  dot={false}
                  name="Precision"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card title="Comparison views">
        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            onClick={() => comparisonMutation.mutate('tokenizer')}
            disabled={comparisonMutation.isPending}
          >
            Compare tokenizers
          </Button>
          <Button
            className="bg-slate-700 hover:bg-slate-800"
            onClick={() => comparisonMutation.mutate('stemming')}
            disabled={comparisonMutation.isPending}
          >
            Compare stemming
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => comparisonMutation.mutate('ranking')}
            disabled={comparisonMutation.isPending}
          >
            Compare ranking
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => evaluationSearchMutation.mutate({})}
            disabled={evaluationSearchMutation.isPending}
          >
            Run evaluation search
          </Button>
        </div>
        {comparison.error ? <p className="mb-2 text-sm text-rose-300">{comparison.error}</p> : null}
        <pre className="max-h-56 overflow-auto rounded border border-slate-700 bg-slate-950/80 p-3 text-xs text-slate-300">
          {JSON.stringify(comparison.data || evaluationSearchMutation.data || {}, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

function MetricTile({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-cyan-200">{value}</p>
    </div>
  );
}
