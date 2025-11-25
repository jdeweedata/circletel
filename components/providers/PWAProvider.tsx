'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  // Use ref to avoid closure issues - the prompt event needs to persist
  const deferredPromptRef = useRef<any>(null);

  useEffect(() => {
    // Install function that uses the ref (avoids stale closure)
    const triggerInstall = async () => {
      const prompt = deferredPromptRef.current;
      if (!prompt) {
        console.log('PWA: No deferred prompt available');
        return;
      }

      try {
        // Show the native install prompt
        prompt.prompt();
        const { outcome } = await prompt.userChoice;

        if (outcome === 'accepted') {
          console.log('PWA: User accepted the install prompt');
          toast.success("CircleTel App installed successfully!");
        } else {
          console.log('PWA: User dismissed the install prompt');
        }
      } catch (error) {
        console.error('PWA: Error during install:', error);
      } finally {
        // Clear the prompt - it can only be used once
        deferredPromptRef.current = null;
      }
    };

    // Expose globally for the toast action
    (window as any).triggerPWAInstall = triggerInstall;

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();

      // Store the event in ref (not state) to avoid closure issues
      deferredPromptRef.current = e;
      console.log('PWA: beforeinstallprompt event captured');

      // Show custom install prompt after a delay
      setTimeout(() => {
        toast("Install CircleTel App", {
          description: "Get the full experience with our mobile app!",
          action: {
            label: "Install",
            onClick: () => {
              // Call the global function to avoid closure issues
              (window as any).triggerPWAInstall?.();
            },
          },
          duration: 15000,
        });
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      console.log('PWA: App was installed');
    };

    // Register service worker
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('PWA: Service Worker registered:', registration);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast("App Update Available", {
                    description: "A new version is available. Refresh to update.",
                    action: {
                      label: "Refresh",
                      onClick: () => window.location.reload(),
                    },
                  });
                }
              });
            }
          });
        } catch (error) {
          console.log('PWA: Service Worker registration failed:', error);
        }
      });
    } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // In development, unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('PWA: Unregistered service worker in dev mode');
        }
      });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      delete (window as any).triggerPWAInstall;
    };
  }, []);

  return <>{children}</>;
}