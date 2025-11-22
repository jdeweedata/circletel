'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      // Install prompt disabled - users can install manually via browser menu
      // setTimeout(() => {
      //   toast("Install CircleTel App", {
      //     description: "Get the full experience with our mobile app!",
      //     action: {
      //       label: "Install",
      //       onClick: () => installPWA(),
      //     },
      //     duration: 10000,
      //   });
      // }, 5000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast.success("CircleTel App installed successfully!");
    };

    // Register service worker
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('SW registered: ', registration);

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
          console.log('SW registration failed: ', error);
        }
      });
    } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // In development, unregister any existing service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('Unregistered existing service worker in dev mode');
        }
      });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Expose install function globally for use in components
  useEffect(() => {
    (window as any).installPWA = installPWA;
  }, [installPWA]);

  return <>{children}</>;
}