export default function ProjectDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back link */}
      <div className="h-4 w-36 rounded bg-gray-200" />

      {/* Project header card */}
      <div className="bg-white rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="h-5 w-20 rounded-full bg-gray-200" />
            <div className="h-7 w-64 rounded-lg bg-gray-200" />
            <div className="h-4 w-48 rounded bg-gray-100" />
            <div className="flex gap-2 mt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-9 h-9 rounded-full bg-gray-200" />
              ))}
            </div>
          </div>
          <div className="w-48 h-32 rounded-xl bg-gray-100" />
        </div>
      </div>

      {/* Tasks section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="h-9 w-24 rounded-xl bg-gray-200" />
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 rounded bg-gray-200 w-1/2" />
              <div className="h-3 rounded bg-gray-100 w-1/3" />
            </div>
            <div className="h-5 w-16 rounded-full bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
