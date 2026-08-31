export default function EtiketLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}
