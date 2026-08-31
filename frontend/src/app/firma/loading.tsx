export default function FirmaLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-4 w-96 rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-10 w-36 rounded-lg bg-gray-200" />
          <div className="h-10 w-44 rounded-lg bg-gray-200" />
          <div className="h-10 w-40 rounded-lg bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 rounded-xl bg-gray-200" />
          <div className="h-48 rounded-xl bg-gray-200" />
          <div className="h-48 rounded-xl bg-gray-200" />
          <div className="h-48 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
