import { Link, Outlet } from 'react-router-dom';

export function AppLayout() {
  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-brand">
          <span className="brand-icon">R</span>
          <span className="brand-text">Remision</span>
        </div>
        <div className="nav-links">
          <Link to="/">Nueva remisión</Link>
          <Link to="/historial">Historial</Link>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
