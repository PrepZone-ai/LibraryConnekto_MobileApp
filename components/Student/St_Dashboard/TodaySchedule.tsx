import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Dialog, List, Portal, Surface, Text, TextInput } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import { checkNotifications } from '../../../services/backgroundTaskService';
import { scheduleTaskNotification } from '../../../services/notificationService';
import { RootStackParamList } from '../../../types/navigation';

interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  completed?: boolean;
  student_id?: string;
  date?: string;
  created_at?: string;
  isHeader?: boolean;
}

interface TodayScheduleProps {
  schedule: ScheduleItem[];
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const TodaySchedule: React.FC<TodayScheduleProps> = ({ schedule: initialSchedule }) => {
  const navigation = useNavigation<NavigationProp>();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [displayedSchedule, setDisplayedSchedule] = useState<ScheduleItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const { user, studentName } = useAuth();

  // Fetch tasks from database
  useEffect(() => {
    if (user) {
      fetchTasks();
    } else {
      // If no user, use the initial schedule from props
      setSchedule(initialSchedule);
      setDisplayedSchedule(initialSchedule.slice(0, 5));
      setLoading(false);
    }
  }, [user]);

  // Update displayed tasks when schedule changes or showAllTasks changes
  useEffect(() => {
    if (showAllTasks) {
      setDisplayedSchedule(schedule);
    } else {
      setDisplayedSchedule(schedule.slice(0, 5));
    }
  }, [schedule, showAllTasks]);

  const fetchTasks = async () => {
    try {
      setLoading(true);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Fetch tasks for today using FastAPI
      const tasksData = await apiClient.get<any[]>(`/student/tasks?date=${today}`);

      // Sort tasks: uncompleted first, then completed
      const uncompletedTasks = tasksData.filter(task => !task.completed);
      const completedTasks = tasksData.filter(task => task.completed);

      const sortedTasks = [...uncompletedTasks, ...completedTasks];
      setSchedule(sortedTasks);
      setDisplayedSchedule(sortedTasks.slice(0, 5));
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setSchedule(initialSchedule);
      setDisplayedSchedule(initialSchedule.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const hours = ['Morning', 'Afternoon', 'Evening', 'Night'];
    const timesByPeriod: Record<string, string[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Night: []
    };

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date();
        time.setHours(hour, minute);
        const timeString = time.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        if (hour >= 5 && hour < 12) {
          timesByPeriod['Morning'].push(timeString);
        } else if (hour >= 12 && hour < 17) {
          timesByPeriod['Afternoon'].push(timeString);
        } else if (hour >= 17 && hour < 20) {
          timesByPeriod['Evening'].push(timeString);
        } else {
          timesByPeriod['Night'].push(timeString);
        }
      }
    }

    return hours.map(period => ({
      period,
      times: timesByPeriod[period]
    }));
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setTaskTime(time);
    setShowTimePicker(false);
  };

  const handleAddTask = async () => {
    if (taskTitle && taskTime && user) {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Create new task using FastAPI
        const taskData = {
          title: taskTitle,
          time: taskTime,
          completed: false,
          date: today
        };

        // Save task to database using FastAPI
        const savedTask = await apiClient.post('/student/tasks', taskData);

        // Schedule notification for the task
        try {
          await scheduleTaskNotification(
            savedTask.id,
            savedTask.title,
            savedTask.time,
            savedTask.student_id,
            savedTask.date
          );

          // Manually check for notifications after scheduling
          // This ensures the notification is processed immediately if needed
          await checkNotifications();
        } catch (notificationError) {
          console.warn('Error scheduling notification, but task was saved:', notificationError);
          // Continue with the task creation even if notification scheduling fails
        }

        // Sort tasks by time and completion status
        const uncompletedTasks = schedule.filter(task => !task.completed);
        const completedTasks = schedule.filter(task => task.completed);

        const updatedSchedule = [...uncompletedTasks, savedTask, ...completedTasks].sort((a, b) => {
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;

          const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
          const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
          return timeA - timeB;
        });

        setSchedule(updatedSchedule);
        setTaskTitle('');
        setTaskTime('');
        setSelectedTime(null);
        setModalVisible(false);

        // Show confirmation
        Alert.alert(
          'Task Added',
          `Your task "${savedTask.title}" has been scheduled for ${savedTask.time}. You will receive a notification 15 minutes before the task.`
        );
      } catch (error) {
        console.error('Error adding task:', error);
        Alert.alert('Error', 'Could not add task. Please try again.');
      }
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      // Find the task to toggle
      const taskToToggle = schedule.find(task => task.id === taskId);
      if (!taskToToggle) return;

      const newCompletionStatus = !taskToToggle.completed;

      // Update task in database using FastAPI
      await apiClient.put(`/student/tasks/${taskId}`, {
        completed: newCompletionStatus
      });

      // Update local state
      const updatedSchedule = schedule.map(task => {
        if (task.id === taskId) {
          return { ...task, completed: newCompletionStatus };
        }
        return task;
      });

      // Sort tasks: uncompleted first, then completed
      const uncompletedTasks = updatedSchedule.filter(task => !task.completed)
        .sort((a, b) => {
          const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
          const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
          return timeA - timeB;
        });

      const completedTasks = updatedSchedule.filter(task => task.completed)
        .sort((a, b) => {
          const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
          const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
          return timeA - timeB;
        });

      const sortedTasks = [...uncompletedTasks, ...completedTasks];
      setSchedule(sortedTasks);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      Alert.alert('Error', 'Could not update task. Please try again.');
    }
  };

