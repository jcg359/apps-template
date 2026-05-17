import { Callback } from './routes/Callback';
import { Home } from './routes/Home';
import { NotFound } from './routes/NotFound';

export function App() {
  const pathname = window.location.pathname;
  if (pathname === '/auth-client-redirect') return <Callback />;
  if (pathname === '/') return <Home />;
  return <NotFound />;
}
