export function ProductCardSkeleton() {
  return (
    <article className="bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden flex flex-col h-full animate-pulse">
      <div className="aspect-[4/3] bg-neutral-200" />
      <div className="p-4 flex flex-col flex-1 space-y-3">
        <div className="h-4 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
        <div className="flex items-center gap-2">
          <div className="h-4 bg-neutral-200 rounded-full w-20" />
          <div className="h-4 bg-neutral-200 rounded w-16" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="h-3.5 bg-neutral-200 rounded w-6" />
          <div className="h-3.5 bg-neutral-200 rounded w-24" />
          <div className="h-3.5 bg-neutral-200 rounded w-4" />
          <div className="h-3.5 bg-neutral-200 rounded w-16" />
        </div>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="h-6 bg-neutral-200 rounded w-20" />
            <div className="h-3 bg-neutral-200 rounded w-12" />
          </div>
          <div className="h-5 bg-neutral-200 rounded-full w-20" />
        </div>
        <div className="pt-4 border-t border-neutral-100">
          <div className="h-10 bg-neutral-200 rounded-xl w-full" />
        </div>
      </div>
    </article>
  )
}