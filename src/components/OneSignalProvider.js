"use client";

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

export default function OneSignalProvider({ children }) {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        if (typeof window !== 'undefined' && window.plugins && window.plugins.OneSignal) {
          window.plugins.OneSignal.initialize("1591c724-f17d-4586-9259-da31b2d47083");
          window.plugins.OneSignal.Notifications.requestPermission(true);
        } else {
          await OneSignal.init({
            appId: "1591c724-f17d-4586-9259-da31b2d47083",
            notifyButton: {
              enable: true,
            },
            allowLocalhostAsSecureOrigin: true,
          });
          window.OneSignal = OneSignal; OneSignal.Slidedown.promptPush();
        }
      } catch (error) {
        console.error("OneSignal Initialization Error:", error);
      }
    };
    
    // Check if we are in the browser
    if (typeof window !== 'undefined') {
      initOneSignal();
    }
  }, []);

  return <>{children}</>;
}
