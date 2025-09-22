import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Modal, Portal, SegmentedButtons, Surface, Text, TextInput } from 'react-native-paper';
import { apiClient } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import { AdminStackParamList } from '../../types/navigation';
import Header from '../common/Header';

type ChatRouteProp = RouteProp<AdminStackParamList, 'Chat'>;
type ChatNavigationProp = NativeStackNavigationProp<AdminStackParamList>;
type ChatMode = 'broadcast' | 'individual';

interface Message {
  id: string;
  message: string;
  created_at: string;
  student_name?: string;
  student_id?: string;
  admin_id: string;
  read: boolean;
  admin_response?: string;
  admin_name?: string;
  responded_at?: string;
  image_url?: string;
  is_broadcast?: boolean;
  sender_type: string;
}

const Chat = () => {
  const route = useRoute<ChatRouteProp>();
  const navigation = useNavigation<ChatNavigationProp>();
  const { studentName, studentId, studentUserId } = route.params || {};
  const { adminName, user, libraryName } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>(studentId ? 'individual' : 'broadcast');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        await loadMessages();
        // Set up polling for new messages
        const messagePolling = setInterval(async () => {
          await loadMessages();
        }, 5000); // Poll every 5 seconds

        return () => {
          clearInterval(messagePolling);
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        Alert.alert('Error', 'Failed to initialize chat');
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [chatMode, studentId]);

  const loadMessages = async () => {
    try {
      // Load messages using FastAPI
      const messagesData = await apiClient.get<Message[]>('/messaging/admin/messages');

      if (messagesData) {
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSend = async (imageUrl?: string) => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const messageData = {
        message: newMessage.trim(),
        image_url: imageUrl,
        ...(chatMode === 'individual' ? {
          student_id: studentId,
          is_broadcast: false
        } : {
          is_broadcast: true
        })
      };

      await apiClient.post('/messaging/admin/send-message', messageData);

      setNewMessage('');
      setShowImageOptions(false);

      await loadMessages();

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

  const pickImage = async (useCamera: boolean) => {
    setShowImageOptions(false);

    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery permission is needed to select photos.');
          return;
        }
      }

      const result = await (useCamera
        ? ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          })
        : ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            allowsEditing: true,
            aspect: [4, 3],
          }));

      if (!result.canceled && result.assets[0].uri) {
        // For now, we'll skip image upload and just send the message
        // In a real implementation, you'd upload to your server
        await handleSend();
      }
    } catch (error: any) {
      console.error('Error with image:', error);
      Alert.alert('Error', error?.message || 'Failed to process image');
    }
  };

  const handlePickImage = async () => {
    await pickImage(false);
  };

  const handleTakePhoto = async () => {
    await pickImage(true);
  };

  const handleChatModeChange = (value: string) => {
    const newMode = value as ChatMode;
    setChatMode(newMode);

    if (newMode === 'individual' && !studentId) {
      // Navigate to admin chat selector
      navigation.navigate('AdminChatSelector');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={chatMode === 'broadcast' ? 'Broadcast Messages' : `Chat with ${studentName}`}
        showBackButton
        onBackPress={() => navigation.goBack()}
        libraryName={libraryName || undefined}
        isAdminPage={true}
      />
      {chatMode === 'individual' && (
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{studentName}</Text>
        </View>
      )}
      <SegmentedButtons
        value={chatMode}
        onValueChange={handleChatModeChange}
        buttons={[
          { value: 'broadcast', label: 'Broadcast' },
          { value: 'individual', label: 'Individual' }
        ]}
        style={styles.segmentedButtons}
      />

      {chatMode === 'individual' && !studentId ? (
        <View style={styles.noStudentContainer}>
          <Text style={styles.noStudentText}>Please select a student to start chatting</Text>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('AdminChatSelector')}
            style={styles.selectStudentButton}
          >
            Select Student
          </Button>
        </View>
      ) : (
        <>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesList}
            >
              {messages.map((msg) => (
                <Surface
                  key={msg.id}
                  style={[
                    styles.messageItem,
                    msg.sender_type === 'admin' ? styles.sentMessage : styles.receivedMessage
                  ]}
                >
                  <Text style={styles.messageText}>{msg.message}</Text>
                  {msg.image_url && (
                    <Image
                      source={{ uri: msg.image_url }}
                      style={styles.messageImage}
                      resizeMode="contain"
                    />
                  )}
                  <Text style={styles.timestamp}>
                    {new Date(msg.created_at).toLocaleTimeString()}
                  </Text>
                </Surface>
              ))}
            </ScrollView>
          )}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            style={styles.inputContainer}
          >
            <Surface style={styles.inputWrapper}>
              <IconButton
                icon="image"
                size={24}
                onPress={() => setShowImageOptions(true)}
                style={styles.imageButton}
              />
              <TextInput
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type your message..."
                multiline
                style={styles.input}
              />
              <IconButton
                icon="send"
                size={24}
                onPress={() => handleSend()}
                disabled={sending || !newMessage.trim()}
                loading={sending}
                style={styles.sendButton}
              />
            </Surface>
          </KeyboardAvoidingView>
        </>
      )}
      <Portal>
        <Modal
          visible={showImageOptions}
          onDismiss={() => setShowImageOptions(false)}
          contentContainerStyle={styles.modal}
        >
          <Button
            mode="outlined"
            onPress={handlePickImage}
            style={styles.modalButton}
          >
            Choose from Gallery
          </Button>
          <Button
            mode="outlined"
            onPress={handleTakePhoto}
            style={styles.modalButton}
          >
            Take Photo
          </Button>
          <Button
            onPress={() => setShowImageOptions(false)}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  segmentedButtons: {
    margin: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageItem: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: 'white',
  },
  sentMessage: {
    backgroundColor: '#DCF8C6',
    alignSelf: 'flex-end',
  },
  receivedMessage: {
    backgroundColor: '#F7F7F7',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 8,
  },
  imageButton: {
    margin: 0,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    maxHeight: 100,
    paddingHorizontal: 8,
  },
  sendButton: {
    margin: 0,
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 12,
  },
  modalButton: {
    marginBottom: 12,
  },
  noStudentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noStudentText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  selectStudentButton: {
    marginTop: 8,
  },
  studentInfo: {
    padding: 16,
  },
  studentName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Chat; 