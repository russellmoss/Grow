import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { useHA } from '../context/HomeAssistantContext';
import { ENTITIES } from '../types/entities';

/**
 * Camera feed component for Wyze camera via Home Assistant
 * Uses Home Assistant's camera proxy API to display the stream
 */
export function CameraFeed({ cameraEntityId = ENTITIES.TENT_CAMERA, streamUrl = null }) {
  const { entities, isConnected } = useHA();
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [error, setError] = useState(null);

  // Build camera proxy URL from Home Assistant
  const cameraStreamUrl = useMemo(() => {
    // If explicit streamUrl is provided, use it
    if (streamUrl) {
      return streamUrl;
    }

    // Otherwise, use Home Assistant camera proxy
    if (!isConnected || !cameraEntityId) {
      return null;
    }

    const cameraEntity = entities[cameraEntityId];
    if (!cameraEntity) {
      return null;
    }

    const haUrl = import.meta.env.VITE_HA_URL || 'http://100.65.202.84:8123';
    const haToken = import.meta.env.VITE_HA_TOKEN;
    
    // Use camera proxy API with timestamp for cache busting
    const timestamp = Date.now();
    return `${haUrl}/api/camera_proxy/${cameraEntityId}?token=${haToken}&t=${timestamp}`;
  }, [streamUrl, isConnected, cameraEntityId, entities, lastRefresh]);

  const handleRefresh = () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    setError(null);
    // Refresh happens via timestamp change in URL
    setTimeout(() => setIsLoading(false), 500);
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (!cameraStreamUrl) return;
    
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [cameraStreamUrl]);

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
        {cameraStreamUrl ? (
          <img
            key={lastRefresh.getTime()}
            src={cameraStreamUrl}
            alt="Tent Camera Feed"
            className="w-full h-full object-cover"
            onLoad={() => {
              setIsLoading(false);
              setError(null);
            }}
            onError={(e) => {
              console.error('[CameraFeed] Failed to load image:', cameraStreamUrl);
              setError('Failed to load camera feed');
              setIsLoading(false);
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
            <Camera className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-sm font-medium">
              {!isConnected 
                ? 'Connecting to Home Assistant...' 
                : !entities[cameraEntityId]
                  ? `Camera entity not found: ${cameraEntityId}`
                  : 'Camera feed not available'}
            </p>
            {error && (
              <p className="text-xs mt-2 text-red-500">{error}</p>
            )}
            {!isConnected && (
              <p className="text-xs mt-2 text-zinc-700 text-center px-4">
                Waiting for Home Assistant connection...
              </p>
            )}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && cameraStreamUrl && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
          </div>
        )}

        {/* Timestamp Overlay */}
        {cameraStreamUrl && (
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-zinc-400 font-mono">
            {format(lastRefresh, 'HH:mm:ss')}
          </div>
        )}
      </div>

      {/* Camera Status */}
      {cameraStreamUrl && entities[cameraEntityId] && (
        <div className="mt-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Camera: {entities[cameraEntityId]?.attributes?.friendly_name || cameraEntityId}
          </span>
        </div>
      )}
    </div>
  );
}
