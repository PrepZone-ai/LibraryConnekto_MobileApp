import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Button, List, Surface, Text } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';
import { RootStackParamList } from '../../../types/navigation';

interface Message {
  id: string;
  message: string;
  created_at: string;
  admin_name: string;
  student_id: string | null;
  admin_id: string;
  is_broadcast: boolean;
  admin_response?: string;
  responded_at?: string;
  sender_type: 'student' | 'admin';
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const AdminMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isLoggedIn } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const fetchMessages = async () => {
    try {
      // Fetch messages using FastAPI
      const messagesData = await apiClient.get<Message[]>('/messaging/messages?limit=5');
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchMessages();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Set up polling for new messages
    const messagePolling = setInterval(async () => {
      if (isLoggedIn) {
        await fetchMessages();
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(messagePolling);
    };
  }, [isLoggedIn]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const getMessageType = (message: Message): 'info' | 'success' | 'warning' => {
    if (message.is_broadcast) return 'info';
    return message.admin_response ? 'success' : 'warning';
  };

  const getIconForType = (type: 'info' | 'success' | 'warning') => {
    switch (type) {
      case 'info':
        return 'information';
      case 'success':
        return 'check-circle';
      case 'warning':
        return 'alert';
      default:
        return 'information';
    }
  };

  const getColorForType = (type: 'info' | 'success' | 'warning') => {
    switch (type) {
      case 'info':
        return '#3b82f6';
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  if (loading) {
    return (
      <Surface style={styles.container}>
        <ActivityIndicator animating={true} />
      </Surface>
    );
  }

  const handleViewAllMessages = () => {
    // Navigate to the StudentChat screen which already shows all messages
    navigation.navigate('StudentHome', { screen: 'StudentChatTab' });
  };

  return (
    <Surface style={styles.container}>
      <View style={styles.headerContainer}>
        <Text variant="titleMedium" style={styles.title}>Messages from Admin</Text>
        <TouchableOpacity onPress={handleViewAllMessages} style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
      >
        <View style={styles.messageList}>
          {messages.length === 0 ? (
            <Text style={styles.emptyText}>No messages from admin</Text>
          ) : (
            messages.map((message) => {
              const type = getMessageType(message);
              return (
                <List.Item
                  key={message.id}
                  title={message.message}
                  description={`${message.admin_name} • ${new Date(message.created_at).toLocaleString()}`}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={getIconForType(type)}
                      color={getColorForType(type)}
                    />
                  )}
                  style={[
                    styles.messageItem,
                    { backgroundColor: `${getColorForType(type)}10` }
                  ]}
                />
              );
            })
          )}
        </View>
      </ScrollView>
      {messages.length > 0 && (
        <Button
          mode="outlined"
          onPress={handleViewAllMessages}
          style={styles.viewAllButton2}
          icon="message-text-outline"
        >
          View All Messages
        </Button>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 16,
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#1f2937',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#4F46E5',
    fontWeight: '500',
    marginRight: 4,
  },
  scrollView: {
    flex: 1,
    maxHeight: 300, // Limit height to make room for the button
  },
  messageList: {
    gap: 8,
  },
  messageItem: {
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginTop: 16,
  },
  viewAllButton2: {
    marginTop: 12,
    borderColor: '#4F46E5',
    borderRadius: 8,
  },
});

export default AdminMessages;
