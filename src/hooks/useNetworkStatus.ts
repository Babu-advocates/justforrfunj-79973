import { useEffect } from 'react';
import { showToast } from '@/lib/toast';

export const useNetworkStatus = () => {
  useEffect(() => {
    let offlineInterval: NodeJS.Timeout | null = null;

    const handleOnline = () => {
      showToast.success('Network connection restored');
      if (offlineInterval) {
        clearInterval(offlineInterval);
        offlineInterval = null;
      }
    };

    const handleOffline = () => {
      showToast.error('No network available. Please check your connection.');
      
      // Show toast every 8 seconds while offline
      offlineInterval = setInterval(() => {
        if (!navigator.onLine) {
          showToast.error('No network available. Please check your connection.');
        }
      }, 8000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      showToast.error('No network available. Please check your connection.');
      offlineInterval = setInterval(() => {
        if (!navigator.onLine) {
          showToast.error('No network available. Please check your connection.');
        }
      }, 8000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineInterval) {
        clearInterval(offlineInterval);
      }
    };
  }, []);
};
