import { processPendingNotifications } from './notificationService';

// Define task names
export const NOTIFICATION_TASK = 'check-task-notifications';

// Instead of using TaskManager directly, we'll use a more reliable approach
// with manual notification checking

// Set up a timer to check for notifications periodically
let notificationTimer: NodeJS.Timeout | null = null;

// Register background tasks - using setInterval instead of TaskManager
export const registerBackgroundTasks = async (): Promise<void> => {
  try {
    // Clear any existing timer
    if (notificationTimer) {
      clearInterval(notificationTimer);
    }

    // Set up a timer to check for notifications every 5 minutes
    // This is a fallback approach since TaskManager isn't working
    notificationTimer = setInterval(async () => {
      console.log('Checking for pending notifications...');
      try {
        await processPendingNotifications();
      } catch (error) {
        console.error('Error processing notifications:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes in milliseconds

    console.log('Successfully set up notification timer');
  } catch (error) {
    console.error('Error setting up notification timer:', error);
  }
};

// Unregister background tasks - clear the interval
export const unregisterBackgroundTasks = async (): Promise<void> => {
  try {
    if (notificationTimer) {
      clearInterval(notificationTimer);
      notificationTimer = null;
      console.log('Successfully cleared notification timer');
    }
  } catch (error) {
    console.error('Error clearing notification timer:', error);
  }
};

// Function to manually check for notifications
// This can be called from various parts of the app
export const checkNotifications = async (): Promise<void> => {
  try {
    console.log('Manually checking for notifications...');
    await processPendingNotifications();
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
};
