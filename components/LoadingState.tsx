export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600 shadow-sm shadow-stone-200/60">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-200 border-t-sage" />
      <span className="font-medium">{label}</span>
    </div>
  );
}
