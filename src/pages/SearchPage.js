import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { expandQuery, performSearch } from '../features/search/api/searchApi';
import { Button, Card, EmptyState, Input, Select } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';
import { downloadAsCsv, downloadAsJson } from '../shared/utils/downloadUtils';
import { extractSearchMeta } from '../shared/utils/searchResponseUtils';

const defaultSearch = {
  query: '',
  model: 'tfidf',
  tokenizer: 'standard',
  stemming: true,
  expansion: false,
  lengthNorm: true,
  category: '',
  year: '',
  keywords: '',
  operator: 'AND',
  page: 0,
  size: 10,
};

export function SearchPage() {
  const readiness = usePlatformReadiness();
  const [params, setParams] = useState(defaultSearch);
  const [enabled, setEnabled] = useState(false);
  const [expandedQueryText, setExpandedQueryText] = useState('');

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['search', params],
    queryFn: () => performSearch(buildApiSearchParams(params)),
    enabled,
  });

  const searchMeta = useMemo(() => extractSearchMeta(data), [data]);

  const expandMutation = useMutation({
    mutationFn: () => expandQuery(params.query),
    onSuccess: expanded => {
      const nextExpanded = expanded?.expandedQuery || expanded?.query || '';
      setExpandedQueryText(nextExpanded);
      toast.success(nextExpanded ? 'Query expanded successfully' : 'Expansion completed');
    },
    onError: error => toast.error(getErrorMessage(error)),
  });

  const rows = searchMeta.rows;

  return (
    <Card
      title="Advanced Search"
      actions={
        <Button
          onClick={() => setEnabled(true)}
          disabled={!params.query.trim() || !readiness.searchEnabled}
        >
          Search
        </Button>
      }
    >
      {!readiness.searchEnabled && (
        <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/15 p-3 text-sm text-amber-200">
          Search is disabled until data is imported or uploaded and the index is built.
        </div>
      )}
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input
          placeholder="Query"
          value={params.query}
          onChange={e => setParams(v => ({ ...v, query: e.target.value }))}
        />
        <Select
          value={params.model}
          onChange={e => setParams(v => ({ ...v, model: e.target.value }))}
        >
          <option value="tf">tf</option>
          <option value="tfidf">tfidf</option>
          <option value="normalized">normalized</option>
          <option value="bm25">bm25</option>
        </Select>
        <Select
          value={params.tokenizer}
          onChange={e => setParams(v => ({ ...v, tokenizer: e.target.value }))}
        >
          <option value="standard">Tokenizer: standard</option>
          <option value="custom">Tokenizer: custom</option>
          <option value="whitespace">Tokenizer: whitespace</option>
          <option value="classic">Tokenizer: classic</option>
        </Select>
        <Select
          value={params.operator}
          onChange={e => setParams(v => ({ ...v, operator: e.target.value }))}
        >
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </Select>
      </div>
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input
          placeholder="Keywords"
          value={params.keywords}
          onChange={e => setParams(v => ({ ...v, keywords: e.target.value }))}
        />
        <Input
          placeholder="Category"
          value={params.category}
          onChange={e => setParams(v => ({ ...v, category: e.target.value }))}
        />
        <Input
          placeholder="Year"
          value={params.year}
          onChange={e => setParams(v => ({ ...v, year: e.target.value }))}
        />
        <div className="flex items-center gap-3 rounded-md border border-slate-700 px-3 py-2">
          <label className="text-sm text-slate-200">
            <input
              type="checkbox"
              checked={params.lengthNorm}
              onChange={e => setParams(v => ({ ...v, lengthNorm: e.target.checked }))}
            />{' '}
            Length norm
          </label>
        </div>
      </div>
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input
          placeholder="Page"
          type="number"
          value={params.page}
          onChange={e => setParams(v => ({ ...v, page: Number(e.target.value) || 0 }))}
        />
        <Input
          placeholder="Size"
          type="number"
          value={params.size}
          onChange={e => setParams(v => ({ ...v, size: Number(e.target.value) || 10 }))}
        />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => expandMutation.mutate()}
          disabled={!params.query.trim() || expandMutation.isPending}
        >
          Expand Query
        </Button>
        <label className="text-sm text-slate-200">
          <input
            type="checkbox"
            checked={params.stemming}
            onChange={e => setParams(v => ({ ...v, stemming: e.target.checked }))}
          />{' '}
          Stemming
        </label>
        <label className="text-sm text-slate-200">
          <input
            type="checkbox"
            checked={params.expansion}
            onChange={e => setParams(v => ({ ...v, expansion: e.target.checked }))}
          />{' '}
          Expansion
        </label>
      </div>

      {expandedQueryText && (
        <div className="mb-4 rounded-md border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-100">
          Expanded query: <span className="font-medium">{expandedQueryText}</span>
        </div>
      )}

      {(searchMeta.latencyMs != null || searchMeta.totalHits != null) && rows.length > 0 && (
        <div className="mb-4 grid gap-2 rounded-md border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300 md:grid-cols-4">
          <div>
            <span className="text-slate-500">Total hits</span>{' '}
            <span className="font-medium text-slate-100">{searchMeta.totalHits}</span>
          </div>
          <div>
            <span className="text-slate-500">Latency</span>{' '}
            <span className="font-medium text-slate-100">
              {searchMeta.latencyMs != null ? `${searchMeta.latencyMs} ms` : '—'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">P / R / F1</span>{' '}
            <span className="font-medium text-slate-100">
              {[searchMeta.precision, searchMeta.recall, searchMeta.f1Score]
                .map(v => (v != null && Number.isFinite(Number(v)) ? Number(v).toFixed(3) : '—'))
                .join(' / ')}
            </span>
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button
            className="bg-slate-700 hover:bg-slate-800"
            onClick={() => downloadAsJson(rows, `search-results-${Date.now()}.json`)}
          >
            Download JSON
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => downloadAsCsv(rows, `search-results-${Date.now()}.csv`)}
          >
            Download CSV
          </Button>
        </div>
      )}

      {isFetching ? (
        <p className="text-sm text-slate-400">Searching…</p>
      ) : isError ? (
        <EmptyState title="Search failed" description={getErrorMessage(error)} />
      ) : rows.length === 0 ? (
        <EmptyState title="No results yet" description="Run a search to see ranked results." />
      ) : (
        <ul className="space-y-2">
          {rows.map((item, idx) => (
            <li
              key={item.id || idx}
              className="rounded border border-slate-600 bg-slate-900/50 p-3 text-sm text-slate-100"
            >
              <div className="font-medium">
                {item.title || item.documentId || `Result ${idx + 1}`}
              </div>
              {item.content && (
                <p className="mt-1 line-clamp-3 text-slate-400">{item.content}</p>
              )}
              <div className="mt-1 text-slate-500">
                Score:{' '}
                {item.score != null && !Number.isNaN(Number(item.score))
                  ? Number(item.score).toFixed(4)
                  : 'N/A'}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function buildApiSearchParams(p) {
  const out = {
    query: p.query.trim(),
    model: p.model,
    stemming: p.stemming,
    expansion: p.expansion,
    operator: p.operator,
    page: p.page,
    size: p.size,
    lengthNorm: p.lengthNorm,
  };
  if (p.keywords) out.keywords = p.keywords;
  if (p.category) out.category = p.category;
  if (p.year) out.year = p.year;
  if (p.tokenizer) out.tokenizer = p.tokenizer;
  return out;
}
