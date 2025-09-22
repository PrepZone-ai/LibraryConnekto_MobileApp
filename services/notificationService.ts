import { Alert, Platform } from 'react-native';
import { apiClient } from '../config/api';

interface TaskNotification {
  id: string;
  title: string;
  time: string;
  studentId: string;
  studentEmail?: string;
  studentName?: string;
  date: string;
}

/**
 * Schedule a notification for a task
 */
export const scheduleTaskNotification = async (
  taskId: string,
  title: string,
  time: string,
  studentId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<boolean> => {
  try {
    // For now, just show a notification to the user since we're using FastAPI backend
    // TODO: Implement task notifications API endpoint in FastAPI backend
    if (Platform.OS === 'web') {
      Alert.alert(
        'Task Scheduled',
        `Your task "${title}" has been scheduled for ${time}. You will receive a notification before the task.`
      );
    }

    console.log('Task notification scheduled:', { taskId, title, time, studentId, date });
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
};

/**
 * Send a notification for a task
 */
export const sendTaskNotification = async (notification: TaskNotification): Promise<boolean> => {
  try {
    // For now, just log the notification since we're using FastAPI backend
    // TODO: Implement student data fetching and email sending via FastAPI backend
    console.log('Task notification would be sent:', notification);

    // Show a web notification if on web platform
    if (Platform.OS === 'web') {
      Alert.alert(
        'Task Reminder',
        `Reminder: ${notification.title} at ${notification.time}`
      );
    }

    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

/**
 * Check for pending notifications and send them
 */
export const processPendingNotifications = async (): Promise<void> => {
  try {
    // For now, just log that we're checking for notifications
    // TODO: Implement notification checking via FastAPI backend
    console.log('Checking for pending notifications...');

    // In the future, this would call the FastAPI backend to get pending notifications
    // const notifications = await apiClient.get('/notifications/pending');

    // For now, just return without doing anything
    return;
  } catch (error) {
    console.error('Error processing notifications:', error);
  }
};
