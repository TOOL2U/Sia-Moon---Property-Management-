import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useJobs } from './JobContext';
import { useAuth } from './AuthContext';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  registerForPushNotifications: () => Promise<void>;
  showJobNotification: (jobTitle: string, jobId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const { pendingJobs } = useJobs();
  const { user } = useAuth();

  // Register for push notifications
  const registerForPushNotifications = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Expo push token:', token);
      setExpoPushToken(token);

      // TODO: Send token to backend to associate with user
      
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
    }
  };

  // Show local notification for new job
  const showJobNotification = async (jobTitle: string, jobId: string) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'New Job Assignment',
          body: `You have been assigned: ${jobTitle}`,
          data: { jobId, type: 'job_assignment' },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('❌ Error showing job notification:', error);
    }
  };

  // Listen for notification responses
  useEffect(() => {
    const responseSubscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data;
      console.log('📱 Notification tapped:', data);
      
      if (data.type === 'job_assignment' && data.jobId) {
        // TODO: Navigate to job details screen
        console.log('📱 Navigate to job:', data.jobId);
      }
    });

    const notificationSubscription = Notifications.addNotificationReceivedListener((notification: any) => {
      setNotification(notification);
    });

    return () => {
      responseSubscription.remove();
      notificationSubscription.remove();
    };
  }, []);

  // Monitor for new pending jobs and show notifications
  useEffect(() => {
    if (!user) return;

    // Check for new pending jobs that haven't been responded to
    const newJobs = pendingJobs.filter(job => !job.staffResponse);
    
    if (newJobs.length > 0) {
      console.log('🔔 Showing notifications for', newJobs.length, 'new jobs');
      
      newJobs.forEach(job => {
        showJobNotification(job.title, job.id);
      });
    }
  }, [pendingJobs, user]);

  // Register for notifications when user logs in
  useEffect(() => {
    if (user) {
      registerForPushNotifications();
    }
  }, [user]);

  const value: NotificationContextType = {
    expoPushToken,
    notification,
    registerForPushNotifications,
    showJobNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
