import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Surface, TextInput } from 'react-native-paper';
import { apiClient } from '../../../config/api';

interface SendMessageProps {
  adminId: string;
  studentId: string;
  studentName: string;
  onMessageSent?: () => void;
}

const SendMessage: React.FC<SendMessageProps> = ({
  adminId,
  studentId,
  studentName,
  onMessageSent
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      setSending(true);

      const messageData = {
        admin_id: adminId,
        message: message.trim()
      };

      await apiClient.post('/messaging/send-message', messageData);

      setMessage('');
      onMessageSent?.();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Surface style={styles.container} elevation={1}>
      <TextInput
        mode="outlined"
        value={message}
        onChangeText={setMessage}
        placeholder="Type your message..."
        multiline
        numberOfLines={3}
        style={styles.input}
        outlineColor="#E5E7EB"
        activeOutlineColor="#6366F1"
      />
      <Button
        mode="contained"
        onPress={handleSendMessage}
        loading={sending}
        disabled={sending || !message.trim()}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Send Message
      </Button>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'white',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#6366F1',
  },
  buttonContent: {
    height: 48,
  },
});

export default SendMessage;
