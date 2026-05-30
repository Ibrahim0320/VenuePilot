export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-sage" />
      <span>{label}</span>
    </div>
  );
}
