import { Card } from '../shared/ui/UiPrimitives';

export function CrudPlaceholderPage({ title }) {
  return (
    <Card title={title}>
      <p className="text-sm text-gray-500">
        Full CRUD UI module placeholder. API endpoints are already prepared in the shared architecture and can be expanded with dedicated feature components.
      </p>
    </Card>
  );
}
