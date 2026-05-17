import { Outlet } from 'react-router-dom';
import { LeftRail } from './LeftRail';
import { TopBar } from './TopBar';

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <LeftRail />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 px-10 py-8 max-w-screen-2xl w-full mx-auto">
          <Outlet />
        </main>
        <footer className="px-10 py-6 border-t border-ink-200 text-center">
          <p className="font-display italic text-xs text-ink-400">
            Access Ledger — every change recorded, every record reversible.
          </p>
        </footer>
      </div>
    </div>
  );
}
