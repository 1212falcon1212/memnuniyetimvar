export default function AuthLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
        <p className="text-sm text-gray-500">Yükleniyor...</p>
      </div>
    </div>
  );
}
