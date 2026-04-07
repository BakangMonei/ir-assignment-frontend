import { AppRouter } from './router/AppRouter';
import { DashboardLayout } from '../shared/ui/DashboardLayout';

function App() {
  return (
    <DashboardLayout>
      <AppRouter />
    </DashboardLayout>
  );
}

export default App;
