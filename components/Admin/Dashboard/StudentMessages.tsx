import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Surface, Text } from 'react-native-paper';
import { adminAPI, MessageResponse } from '../../../config/api';
import { AdminStackParamList } from '../../../types/navigation';

interface Message {
  id: string;
  student_id: string;
  student_name: string;
  message: string;
  created_at: string;
  read: boolean;
  admin_response?: string;
  admin_name?: string;
  sender_type: string;
  admin_id: string;
  subscription_status?: string;
}

interface StudentMessagesProps {
  isRecentMessages?: boolean;
  containerStyle?: any;
}

const StudentMessages: React.FC<StudentMessagesProps> = ({
  isRecentMessages = false,
  containerStyle
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<NavigationProp<AdminStackParamList>>();

  useEffect(() => {
    const initializeMessages = async () => {
      try {
        await loadRecentMessages();
        setupMessagePolling();
      } catch (error) {
        console.error('Error initializing messages:', error);
      }
    };

    initializeMessages();
  }, [isRecentMessages]);

  const loadRecentMessages = async () => {
    setError(null);
    try {
      console.log('Fetching messages, isRecentMessages:', isRecentMessages);

      // Get messages from FastAPI
      const messagesResponse = await adminAPI.getMessages({
        limit: isRecentMessages ? 5 : 50
      });

      console.log('Messages fetched:', messagesResponse ? (Array.isArray(messagesResponse) ? messagesResponse.length : 'Not an array') : 0);

      if (messagesResponse && Array.isArray(messagesResponse)) {
        // Transform data to match our interface
        const transformedMessages: Message[] = messagesResponse.map((msg: MessageResponse) => ({
          id: msg.id,
          student_id: msg.student_id,
          student_name: msg.student_name || 'Unknown Student',
          message: msg.message,
          created_at: msg.created_at,
          read: msg.read,
          admin_response: msg.admin_name ? msg.message : undefined, // If admin_name exists, it's a response
          admin_name: msg.admin_name || undefined,
          sender_type: msg.sender_type,
          admin_id: msg.admin_id,
          subscription_status: 'unknown'
        }));

        console.log('Transformed messages:', transformedMessages.length);
        setMessages(transformedMessages);
      } else {
        console.log('No messages found or invalid response format');
        setMessages([]);
      }
    } catch (error) {
      console.error('Error loading student messages:', error);
      setError('Failed to load messages');
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const setupMessagePolling = () => {
    console.log('Setting up message polling');

    // Set up polling for message updates instead of realtime subscriptions
    const pollingInterval = setInterval(() => {
      loadRecentMessages();
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(pollingInterval);
    };
  };

  const handleViewAll = () => {
    navigation.navigate('StudentMessages', { isRecentMessages: false });
  };

  const renderHeader = () => {
    if (isRecentMessages) {
      return (
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Recent Messages</Text>
          <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>All Messages from Students</Text>
      </View>
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {!isRecentMessages && renderHeader()}
      {loading ? (
        <ActivityIndicator size="large" color="#6366F1" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="message-text-outline" size={32} color="#9CA3AF" />
          <Text style={styles.noMessagesText}>No messages from students</Text>
          <Text style={styles.emptySubtext}>Messages from students will appear here</Text>
        </View>
      ) : (
        <ScrollView
          style={[styles.messageList]}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 8 }}
        >
          {messages.map((message) => (
            <Surface key={message.id} style={styles.messageCard}>
              <View style={styles.messageHeader}>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{message.student_name}</Text>
                  <Text style={styles.timestamp}>{formatTime(message.created_at)}</Text>
                </View>
                <View style={styles.messageStatus}>
                  {!message.read && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>New</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.messageText} numberOfLines={2} ellipsizeMode="tail">
                {message.message}
              </Text>
              {message.admin_response && (
                <View style={styles.responseContainer}>
                  <Text style={styles.responseLabel}>Response:</Text>
                  <Text style={styles.responseText} numberOfLines={1} ellipsizeMode="tail">
                    {message.admin_response}
                  </Text>
                </View>
              )}
              <View style={styles.messageFooter}>
                <TouchableOpacity
                  style={styles.replyButton}
                  onPress={() => navigation.navigate('Chat', {
                    studentName: message.student_name,
                    studentId: message.student_id
                  })}
                >
                  <MaterialCommunityIcons name="reply" size={20} color="#6366F1" />
                  <Text style={styles.replyText}>Reply</Text>
                </TouchableOpacity>
              </View>
            </Surface>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    height: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  viewAllText: {
    color: '#6366F1',
    fontWeight: '600',
    marginRight: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: '#EF4444',
    marginTop: 16,
  },
  noMessagesText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 4,
    fontSize: 14,
  },
  messageList: {
    padding: 8,
    flex: 1,
    minHeight: 200,
  },
  messageCard: {
    marginHorizontal: 8,
    marginBottom: 8, // Reduced margin
    padding: 10, // Reduced padding
    borderRadius: 8,
    elevation: 2,
    backgroundColor: '#ffffff',
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  timestamp: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  messageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unreadText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: '500',
  },
  messageText: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4, // Reduced margin
    // Limit to 2 lines with ellipsis
    lineHeight: 15, // Reduced line height
    maxHeight: 30, // Reduced max height
    overflow: 'hidden',
  },
  responseContainer: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  responseLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 2,
  },
  responseText: {
    fontSize: 12,
    color: '#374151',
    // Limit to 1 line with ellipsis
    lineHeight: 16,
    maxHeight: 16,
    overflow: 'hidden',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  replyText: {
    marginLeft: 2,
    color: '#6366F1',
    fontSize: 12,
  },
});

export default StudentMessages;
