import { Badge } from "@/components/Badge";

export function Topbar() {
  return (
    <header className="flex min-h-16 items-center justify-between border-b border-stone-200 bg-mist/95 px-4 py-3 sm:px-6">
      <div>
        <p className="text-sm font-medium text-stone-500">
          Biljardpalatset Goteborg AB
        </p>
        <h1 className="text-lg font-semibold text-ink">Operations workspace</h1>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="success">Human review on</Badge>
        <Badge variant="info">Mock AI ready</Badge>
      </div>
    </header>
  );
}
