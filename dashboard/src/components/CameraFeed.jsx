import { useState } from 'react';
import { RefreshCw, Camera } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Camera feed placeholder
 * Note: Actual Wyze integration requires docker-wyze-bridge for RTSP
 */
export function CameraFeed({ streamUrl = null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-100 flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Tent Camera
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          title="Refresh feed"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Video Feed Area */}
      <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
        {streamUrl ? (
          <img
            src={streamUrl}
            alt="Camera Feed"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
            <Camera className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm font-medium">Camera feed not configured</p>
            <p className="text-xs mt-2 text-zinc-700 text-center px-4">
              Requires docker-wyze-bridge for RTSP stream
            </p>
          </div>
        )}

        {/* Timestamp Overlay */}
        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-zinc-400 font-mono">
          {format(lastRefresh, 'HH:mm:ss')}
        </div>
      </div>

      {/* Setup Instructions */}
      {!streamUrl && (
        <details className="mt-4">
          <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400">
            📹 How to connect Wyze camera
          </summary>
          <div className="mt-2 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-500 space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Install docker-wyze-bridge on your Pi</li>
              <li>Enable RTSP in Wyze app (Settings → Advanced Settings)</li>
              <li>Add camera credentials to docker-wyze-bridge config</li>
              <li>Update VITE_CAMERA_URL in .env file</li>
              <li>Restart the dashboard</li>
            </ol>
            <p className="mt-3 pt-3 border-t border-zinc-800 text-zinc-600">
              <strong>Note:</strong> Camera feed will appear here once configured.
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
