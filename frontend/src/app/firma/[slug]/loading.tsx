export default function FirmaDetailLoading() {
  return (
    <div>
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 rounded bg-gray-200" />
            <div className="flex gap-6">
              <div className="h-20 w-20 rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-3">
                <div className="h-7 w-64 rounded bg-gray-200" />
                <div className="h-4 w-48 rounded bg-gray-200" />
                <div className="h-16 w-80 rounded-lg bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-40 rounded-xl bg-gray-200" />
          <div className="h-40 rounded-xl bg-gray-200" />
          <div className="h-40 rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
