import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, TextInput as RNTextInput, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { apiClient } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../common/Header';

type RootStackParamList = {
  StudentHome: {
    screen: 'StudentHomeTab' | 'StudentDashboardTab' | 'StudentChatTab' | 'StudentProfileTab';
  };
  StudentLogin: undefined;
  StudentProfile: undefined;
  BookSeat: undefined;
  StudentDashboard: undefined;
  StudentChat: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  message: string;
  created_at: string;
  responded_at?: string;
  admin_response?: string;
  admin_name?: string;
  student_name: string;
  student_id: string;
  admin_id: string;
  read: boolean;
  sender_type: 'student' | 'admin';
  is_broadcast?: boolean;
  image_url?: string;
}

const MESSAGES_PER_PAGE = 20;

const Chat: React.FC = () => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [studentInfo, setStudentInfo] = useState<{
    id: string;
    name: string;
    admin_id: string;
  } | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation<NavigationProp>();
  const { isLoggedIn } = useAuth();

  const loadMessages = async (studentId: string, pageNumber: number = 0, isRefresh: boolean = false) => {
    try {
      const skip = pageNumber * MESSAGES_PER_PAGE;

      // Fetch messages using FastAPI
      const messagesData = await apiClient.get(`/messaging/messages?skip=${skip}&limit=${MESSAGES_PER_PAGE}`);

      if (messagesData) {
        const formattedMessages = messagesData.map((msg: any) => ({
          ...msg,
          sender_type: msg.sender_type || (msg.admin_response ? 'admin' as const : 'student' as const)
        }));

        if (isRefresh) {
          setMessages(formattedMessages);
        } else {
          setMessages(prev => [...prev, ...formattedMessages]);
        }

        setHasMore(messagesData.length === MESSAGES_PER_PAGE);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try refreshing.');
    }
  };

  const onRefresh = async () => {
    if (studentInfo) {
      setRefreshing(true);
      await loadMessages(studentInfo.id, 0, true);
      setRefreshing(false);
      setPage(0);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !studentInfo) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadMessages(studentInfo.id, nextPage);
    setPage(nextPage);
    setLoadingMore(false);
  };

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        setLoading(true);

        // Get student profile using FastAPI
        const studentData = await apiClient.get('/student/profile');

        if (!studentData) throw new Error('Failed to fetch student data');

        setStudentInfo({
          id: studentData.id,
          name: studentData.name,
          admin_id: studentData.admin_id
        });

        await loadMessages(studentData.id, 0, true);
      } catch (error: any) {
        console.error('Error:', error);
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchStudentInfo();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!studentInfo) return;

    // Set up polling for new messages instead of realtime subscription
    const messagePolling = setInterval(async () => {
      await onRefresh();
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(messagePolling);
    };
  }, [studentInfo]);

  const sendMessage = async () => {
    if (!message.trim() || !studentInfo) {
      console.log('Cannot send message: empty message or missing student info', { messageLength: message.length, studentInfo });
      return;
    }

    try {
      setSending(true);
      console.log('Attempting to send message:', message.trim());

      // Use FastAPI to send message
      await apiClient.post('/messaging/send-message', {
        message: message.trim(),
        admin_id: studentInfo.admin_id
      });

      console.log('Message sent successfully');

      setMessage('');
      await onRefresh();
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to send message. Please try again.'
      );

      // If authentication error, redirect to login
      if (error.message?.includes('log in') || error.message?.includes('401')) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'StudentLogin' }],
        });
      }
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoggedIn) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'StudentLogin' }],
        });
      }
    };

    checkAuth();
  }, [isLoggedIn]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Chat with Library"
        showWelcome={false}
        hideBackButton={true}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            // Check if user has scrolled to the top to load more messages
            const isCloseToTop = contentOffset.y <= 10;
            if (isCloseToTop && hasMore && !loadingMore) {
              loadMoreMessages();
            }
          }}
          scrollEventThrottle={400}
          // Make sure we can see the latest messages by default
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
            {loadingMore && (
              <ActivityIndicator style={styles.loadingMore} size="small" color={theme.colors.primary} />
            )}
            {/* Display messages in chronological order (oldest to newest) */}
            {[...messages].reverse().map((msg, index) => (
              <Surface
                key={msg.id}
                style={[
                  styles.messageItem,
                  msg.sender_type === 'student' ? styles.sentMessage : styles.receivedMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.sender_type === 'admin' && styles.adminMessageText
                ]}>
                  {msg.message}
                </Text>
                {msg.admin_response && (
                  <Text style={styles.adminResponse}>{msg.admin_response}</Text>
                )}
                <Text style={[
                  styles.timestamp,
                  msg.sender_type === 'admin' ? styles.adminTimestamp : styles.studentTimestamp
                ]}>
                  {new Date(msg.created_at).toLocaleTimeString()}
                </Text>
                {msg.is_broadcast && (
                  <Text style={styles.broadcastLabel}>Broadcast</Text>
                )}
              </Surface>
            ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <RNTextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
          />
          <IconButton
            icon="send"
            size={24}
            disabled={sending || !message.trim()}
            onPress={sendMessage}
            style={styles.sendButton}
            iconColor="#FFFFFF"
            containerColor={message.trim() ? '#4F46E5' : '#A5B4FC'}
          />
        </View>
      </KeyboardAvoidingView>
      {/* BottomTabNavigator is already provided by the StudentTabNavigator in App.tsx */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF', // White background for messages area
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24, // Extra padding at the bottom for better spacing
  },
  messageItem: {
    padding: 12,
    marginVertical: 4,
    maxWidth: '80%',
    borderRadius: 12,
    elevation: 1,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4F46E5', // Indigo color for sent messages
    borderBottomRightRadius: 4, // Adjust corner to make it more chat-like
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6', // Light gray for received messages
    borderBottomLeftRadius: 4, // Adjust corner to make it more chat-like
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF', // White text for sent messages
    lineHeight: 22,
  },
  adminMessageText: {
    color: '#1F2937', // Dark gray text for admin/received messages
  },
  adminResponse: {
    marginTop: 8,
    fontSize: 14,
    color: '#FFFFFF', // White text for admin responses within sent messages
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 6,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  studentTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white for student messages
  },
  adminTimestamp: {
    color: 'rgba(31, 41, 55, 0.6)', // Semi-transparent dark for admin messages
  },
  broadcastLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444', // Red badge for broadcast messages
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingMore: {
    marginVertical: 8,
  },
  sendButton: {
    margin: 0,
    borderRadius: 24,
  },
});

export default Chat;
