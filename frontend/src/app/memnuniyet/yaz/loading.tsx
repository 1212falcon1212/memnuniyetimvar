export default function YorumYazLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="h-12 rounded-xl bg-gray-200" />
        <div className="h-8 rounded-xl bg-gray-200" />
        <div className="h-40 rounded-xl bg-gray-200" />
      </div>
    </div>
  );
}
