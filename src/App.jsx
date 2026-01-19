/**
 * Grow Dashboard - Project Plausible Deniability
 * 
 * This is a starter file. Follow CURSOR_BUILD_GUIDE.md to build out
 * the full dashboard with Cursor.
 */

function App() {
  return (
    <div className="min-h-screen bg-void p-6">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">
          🌿 Project: Plausible Deniability
        </h1>
        <p className="text-zinc-500 mt-1">
          GrowOp Command Center • Seedling Stage
        </p>
      </header>

      {/* Status Card */}
      <div className="card max-w-md">
        <h2 className="text-xl font-semibold text-neon-green mb-4">
          ✅ Starter Kit Ready
        </h2>
        <p className="text-zinc-400 mb-4">
          Follow the <code className="text-ice-blue">CURSOR_BUILD_GUIDE.md</code> to build 
          out the full dashboard with Cursor.
        </p>
        
        <div className="space-y-2 text-sm">
          <p className="text-zinc-500">Next steps:</p>
          <ol className="list-decimal list-inside text-zinc-400 space-y-1">
            <li>Copy <code>.env.example</code> to <code>.env</code></li>
            <li>Add your HA token to <code>.env</code></li>
            <li>Follow prompts in CURSOR_BUILD_GUIDE.md</li>
          </ol>
        </div>
      </div>

      {/* Test Card */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card card-glow-optimal">
          <p className="sensor-label">Optimal Status</p>
          <p className="sensor-value text-optimal">Good</p>
        </div>
        <div className="card card-glow-caution">
          <p className="sensor-label">Caution Status</p>
          <p className="sensor-value text-caution">Warning</p>
        </div>
        <div className="card card-glow-critical">
          <p className="sensor-label">Critical Status</p>
          <p className="sensor-value text-critical">Alert</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-zinc-600">
        Tailwind theme loaded • Ready for development
      </footer>
    </div>
  )
}

export default App
