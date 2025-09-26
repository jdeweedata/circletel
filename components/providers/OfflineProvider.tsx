'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';

interface OfflineContextType {
  isOnline: boolean;
  pendingActions: number;
  addPendingAction: () => void;
  removePendingAction: () => void;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState(0);
  const [hasShownOfflineMessage, setHasShownOfflineMessage] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setHasShownOfflineMessage(false);

      if (pendingActions > 0) {
        toast.success(`Back online! Syncing ${pendingActions} pending changes...`);
        // Trigger sync of pending actions
        syncPendingActions();
      } else {
        toast.success("Back online!");
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (!hasShownOfflineMessage) {
        toast.warning("You're offline. Changes will be saved locally and synced when reconnected.");
        setHasShownOfflineMessage(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [pendingActions, hasShownOfflineMessage]);

  const addPendingAction = () => {
    setPendingActions(prev => prev + 1);
  };

  const removePendingAction = () => {
    setPendingActions(prev => Math.max(0, prev - 1));
  };

  const syncPendingActions = async () => {
    // This will be implemented with IndexedDB sync logic
    console.log('Syncing pending actions...');

    // Simulate sync process
    setTimeout(() => {
      setPendingActions(0);
      toast.success("All changes synced successfully!");
    }, 2000);
  };

  const contextValue: OfflineContextType = {
    isOnline,
    pendingActions,
    addPendingAction,
    removePendingAction,
  };

  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-yellow-800">
              Offline Mode
            </span>
            {pendingActions > 0 && (
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                {pendingActions} pending
              </span>
            )}
          </div>
        </div>
      )}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}