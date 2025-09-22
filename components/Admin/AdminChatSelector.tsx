import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Surface, Text, Button, Card, Portal, Modal, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { AdminStackParamList } from '../../types/navigation';
import { adminAPI } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../common/Header';

type Props = {
  navigation: NativeStackNavigationProp<AdminStackParamList, 'Chat'>;
};

type ChatMode = 'broadcast' | 'individual' | 'select';

const AdminChatSelector: React.FC<Props> = ({ navigation }) => {
  const { libraryName } = useAuth();
  const [chatMode, setChatMode] = useState<ChatMode>('select');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [sending, setSending] = useState(false);
  const isFocused = useIsFocused();

  // Hide bottom navigation when this screen is focused
  useEffect(() => {
    if (isFocused) {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' }
      });
    } else {
      navigation.getParent()?.setOptions({
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          height: 60,
          paddingBottom: 8,
        }
      });
    }
  }, [isFocused, navigation]);

  const handleBroadcastMessage = async () => {
    if (!broadcastMessage.trim()) {
      Alert.alert('Error', 'Please enter a message to broadcast');
      return;
    }

    setSending(true);
    try {
      await adminAPI.sendMessage({
        message: broadcastMessage.trim(),
        is_broadcast: true
      });

      setBroadcastMessage('');
      setShowBroadcastModal(false);
      setChatMode('select');
      
      Alert.alert('Success', 'Broadcast message sent to all registered students!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send broadcast message');
    } finally {
      setSending(false);
    }
  };

  const handleSelectStudent = () => {
    navigation.navigate('StudentManagement', { 
      refresh: false,
      selectForChat: true 
    });
  };



  const renderBroadcastModal = () => (
    <Portal>
      <Modal
        visible={showBroadcastModal}
        onDismiss={() => setShowBroadcastModal(false)}
        contentContainerStyle={styles.modal}
      >
        <Surface style={styles.modalContent}>
          <Text style={styles.modalTitle}>Broadcast Message</Text>
          <Text style={styles.modalSubtitle}>
            This message will be sent to all registered students
          </Text>
          
          <TextInput
            mode="outlined"
            label="Message"
            value={broadcastMessage}
            onChangeText={setBroadcastMessage}
            multiline
            numberOfLines={4}
            style={styles.messageInput}
            placeholder="Enter your broadcast message..."
          />
          
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowBroadcastModal(false);
                setBroadcastMessage('');
                setChatMode('select');
              }}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleBroadcastMessage}
              loading={sending}
              disabled={sending || !broadcastMessage.trim()}
              style={[styles.modalButton, styles.sendButton]}
              icon="broadcast"
            >
              Send Broadcast
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );

  return (
    <View style={styles.container}>
                           <Header
          title="Admin Chat"
          username={libraryName}
          showWelcome={false}
          autoBackButton={true}
          onBackPress={() => {
            // Navigate back to Dashboard tab
            navigation.navigate('Dashboard');
          }}
        />
      
      <View style={styles.content}>
                 <Text style={styles.title}>Admin Chat</Text>
         <Text style={styles.subtitle}>
           Choose how you want to communicate with students
         </Text>

        <View style={styles.optionsContainer}>
          {/* Broadcast Message Option */}
          <Card
            style={styles.optionCard}
            onPress={() => {
              setChatMode('broadcast');
              setShowBroadcastModal(true);
            }}
          >
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons
                name="broadcast"
                size={48}
                color="#4F46E5"
                style={styles.cardIcon}
              />
              <Text style={styles.cardTitle}>Broadcast Message</Text>
              <Text style={styles.cardDescription}>
                Send a message to all registered students at once
              </Text>
            </Card.Content>
          </Card>

                     {/* Student Management Option */}
          <Card
            style={styles.optionCard}
            onPress={handleSelectStudent}
          >
            <Card.Content style={styles.cardContent}>
              <MaterialCommunityIcons
                name="account-group"
                size={48}
                color="#F59E0B"
                style={styles.cardIcon}
              />
              <Text style={styles.cardTitle}>Select from Student List</Text>
              <Text style={styles.cardDescription}>
                Choose a student from the student management list
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('StudentAttendance')}
              style={styles.actionButton}
              icon="account-clock"
            >
              View Attendance
            </Button>
            
            <Button
              mode="outlined"
              onPress={() => navigation.navigate('StudentManagement')}
              style={styles.actionButton}
              icon="account-multiple"
            >
              Manage Students
            </Button>
          </View>
        </View>
      </View>

      {renderBroadcastModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#6B7280',
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cardContent: {
    alignItems: 'center',
    padding: 24,
  },
  cardIcon: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1F2937',
  },
  cardDescription: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
  },
  quickActions: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  modal: {
    margin: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: '#6B7280',
  },
  messageInput: {
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#4F46E5',
  },
});

export default AdminChatSelector; 