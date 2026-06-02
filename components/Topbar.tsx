import { Badge } from "@/components/Badge";

export function Topbar() {
  const aiMode = process.env.OPENAI_API_KEY ? "AI provider connected" : "Local AI mode";

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-stone-200 bg-mist/90 px-4 py-3 backdrop-blur sm:px-6">
      <div>
        <p className="text-sm font-medium text-stone-500">
          Biljardpalatset Göteborg AB
        </p>
        <h1 className="text-lg font-semibold text-ink">Manager workspace</h1>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <Badge variant="success">Human approval on</Badge>
        <Badge variant="info">{aiMode}</Badge>
      </div>
    </header>
  );
}
