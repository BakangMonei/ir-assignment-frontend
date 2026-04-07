import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { expandQuery, performSearch } from '../features/search/api/searchApi';
import { Button, Card, EmptyState, Input, Select } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';
import { usePlatformReadiness } from '../shared/hooks/usePlatformReadiness';

const defaultSearch = {
  query: '',
  model: 'tfidf',
  stemming: true,
  expansion: false,
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
    queryFn: () => performSearch(params),
    enabled,
  });

  const expandMutation = useMutation({
    mutationFn: () => expandQuery(params.query),
    onSuccess: (expanded) => {
      const nextExpanded = expanded?.expandedQuery || expanded?.query || '';
      setExpandedQueryText(nextExpanded);
      toast.success(nextExpanded ? 'Query expanded successfully' : 'Expansion completed');
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rows = data?.content || data?.items || data || [];

  return (
    <Card
      title="Advanced Search"
      actions={
        <Button onClick={() => setEnabled(true)} disabled={!params.query.trim() || !readiness.searchEnabled}>
          Search
        </Button>
      }
    >
      {!readiness.searchEnabled && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Search is disabled until data is imported/uploaded and index build is completed.
        </div>
      )}
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input placeholder="Query" value={params.query} onChange={(e) => setParams((v) => ({ ...v, query: e.target.value }))} />
        <Select value={params.model} onChange={(e) => setParams((v) => ({ ...v, model: e.target.value }))}>
          <option value="tf">tf</option><option value="tfidf">tfidf</option><option value="normalized">normalized</option><option value="bm25">bm25</option>
        </Select>
        <Input placeholder="Keywords" value={params.keywords} onChange={(e) => setParams((v) => ({ ...v, keywords: e.target.value }))} />
        <Select value={params.operator} onChange={(e) => setParams((v) => ({ ...v, operator: e.target.value }))}>
          <option value="AND">AND</option>
          <option value="OR">OR</option>
        </Select>
      </div>
      <div className="mb-4 grid gap-2 md:grid-cols-4">
        <Input placeholder="Category" value={params.category} onChange={(e) => setParams((v) => ({ ...v, category: e.target.value }))} />
        <Input placeholder="Year" value={params.year} onChange={(e) => setParams((v) => ({ ...v, year: e.target.value }))} />
        <Input placeholder="Page" type="number" value={params.page} onChange={(e) => setParams((v) => ({ ...v, page: Number(e.target.value) || 0 }))} />
        <Input placeholder="Size" type="number" value={params.size} onChange={(e) => setParams((v) => ({ ...v, size: Number(e.target.value) || 10 }))} />
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => expandMutation.mutate()}>Expand Query</Button>
        <label className="text-sm"><input type="checkbox" checked={params.stemming} onChange={(e) => setParams((v) => ({ ...v, stemming: e.target.checked }))} /> Stemming</label>
        <label className="text-sm"><input type="checkbox" checked={params.expansion} onChange={(e) => setParams((v) => ({ ...v, expansion: e.target.checked }))} /> Expansion</label>
      </div>

      {expandedQueryText && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Expanded query: <span className="font-medium">{expandedQueryText}</span>
        </div>
      )}

      {isFetching ? (
        <p className="text-sm text-gray-500">Searching...</p>
      ) : isError ? (
        <EmptyState title="Search failed" description={getErrorMessage(error)} />
      ) : rows.length === 0 ? (
        <EmptyState title="No results yet" description="Run a search to see ranked results." />
      ) : (
        <ul className="space-y-2">
          {rows.map((item, idx) => (
            <li key={item.id || idx} className="rounded border border-gray-200 bg-white p-3 text-sm">
              <div className="font-medium">{item.title || item.documentId || `Result ${idx + 1}`}</div>
              <div className="text-gray-500">Score: {item.score ?? 'N/A'}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
