"use client";

export function AdminHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-header-bg px-4 lg:px-6">
      <button
        type="button"
        className="lg:hidden p-2 text-muted"
        onClick={onMenuToggle}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted">Admin</span>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:bg-gray-50 transition-colors"
        >
          Cikis
        </button>
      </div>
    </header>
  );
}
