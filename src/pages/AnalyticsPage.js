import { useQuery } from '@tanstack/react-query';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getTermDistribution, getZipf } from '../features/analytics/api/analyticsApi';
import { Card } from '../shared/ui/UiPrimitives';

export function AnalyticsPage() {
  const termQuery = useQuery({ queryKey: ['analytics-term-dist'], queryFn: getTermDistribution });
  const zipfQuery = useQuery({ queryKey: ['analytics-zipf'], queryFn: getZipf });

  return (
    <div className="space-y-4">
      <Card title="Term Distribution">
        <pre className="rounded bg-gray-100 p-3 text-xs">{JSON.stringify(termQuery.data || {}, null, 2)}</pre>
      </Card>
      <Card title="Zipf Trend">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={zipfQuery.data || []}>
              <XAxis dataKey="rank" />
              <YAxis dataKey="frequency" />
              <Tooltip />
              <Line type="monotone" dataKey="frequency" stroke="#7c3aed" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
