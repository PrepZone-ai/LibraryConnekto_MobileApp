import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, IconButton, Surface, Text, TextInput, useTheme } from 'react-native-paper';
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
  const { isLoggedIn, user } = useAuth();

  const loadMessages = async (pageNumber: number = 0, isRefresh: boolean = false) => {
    try {
      const skip = pageNumber * MESSAGES_PER_PAGE;

      // Fetch messages using FastAPI
      const messagesData = await apiClient.get<Message[]>(`/messaging/messages?skip=${skip}&limit=${MESSAGES_PER_PAGE}`);

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
    setRefreshing(true);
    await loadMessages(0, true);
    setRefreshing(false);
    setPage(0);
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    await loadMessages(nextPage, false);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const fetchStudentInfo = async () => {
    try {
      // Get student profile using FastAPI
      const studentData = await apiClient.get('/students/profile');
      
      if (studentData) {
        setStudentInfo({
          id: studentData.id,
          name: studentData.name,
          admin_id: studentData.admin_id
        });
      }
    } catch (error) {
      console.error('Error fetching student info:', error);
      Alert.alert('Error', 'Failed to load student information');
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !studentInfo) return;

    setSending(true);
    try {
      const messageData = {
        message: message.trim(),
        admin_id: studentInfo.admin_id
      };

      await apiClient.post('/messaging/send-message', messageData);

      setMessage('');
      
      // Reload messages to show the new message
      await loadMessages(0, true);
      setPage(0);

      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoggedIn) {
        navigation.navigate('StudentLogin');
        return;
      }

      try {
        await fetchStudentInfo();
        await loadMessages(0, true);
      } catch (error) {
        console.error('Error in checkAuth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isLoggedIn, navigation]);

  useEffect(() => {
    // Set up polling for new messages
    const messagePolling = setInterval(async () => {
      if (studentInfo) {
        await loadMessages(0, true);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(messagePolling);
    };
  }, [studentInfo]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <Header
        title="Chat with Admin"
        showBackButton={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            const isCloseToTop = contentOffset.y <= 0;
            
            if (isCloseToTop && hasMore && !loadingMore) {
              loadMoreMessages();
            }
          }}
          scrollEventThrottle={400}
        >
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingMoreText}>Loading more messages...</Text>
            </View>
          )}

          {messages.map((msg, index) => (
            <Surface
              key={msg.id || index}
              style={[
                styles.messageBubble,
                msg.sender_type === 'student' ? styles.studentMessage : styles.adminMessage
              ]}
            >
              {msg.sender_type === 'admin' && msg.admin_name && (
                <Text style={styles.adminName}>{msg.admin_name}</Text>
              )}
              
              <Text style={styles.messageText}>{msg.message}</Text>
              
              {msg.image_url && (
                <Surface style={styles.imageContainer}>
                  <Text style={styles.imagePlaceholder}>📷 Image</Text>
                </Surface>
              )}
              
              <Text style={styles.messageTime}>
                {formatTime(msg.created_at)}
              </Text>
            </Surface>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            mode="outlined"
            style={styles.textInput}
            multiline
            maxLength={500}
            right={
              <TextInput.Icon
                icon="send"
                onPress={sendMessage}
                disabled={sending || !message.trim()}
                loading={sending}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
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
    backgroundColor: '#f3f4f6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesList: {
    paddingBottom: 16,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  messageBubble: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: '80%',
  },
  studentMessage: {
    backgroundColor: '#4F46E5',
    alignSelf: 'flex-end',
  },
  adminMessage: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  adminName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 16,
    color: '#1F2937',
  },
  imageContainer: {
    marginTop: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 14,
    color: '#6B7280',
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    marginRight: 8,
  },
});

export default Chat; 