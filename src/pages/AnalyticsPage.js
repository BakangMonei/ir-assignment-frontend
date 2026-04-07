import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getTermDistribution, getZipf } from '../features/analytics/api/analyticsApi';
import { Card, EmptyState } from '../shared/ui/UiPrimitives';
import { getErrorMessage } from '../shared/utils/errorUtils';

function normalizeZipfData(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.points)) return raw.points;
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([rank, frequency]) => ({
      rank: Number(rank),
      frequency: Number(frequency),
    }));
  }
  return [];
}

function normalizeTermData(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && Array.isArray(raw.terms)) return raw.terms;
  if (raw && typeof raw === 'object') {
    return Object.entries(raw).map(([term, frequency]) => ({ term, frequency: Number(frequency) }));
  }
  return [];
}

export function AnalyticsPage() {
  const termQuery = useQuery({ queryKey: ['analytics-term-dist'], queryFn: getTermDistribution });
  const zipfQuery = useQuery({ queryKey: ['analytics-zipf'], queryFn: getZipf });
  const zipfData = normalizeZipfData(zipfQuery.data);
  const termData = normalizeTermData(termQuery.data);

  return (
    <div className="space-y-4">
      <Card title="Term Distribution">
        {termQuery.isError ? (
          <EmptyState
            title="Failed to load term distribution"
            description={getErrorMessage(termQuery.error)}
          />
        ) : termQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading term distribution...</p>
        ) : termData.length === 0 ? (
          <EmptyState
            title="No term distribution data"
            description="The backend returned an empty analytics payload."
          />
        ) : (
          <div className="max-h-72 overflow-auto rounded border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500">Term</th>
                  <th className="px-3 py-2 text-left text-gray-500">Frequency</th>
                </tr>
              </thead>
              <tbody>
                {termData.slice(0, 100).map((row, idx) => (
                  <tr key={`${row.term}-${idx}`} className="border-t border-gray-100">
                    <td className="px-3 py-2">{row.term ?? '-'}</td>
                    <td className="px-3 py-2">
                      {Number.isFinite(row.frequency) ? row.frequency : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Card title="Zipf Trend">
        {zipfQuery.isError ? (
          <EmptyState
            title="Failed to load Zipf data"
            description={getErrorMessage(zipfQuery.error)}
          />
        ) : zipfQuery.isLoading ? (
          <p className="text-sm text-gray-500">Loading Zipf analytics...</p>
        ) : zipfData.length === 0 ? (
          <EmptyState
            title="No Zipf data available"
            description="Try indexing documents first, then reload analytics."
          />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={zipfData}>
                <XAxis dataKey="rank" />
                <YAxis dataKey="frequency" />
                <Tooltip />
                <Line type="monotone" dataKey="frequency" stroke="#7c3aed" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}
