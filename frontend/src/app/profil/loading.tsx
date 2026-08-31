export default function ProfilLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200" />
            <div className="space-y-2">
              <div className="h-6 w-40 rounded bg-gray-200" />
              <div className="h-4 w-32 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
