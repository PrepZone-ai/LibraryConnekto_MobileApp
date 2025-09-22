import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { Surface, Text, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ConfirmationModalProps {
  visible: boolean;
  requestId: string;
  onClose: () => void;
  onGoHome: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  requestId,
  onClose,
  onGoHome,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Surface style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="check-circle" size={64} color="#4CAF50" />
          </View>
          
          <Text style={styles.title}>Request Submitted!</Text>
          <Text style={styles.message}>
            Your seat booking request has been sent to the library admin.
            You will be notified once it's approved.
          </Text>
          
          <View style={styles.requestInfo}>
            <Text style={styles.requestLabel}>Request ID:</Text>
            <Text style={styles.requestId}>{requestId}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={onClose}
              style={styles.button}
            >
              Close
            </Button>
            <Button
              mode="contained"
              onPress={onGoHome}
              style={styles.button}
            >
              Go to Home
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  requestInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  requestLabel: {
    fontSize: 14,
    color: '#666',
  },
  requestId: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default ConfirmationModal;