  const handleBackToToday = () => {
    setShowAllTasks(false);
    fetchTasks(); // Reload today's tasks
  };

  const handleViewAllTasks = async () => {
    try {
      setLoading(true);

      // Fetch all tasks for the student using FastAPI
      const allTasksData = await apiClient.get<any[]>('/student/tasks');

      // Group tasks by date
      const tasksByDate = allTasksData.reduce((acc, task) => {
        const date = task.date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(task);
        return acc;
      }, {});

      // Sort tasks within each date group: uncompleted first, then completed
      Object.keys(tasksByDate).forEach(date => {
        const uncompletedTasks = tasksByDate[date].filter(task => !task.completed);
        const completedTasks = tasksByDate[date].filter(task => task.completed);

        // Sort by time within each group
        uncompletedTasks.sort((a, b) => {
          const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
          const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
          return timeA - timeB;
        });

        completedTasks.sort((a, b) => {
          const timeA = new Date(`1970/01/01 ${a.time}`).getTime();
          const timeB = new Date(`1970/01/01 ${b.time}`).getTime();
          return timeA - timeB;
        });

        tasksByDate[date] = [...uncompletedTasks, ...completedTasks];
      });

      // Flatten the grouped tasks into a single array, with date headers
      const allTasksWithHeaders = [];
      Object.keys(tasksByDate)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Sort dates newest first
        .forEach(date => {
          // Add a date header item
          allTasksWithHeaders.push({
            id: `header-${date}`,
            title: formatDate(date),
            time: '',
            isHeader: true,
            date
          });

          // Add the tasks for this date
          tasksByDate[date].forEach(task => {
            allTasksWithHeaders.push({
              ...task,
              isHeader: false
            });
          });
        });

      setSchedule(allTasksWithHeaders);
      setDisplayedSchedule(allTasksWithHeaders);
    } catch (error) {
      console.error('Error loading all tasks:', error);
      setShowAllTasks(true); // Just show what we have
    } finally {
      setLoading(false);
      setShowAllTasks(true);
    }
  };

