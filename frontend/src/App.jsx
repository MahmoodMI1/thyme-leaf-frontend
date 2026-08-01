import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.jsx';
import { LoginScreen } from './auth/LoginScreen.jsx';
import { RequireRole } from './auth/RequireRole.jsx';
import { useSession } from './auth/useSession.js';
import { Dashboard } from './screens/Dashboard.jsx';
import { FoodsScreen } from './screens/foods/FoodsScreen.jsx';
import { MenuScreen } from './screens/dishes/MenuScreen.jsx';
import { BuilderScreen } from './screens/dishes/BuilderScreen.jsx';
import { UsersScreen } from './screens/users/UsersScreen.jsx';

const ALL = ['admin', 'chef', 'staff'];
const KITCHEN = ['admin', 'chef'];
const ADMIN = ['admin'];

export default function App() {
  const { status } = useSession();

  // Hold the first paint until the who-am-i probe answers, so a signed-in
  // reload never flashes the login screen.
  if (status === 'loading') return null;

  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />

      <Route element={<AppShell />}>
        <Route index element={<RequireRole roles={ALL}><Dashboard /></RequireRole>} />
        <Route path="/menu" element={<RequireRole roles={ALL}><MenuScreen /></RequireRole>} />
        <Route path="/foods" element={<RequireRole roles={KITCHEN} variant="foods"><FoodsScreen /></RequireRole>} />
        <Route path="/builder" element={<RequireRole roles={KITCHEN} variant="builder"><BuilderScreen /></RequireRole>} />
        <Route path="/users" element={<RequireRole roles={ADMIN} variant="users"><UsersScreen /></RequireRole>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
