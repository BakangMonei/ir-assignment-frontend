import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'react-toastify';
import { BarChart } from 'lucide-react';
import { performSearch } from '../features/search/api/searchApi';
import { getPRCurve, runEvaluation } from '../features/evaluation/api/evaluationApi';
import { getDatasetEval, runCisiBenchmark } from '../features/experiments/api/experimentsApi';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';
import { downloadAsCsv, downloadAsJson } from '../shared/utils/downloadUtils';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { normalizeSearchRows } from '../shared/utils/searchResponseUtils';
import { Button, Card, EmptyState, Input, Select, Spinner } from '../shared/ui/UiPrimitives';

const COLORS = ['#22d3ee', '#818cf8', '#34d399', '#f59e0b', '#f472b6', '#60a5fa'];

const defaultForm = {
  dataset: 'medline',
  query: '',
  model: 'tfidf',
  stemming: true,
  expansion: false,
  tokenizer: 'default',
  lengthNorm: true,
  page: 0,
  size: 10,
  relevantDocIds: '',
  retrievedDocIds: '',
};

function toCurveWithRunId(curve, runId, label) {
  if (!Array.isArray(curve)) return [];
  return curve.map(point => ({
    runId,
    label,
    recall: Number(point?.recall ?? 0),
    precision: Number(point?.precision ?? 0),
  }));
}

