import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Loader2, Settings } from 'lucide-react';
import { STAGE_ORDER } from '../types/phenology';
import { usePhenology } from '../context/PhenologyContext';
import ScheduleEditor from './ScheduleEditor';

/**
 * Stage Selector Component
 * Dropdown for selecting current growth stage with deployment confirmation
 */
export default function StageSelector() {
  const {
    schedule,
    currentStageId,
    currentStage,
    setCurrentStageId,
    deployStage,
    deployCurrentStage,
    deployStageObject,
    isDeploying,
    saveCustomStage,
    resetStageToDefaults,
  } = usePhenology();

  const [isOpen, setIsOpen] = useState(false);
  const [pendingStageId, setPendingStageId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingStage, setEditingStage] = useState(null);
  const dropdownRef = useRef(null);

  /**
   * Get display information for a stage
   * @param {string} stageId - Stage ID
   * @returns {Object|null} Display info or null
   */
  const getStageDisplay = (stageId) => {
    const stage = schedule[stageId];
    if (!stage) return null;
    return {
      emoji: stage.emoji,
      name: stage.name,
      duration: stage.duration,
      vpdRange: `${stage.vpd.min}-${stage.vpd.max} kPa`,
    };
  };

  /**
   * Handle stage option click
   * @param {string} stageId - Selected stage ID
   */
  const handleStageClick = (stageId) => {
    if (stageId === currentStageId) {
      // Same stage - just close dropdown
      setIsOpen(false);
      return;
    }

    // Different stage - show confirmation
    setPendingStageId(stageId);
    setShowConfirm(true);
    setIsOpen(false);
  };

  /**
   * Handle confirmation
   */
  const handleConfirm = async () => {
    if (!pendingStageId) return;

    // Update current stage
    setCurrentStageId(pendingStageId);

    // Deploy automations for new stage
    await deployStage(pendingStageId);

    // Close dialog
    setShowConfirm(false);
    setPendingStageId(null);
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setShowConfirm(false);
    setPendingStageId(null);
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const currentStageDisplay = getStageDisplay(currentStageId);
  const pendingStage = pendingStageId ? getStageDisplay(pendingStageId) : null;

  // Helper to get full stage object (not just display info)
  const getFullStage = (stageId) => schedule[stageId] || null;

  // Handle edit save
  const handleEditSave = async (stageId, params) => {
    // Save custom stage and get the updated stage object
    const updatedStage = saveCustomStage(stageId, params);
    setEditingStage(null);
    
    // Auto-deploy if this is the current stage
    // Use deployStageObject to deploy with the updated stage immediately
    // (deployCurrentStage would read from state which hasn't updated yet)
    if (stageId === currentStageId && updatedStage) {
      console.log('[StageSelector] Deploying with updated stage object:', updatedStage);
      console.log('[StageSelector] Stage lightSchedule:', JSON.stringify(updatedStage.lightSchedule, null, 2));
      console.log('[StageSelector] Stage temperature:', JSON.stringify(updatedStage.temperature, null, 2));
      console.log('[StageSelector] Stage vpd:', JSON.stringify(updatedStage.vpd, null, 2));
      const result = await deployStageObject(updatedStage);
      if (!result.success) {
        console.error('[StageSelector] Deployment failed:', result);
        const errorMsg = result.failed?.length > 0 
          ? `Failed to deploy ${result.failed.length} automation(s): ${result.failed.map(f => f.id).join(', ')}`
          : result.error || 'Unknown error';
        alert(`Deployment failed: ${errorMsg}`);
      } else {
        console.log('[StageSelector] Deployment successful:', result);
        if (result.failed?.length > 0) {
          console.warn('[StageSelector] Some automations failed:', result.failed);
        }
      }
    }
  };

  // Handle edit reset
  const handleEditReset = async (stageId) => {
    resetStageToDefaults(stageId);
    setEditingStage(null);
    // Auto-deploy if this is the current stage
    if (stageId === currentStageId) {
      await deployCurrentStage();
    }
  };

  if (!currentStageDisplay) {
    return null; // Don't render if no current stage
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Main Button Container */}
        <div className="w-full bg-abyss border border-zinc-700 rounded-xl p-4 flex items-center justify-between hover:border-zinc-600 transition-all">
          {/* Main Button (for dropdown) */}
          <button
            onClick={() => !isDeploying && setIsOpen(!isOpen)}
            disabled={isDeploying}
            className="flex-1 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              {isDeploying ? (
                <Loader2 className="w-5 h-5 text-neon-green animate-spin" />
              ) : (
                <span className="text-2xl">{currentStageDisplay.emoji}</span>
              )}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-semibold text-gray-100">
                    {isDeploying ? 'Deploying automations...' : currentStageDisplay.name}
                  </div>
                  {!isDeploying && currentStage?.isCustom && (
                    <span className="px-2 py-0.5 bg-neon-green/20 text-neon-green text-xs rounded">
                      Custom
                    </span>
                  )}
                </div>
                {!isDeploying && (
                  <div className="text-sm text-zinc-400">{currentStageDisplay.duration}</div>
                )}
              </div>
            </div>
            {!isDeploying && (
              <ChevronDown
                className={`w-5 h-5 text-zinc-400 transition-transform ${
                  isOpen ? 'transform rotate-180' : ''
                }`}
              />
            )}
          </button>
          
          {/* Edit Button (separate, outside main button) */}
          {!isDeploying && (
            <button
              onClick={() => setEditingStage(currentStage)}
              className="ml-3 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors flex items-center gap-2 text-sm"
              title="Edit stage parameters"
            >
              <Settings className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {isOpen && !isDeploying && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-abyss border border-zinc-700 rounded-xl overflow-hidden z-50 shadow-xl">
            <div className="max-h-96 overflow-y-auto">
              {STAGE_ORDER.map((stageId) => {
                const stage = getStageDisplay(stageId);
                if (!stage) return null;

                const isCurrent = stageId === currentStageId;

                return (
                  <button
                    key={stageId}
                    onClick={() => handleStageClick(stageId)}
                    className={`w-full p-4 flex items-center justify-between hover:bg-zinc-800 transition-colors ${
                      isCurrent
                        ? 'bg-neon-green/10 border-l-2 border-neon-green'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-xl">{stage.emoji}</span>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-base font-medium text-gray-100">
                            {stage.name}
                          </div>
                          {schedule[stageId]?.isCustom && (
                            <span className="px-2 py-0.5 bg-neon-green/20 text-neon-green text-xs rounded">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {stage.duration} • VPD: {stage.vpdRange}
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <Check className="w-5 h-5 text-neon-green" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && pendingStage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-abyss border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-gray-100 mb-4">
              Change Growth Stage?
            </h3>
            <p className="text-zinc-400 mb-6">
              This will update all automations for the new stage.
            </p>

            {/* From/To Display */}
            <div className="bg-zinc-900 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">{currentStageDisplay.emoji}</div>
                  <div className="text-sm text-zinc-400">{currentStageDisplay.name}</div>
                </div>
                <div className="text-zinc-500 text-xl">→</div>
                <div className="text-center">
                  <div className="text-2xl mb-1">{pendingStage.emoji}</div>
                  <div className="text-sm text-zinc-400">{pendingStage.name}</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-400">
                ⚠️ Your existing automations will be updated.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-zinc-800 text-gray-100 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeploying}
                className="flex-1 px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? 'Deploying...' : 'Change & Deploy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Editor Modal */}
      {editingStage && (
        <ScheduleEditor
          stage={editingStage}
          onSave={handleEditSave}
          onClose={() => setEditingStage(null)}
          onReset={handleEditReset}
        />
      )}
    </>
  );
}
