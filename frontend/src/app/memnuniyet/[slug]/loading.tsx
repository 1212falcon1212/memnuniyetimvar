export default function ReviewDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
          <div className="h-4 w-4/6 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
