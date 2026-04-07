import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { expandQuery, performSearch } from '../features/search/api/searchApi';
import { Button, Card, Input } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';

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
  const [params, setParams] = useState(defaultSearch);
  const [enabled, setEnabled] = useState(false);

  const { data, isFetching } = useQuery({
    queryKey: ['search', params],
    queryFn: () => performSearch(params),
    enabled,
  });

  const expandMutation = useMutation({
    mutationFn: () => expandQuery(params.query),
    onSuccess: (expanded) => toast.success(`Expanded: ${expanded?.expandedQuery || 'Success'}`),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const rows = data?.content || data?.items || data || [];

  return (
    <Card title="Advanced Search" actions={<Button onClick={() => setEnabled(true)}>Search</Button>}>
      <div className="mb-4 grid gap-2 md:grid-cols-3">
        <Input placeholder="Query" value={params.query} onChange={(e) => setParams((v) => ({ ...v, query: e.target.value }))} />
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={params.model} onChange={(e) => setParams((v) => ({ ...v, model: e.target.value }))}>
          <option value="tf">tf</option><option value="tfidf">tfidf</option><option value="normalized">normalized</option><option value="bm25">bm25</option>
        </select>
        <Input placeholder="Keywords" value={params.keywords} onChange={(e) => setParams((v) => ({ ...v, keywords: e.target.value }))} />
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => expandMutation.mutate()}>Expand Query</Button>
        <label className="text-sm"><input type="checkbox" checked={params.stemming} onChange={(e) => setParams((v) => ({ ...v, stemming: e.target.checked }))} /> Stemming</label>
        <label className="text-sm"><input type="checkbox" checked={params.expansion} onChange={(e) => setParams((v) => ({ ...v, expansion: e.target.checked }))} /> Expansion</label>
      </div>

      {isFetching ? <p className="text-sm text-gray-500">Searching...</p> : (
        <ul className="space-y-2">
          {rows.map((item, idx) => (
            <li key={item.id || idx} className="rounded border border-gray-200 p-3 text-sm">
              <div className="font-medium">{item.title || item.documentId || `Result ${idx + 1}`}</div>
              <div className="text-gray-500">Score: {item.score ?? 'N/A'}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