export function ExperimentsPage() {
  const readiness = usePlatformReadiness();
  const [form, setForm] = useState(defaultForm);
  const [runs, setRuns] = useState([]);

  const runMutation = useMutation({
    mutationFn: async payload => {
      const startedAt = performance.now();
      const searchPayload = {
        query: payload.query,
        model: payload.model,
        stemming: payload.stemming,
        expansion: payload.expansion,
        page: payload.page,
        size: payload.size,
        lengthNorm: payload.lengthNorm,
      };

      if (payload.dataset) searchPayload.category = payload.dataset;
      if (payload.tokenizer && payload.tokenizer !== 'default')
        searchPayload.tokenizer = payload.tokenizer;

      const searchData = await performSearch(searchPayload);
      const rows = normalizeSearchRows(searchData);

      let metrics = null;
      let curve = [];
      const hasEvalIds = payload.relevantDocIds.length > 0 && payload.retrievedDocIds.length > 0;

      if (hasEvalIds) {
        metrics = await runEvaluation({
          relevantDocIds: payload.relevantDocIds,
          retrievedDocIds: payload.retrievedDocIds,
        });
        curve = await getPRCurve();
      }

      const finishedAt = performance.now();
      const latencyMs = Math.round(finishedAt - startedAt);

      return {
        rows,
        metrics,
        curve,
        latencyMs,
      };
    },
    onSuccess: data => {
      const runId = `run-${Date.now()}`;
      const label = `${form.dataset}|${form.model}|${form.stemming ? 'stem' : 'no-stem'}|${form.expansion ? 'exp' : 'no-exp'}|${form.tokenizer}|ln:${form.lengthNorm ? '1' : '0'}`;
      const run = {
        id: runId,
        createdAt: new Date().toISOString(),
        label,
        dataset: form.dataset,
        config: {
          model: form.model,
          stemming: form.stemming,
          expansion: form.expansion,
          tokenizer: form.tokenizer,
          lengthNorm: form.lengthNorm,
          page: form.page,
          size: form.size,
          query: form.query,
        },
        resultCount: data.rows.length,
        latencyMs: data.latencyMs,
        metrics: data.metrics || {},
        curve: toCurveWithRunId(data.curve, runId, label),
      };

      setRuns(prev => [run, ...prev]);
      toast.success('Experiment run added to comparison table');
    },
    onError: error => toast.error(getErrorMessage(error, 'Experiment run failed')),
  });

  const benchmarkMutation = useMutation({
    mutationFn: runCisiBenchmark,
    onSuccess: body => {
      const rows = body?.comparisons?.length ?? body?.rows?.length ?? 0;
      toast.success(
        rows ? `Benchmark finished (${rows} configuration rows). Full JSON logged to console.` : 'Benchmark finished.'
      );
      // eslint-disable-next-line no-console
      console.log('CISI benchmark result', body);
    },
    onError: error =>
      toast.error(getErrorMessage(error, 'CISI benchmark failed (timeout or server error).')),
  });

  const datasetEvalMutation = useMutation({
    mutationFn: () => getDatasetEval({ dataset: 'CISI' }),
    onSuccess: body => {
      const mapVal = body?.map ?? body?.meanAveragePrecision;
      const mapStr =
        mapVal != null && Number.isFinite(Number(mapVal)) ? Number(mapVal).toFixed(4) : '—';
      const p = body?.precision != null ? Number(body.precision).toFixed(4) : '—';
      const r = body?.recall != null ? Number(body.recall).toFixed(4) : '—';
      toast.success(`Queries: ${body?.queriesEvaluated ?? '—'} — MAP ${mapStr}, P ${p}, R ${r}`);
      // eslint-disable-next-line no-console
      console.log('Dataset evaluation', body);
    },
    onError: error => toast.error(getErrorMessage(error, 'Dataset evaluation failed.')),
  });

  const mergedCurve = useMemo(() => runs.flatMap(run => run.curve || []), [runs]);

  const chartData = useMemo(() => {
    const map = new Map();
    runs.forEach(run => {
      (run.curve || []).forEach(point => {
        const key = point.recall;
        const row = map.get(key) || { recall: key };
        row[run.id] = point.precision;
        map.set(key, row);
      });
    });

    return Array.from(map.values()).sort((a, b) => a.recall - b.recall);
  }, [runs]);

  return (
    <div className="space-y-4">
      <Card title="CISI batch evaluation (backend)">
        <p className="mb-3 text-sm text-slate-400">
          Mirrors the standalone IR UI: full grid over tokenizers, stemming, and ranking models, plus a
          quick MAP run on default CISI query and relevance files on the server.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-violet-600 hover:bg-violet-700"
            disabled={benchmarkMutation.isPending || datasetEvalMutation.isPending}
            onClick={() => benchmarkMutation.mutate()}
          >
            {benchmarkMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner /> Running benchmark…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                Run full CISI benchmark
              </span>
            )}
          </Button>
          <Button
            className="bg-slate-700 hover:bg-slate-800"
            disabled={benchmarkMutation.isPending || datasetEvalMutation.isPending}
            onClick={() => datasetEvalMutation.mutate()}
          >
            {datasetEvalMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner /> Evaluating…
              </span>
            ) : (
              'Quick CISI MAP (default QRY/REL)'
            )}
          </Button>
        </div>
      </Card>

      <Card title="Experiments & Comparison">
        {!readiness.searchEnabled && (
          <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/15 p-3 text-sm text-amber-200">
            Import/upload data and build index first. Experiments require search readiness.
          </div>
        )}

        <div className="grid gap-2 md:grid-cols-3">
          <Select
            value={form.dataset}
            onChange={e => setForm(v => ({ ...v, dataset: e.target.value }))}
          >
            <option value="medline">Medline</option>
            <option value="dataset2">Dataset 2</option>
            <option value="cisi">CISI</option>
            <option value="pubmed">PubMed</option>
          </Select>
          <Input
            placeholder="Query text"
            value={form.query}
            onChange={e => setForm(v => ({ ...v, query: e.target.value }))}
          />
          <Select
            value={form.model}
            onChange={e => setForm(v => ({ ...v, model: e.target.value }))}
          >
            <option value="tf">TF</option>
            <option value="tfidf">TF-IDF</option>
            <option value="normalized">Length-normalized TF-IDF</option>
            <option value="bm25">BM25</option>
          </Select>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-4">
          <Select
            value={form.tokenizer}
            onChange={e => setForm(v => ({ ...v, tokenizer: e.target.value }))}
          >
            <option value="default">Tokenizer: default</option>
            <option value="standard">Tokenizer: standard</option>
            <option value="whitespace">Tokenizer: whitespace</option>
            <option value="classic">Tokenizer: classic</option>
            <option value="custom">Tokenizer: custom</option>
          </Select>
          <Input
            type="number"
            placeholder="Page"
            value={form.page}
            onChange={e => setForm(v => ({ ...v, page: Number(e.target.value) || 0 }))}
          />
          <Input
            type="number"
            placeholder="Size"
            value={form.size}
            onChange={e => setForm(v => ({ ...v, size: Number(e.target.value) || 10 }))}
          />
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-slate-700 px-3 py-2">
            <label className="text-sm">
              <input
                type="checkbox"
                checked={form.stemming}
                onChange={e => setForm(v => ({ ...v, stemming: e.target.checked }))}
              />{' '}
              Stemming
            </label>
            <label className="text-sm">
              <input
                type="checkbox"
                checked={form.expansion}
                onChange={e => setForm(v => ({ ...v, expansion: e.target.checked }))}
              />{' '}
              Expansion
            </label>
            <label className="text-sm">
              <input
                type="checkbox"
                checked={form.lengthNorm}
                onChange={e => setForm(v => ({ ...v, lengthNorm: e.target.checked }))}
              />{' '}
              Length norm
            </label>
          </div>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <Input
            placeholder="Relevant Doc IDs (comma-separated, optional)"
            value={form.relevantDocIds}
            onChange={e => setForm(v => ({ ...v, relevantDocIds: e.target.value }))}
          />
          <Input
            placeholder="Retrieved Doc IDs (comma-separated, optional)"
            value={form.retrievedDocIds}
            onChange={e => setForm(v => ({ ...v, retrievedDocIds: e.target.value }))}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            onClick={() =>
              runMutation.mutate({
                ...form,
                relevantDocIds: form.relevantDocIds
                  .split(',')
                  .map(v => v.trim())
                  .filter(Boolean),
                retrievedDocIds: form.retrievedDocIds
                  .split(',')
                  .map(v => v.trim())
                  .filter(Boolean),
              })
            }
            disabled={!readiness.searchEnabled || !form.query.trim() || runMutation.isPending}
          >
            Run Experiment
          </Button>
          <Button
            className="bg-slate-700 hover:bg-slate-800"
            onClick={() => downloadAsJson(runs, `experiment-comparison-${Date.now()}.json`)}
            disabled={runs.length === 0}
          >
            Export JSON
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() =>
              downloadAsCsv(
                runs.map(run => ({
                  id: run.id,
                  dataset: run.dataset,
                  config: JSON.stringify(run.config),
                  resultCount: run.resultCount,
                  latencyMs: run.latencyMs,
                  precision: run.metrics?.precision,
                  recall: run.metrics?.recall,
                  f1: run.metrics?.f1,
                  map: run.metrics?.map,
                  createdAt: run.createdAt,
                })),
                `experiment-comparison-${Date.now()}.csv`
              )
            }
            disabled={runs.length === 0}
          >
            Export CSV
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => setRuns([])}
            disabled={runs.length === 0}
          >
            Clear Runs
          </Button>
        </div>
      </Card>

      <Card title="Side-by-Side Metrics">
        {runs.length === 0 ? (
          <EmptyState
            title="No experiment runs yet"
            description="Run multiple configurations to compare metrics."
          />
        ) : (
          <div className="overflow-auto rounded-md border border-slate-700">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/90">
                <tr>
                  <th className="px-3 py-2 text-left">Run</th>
                  <th className="px-3 py-2 text-left">Dataset</th>
                  <th className="px-3 py-2 text-left">Model</th>
                  <th className="px-3 py-2 text-left">Stem</th>
                  <th className="px-3 py-2 text-left">Expand</th>
                  <th className="px-3 py-2 text-left">Tokenizer</th>
                  <th className="px-3 py-2 text-left">Results</th>
                  <th className="px-3 py-2 text-left">Latency (ms)</th>
                  <th className="px-3 py-2 text-left">Precision</th>
                  <th className="px-3 py-2 text-left">Recall</th>
                  <th className="px-3 py-2 text-left">F1</th>
                  <th className="px-3 py-2 text-left">MAP</th>
                </tr>
              </thead>
              <tbody>
                {runs.map(run => (
                  <tr key={run.id} className="border-t border-slate-700/70">
                    <td className="px-3 py-2">{run.id}</td>
                    <td className="px-3 py-2">{run.dataset}</td>
                    <td className="px-3 py-2">{run.config.model}</td>
                    <td className="px-3 py-2">{run.config.stemming ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">{run.config.expansion ? 'Yes' : 'No'}</td>
                    <td className="px-3 py-2">{run.config.tokenizer}</td>
                    <td className="px-3 py-2">{run.resultCount}</td>
                    <td className="px-3 py-2">{run.latencyMs}</td>
                    <td className="px-3 py-2">{run.metrics?.precision ?? '-'}</td>
                    <td className="px-3 py-2">{run.metrics?.recall ?? '-'}</td>
                    <td className="px-3 py-2">{run.metrics?.f1 ?? '-'}</td>
                    <td className="px-3 py-2">{run.metrics?.map ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="PR Curve Comparison Overlay">
        {mergedCurve.length === 0 ? (
          <EmptyState
            title="No PR curve data yet"
            description="Provide relevant/retrieved IDs during runs to generate PR curves."
          />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="recall" />
                <YAxis dataKey="precision" />
                <Tooltip />
                {runs.map((run, index) => (
                  <Line
                    key={run.id}
                    type="monotone"
                    dataKey={run.id}
                    name={run.label}
                    stroke={COLORS[index % COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
