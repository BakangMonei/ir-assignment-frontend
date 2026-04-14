import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  getEvaluationMetrics,
  getPRCurve,
  runEvaluation,
} from '../features/evaluation/api/evaluationApi';
import { Button, Card, EmptyState, Input } from '../shared/ui/UiPrimitives';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';
import { getErrorMessage } from '../shared/utils/errorUtils';

export function EvaluationPage() {
  const readiness = usePlatformReadiness();
  const [payload, setPayload] = useState({ relevantDocIds: '', retrievedDocIds: '' });
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

  const runMutation = useMutation({ mutationFn: runEvaluation });

  return (
    <div className="space-y-4">
      {!readiness.evaluationEnabled && (
        <EmptyState
          title="Evaluation is disabled"
          description="Evaluation requires import/upload + built index + relevance data (CISI)."
        />
      )}
      <Card
        title="Run Evaluation"
        actions={
          <Button
            disabled={!readiness.evaluationEnabled}
            onClick={() =>
              runMutation.mutate({
                relevantDocIds: payload.relevantDocIds.split(',').map(v => v.trim()),
                retrievedDocIds: payload.retrievedDocIds.split(',').map(v => v.trim()),
              })
            }
          >
            Run
          </Button>
        }
      >
        <div className="grid gap-2 md:grid-cols-2">
          <Input
            placeholder="Relevant IDs (comma-separated)"
            onChange={e => setPayload(v => ({ ...v, relevantDocIds: e.target.value }))}
          />
          <Input
            placeholder="Retrieved IDs (comma-separated)"
            onChange={e => setPayload(v => ({ ...v, retrievedDocIds: e.target.value }))}
          />
        </div>
      </Card>
      <Card title="Metrics">
        {metricsQuery.isError ? (
          <EmptyState
            title="Could not load metrics"
            description={getErrorMessage(metricsQuery.error)}
          />
        ) : metricsQuery.isLoading && !runMutation.data ? (
          <p className="text-sm text-slate-400">Loading metrics…</p>
        ) : (
          <pre className="rounded border border-gray-700 bg-gray-800 p-3 text-xs  ">
            {JSON.stringify(metricsQuery.data || runMutation.data || {}, null, 2)}
          </pre>
        )}
      </Card>
      <Card title="PR Curve">
        {prCurveQuery.isError ? (
          <EmptyState
            title="Could not load PR curve"
            description={getErrorMessage(prCurveQuery.error)}
          />
        ) : prCurveQuery.isLoading ? (
          <p className="text-sm text-slate-400">Loading PR curve…</p>
        ) : !Array.isArray(prCurveQuery.data) || prCurveQuery.data.length === 0 ? (
          <EmptyState
            title="No PR curve data"
            description="Run an evaluation with valid relevance data, or trigger a search-backed evaluation first."
          />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={prCurveQuery.data}>
                <XAxis dataKey="recall" />
                <YAxis dataKey="precision" />
                <Tooltip />
                <Line type="monotone" dataKey="precision" stroke="#2563eb" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
