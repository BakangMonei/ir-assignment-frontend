import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getEvaluationMetrics, getPRCurve, runEvaluation } from '../features/evaluation/api/evaluationApi';
import { Button, Card, EmptyState, Input } from '../shared/ui/UiPrimitives';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';

export function EvaluationPage() {
  const readiness = usePlatformReadiness();
  const [payload, setPayload] = useState({ relevantDocIds: '', retrievedDocIds: '' });
  const metricsQuery = useQuery({ queryKey: ['evaluation-metrics'], queryFn: getEvaluationMetrics });
  const prCurveQuery = useQuery({ queryKey: ['evaluation-pr'], queryFn: getPRCurve });

  const runMutation = useMutation({ mutationFn: runEvaluation });

  return (
    <div className="space-y-4">
      {!readiness.evaluationEnabled && (
        <EmptyState
          title="Evaluation is disabled"
          description="Evaluation requires import/upload + built index + relevance data (CISI)."
        />
      )}
      <Card title="Run Evaluation" actions={<Button disabled={!readiness.evaluationEnabled} onClick={() => runMutation.mutate({
        relevantDocIds: payload.relevantDocIds.split(',').map((v) => v.trim()),
        retrievedDocIds: payload.retrievedDocIds.split(',').map((v) => v.trim()),
      })}>Run</Button>}>
        <div className="grid gap-2 md:grid-cols-2">
          <Input placeholder="Relevant IDs (comma-separated)" onChange={(e) => setPayload((v) => ({ ...v, relevantDocIds: e.target.value }))} />
          <Input placeholder="Retrieved IDs (comma-separated)" onChange={(e) => setPayload((v) => ({ ...v, retrievedDocIds: e.target.value }))} />
        </div>
      </Card>
      <Card title="Metrics">
        <pre className="rounded bg-gray-100 p-3 text-xs">{JSON.stringify(metricsQuery.data || runMutation.data || {}, null, 2)}</pre>
      </Card>
      <Card title="PR Curve">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={prCurveQuery.data || []}>
              <XAxis dataKey="recall" />
              <YAxis dataKey="precision" />
              <Tooltip />
              <Line type="monotone" dataKey="precision" stroke="#2563eb" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