  // Helper function to format dates nicely
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    // Check if it's yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    // Otherwise return formatted date
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <>
      <Surface style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{showAllTasks ? 'All Tasks' : 'Today\'s Schedule'}</Text>
            {showAllTasks && (
              <Button
                mode="text"
                icon="calendar-today"
                onPress={handleBackToToday}
                style={styles.backButton}
                compact
              >
                Today
              </Button>
            )}
          </View>
          <Button
            mode="contained"
            icon="plus"
            onPress={() => setModalVisible(true)}
            style={styles.addButton}
            disabled={loading}
          >
            Add Task
          </Button>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading your schedule...</Text>
          </View>
        ) : (
          <View style={styles.scheduleList}>
            {schedule.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={48}
                  color="#6b7280"
                />
                <Text style={styles.emptyText}>No tasks scheduled for today</Text>
                <Text style={styles.helperText}>
                  Add tasks to start planning your day
                </Text>
              </View>
            ) : (
              <>
                {displayedSchedule.map((item) => (
                  item.isHeader ? (
                    // Render date header
                    <View key={item.id} style={styles.dateHeaderContainer}>
                      <Text style={styles.dateHeader}>{item.title}</Text>
                    </View>
                  ) : (
                    // Render task item
                    <List.Item
                      key={item.id}
                      title={
                        <Text style={[
                          styles.taskTitle,
                          item.completed && styles.completedTaskTitle
                        ]}>
                          {item.title}
                        </Text>
                      }
                      description={
                        <View>
                          <Text style={[
                            styles.taskTime,
                            item.completed && styles.completedTaskTime
                          ]}>
                            {item.time}
                          </Text>
                          {showAllTasks && item.date && !item.isHeader && (
                            <Text style={styles.taskDate}>
                              {new Date(item.date).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      }
                      left={props => (
                        <Button
                          mode="text"
                          onPress={() => toggleTaskCompletion(item.id)}
                          style={styles.checkButton}
                        >
                          <MaterialCommunityIcons
                            name={item.completed ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                            size={24}
                            color={item.completed ? "#10b981" : "#6b7280"}
                          />
                        </Button>
                      )}
                      right={props => (
                        <MaterialCommunityIcons
                          {...props}
                          name="clock-outline"
                          size={24}
                          color="#6b7280"
                          style={styles.clockIcon}
                        />
                      )}
                      style={[
                        styles.scheduleItem,
                        item.completed && styles.completedItem
                      ]}
                    />
                  )
                ))}

                {schedule.length > 5 && !showAllTasks && (
                  <Button
                    mode="outlined"
                    onPress={handleViewAllTasks}
                    style={styles.viewAllButton}
                    icon="calendar-text"
                  >
                    View All Tasks
                  </Button>
                )}
              </>)}
          </View>
        )}
      </Surface>

      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Add New Task</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Task Title"
              value={taskTitle}
              onChangeText={setTaskTitle}
              mode="outlined"
              style={styles.input}
            />

            <Button
              mode="outlined"
              onPress={() => setShowTimePicker(true)}
              style={styles.timeButton}
              icon="clock-outline"
            >
              {taskTime || "Select Task Time"}
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button onPress={handleAddTask} disabled={!taskTitle || !taskTime}>
              Add Task
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showTimePicker} onDismiss={() => setShowTimePicker(false)}>
          <Dialog.Title>Select Time</Dialog.Title>
          <Dialog.ScrollArea style={styles.timePickerScrollArea}>
            <ScrollView>
              {generateTimeSlots().map(({ period, times }) => (
                <View key={period} style={styles.periodContainer}>
                  <Text style={styles.periodHeader}>{period}</Text>
                  <View style={styles.timeGrid}>
                    {times.map((time, index) => {
                      const isSelected = selectedTime === time;
                      return (
                        <Button
                          key={index}
                          mode={isSelected ? "contained" : "outlined"}
                          onPress={() => handleTimeSelect(time)}
                          style={[styles.timeOption, isSelected && styles.selectedTime]}
                          labelStyle={isSelected ? styles.selectedTimeText : undefined}
                        >
                          {time}
                        </Button>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowTimePicker(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  backButton: {
    marginLeft: 8,
  },
  addButton: {
    borderRadius: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 14,
  },
  scheduleList: {
    gap: 8,
  },
  scheduleItem: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 4,
  },
  completedItem: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  completedTaskTitle: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  taskTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  completedTaskTime: {
    color: '#94a3b8',
  },
  checkButton: {
    margin: 0,
    padding: 0,
  },
  clockIcon: {
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  timeButton: {
    marginBottom: 16,
  },
  timePickerScrollArea: {
    maxHeight: 400,
  },
  periodContainer: {
    marginBottom: 16,
  },
  periodHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 8,
  },
  timeOption: {
    marginBottom: 4,
    minWidth: '45%',
    borderRadius: 8,
  },
  selectedTime: {
    backgroundColor: '#6366f1',
  },
  selectedTimeText: {
    color: 'white',
  },
  viewAllButton: {
    marginTop: 12,
    borderRadius: 8,
    borderColor: '#6366f1',
  },
  dateHeaderContainer: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  taskDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
});

export default TodaySchedule;
