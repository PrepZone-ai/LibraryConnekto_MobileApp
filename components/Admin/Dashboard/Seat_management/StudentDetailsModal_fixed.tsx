import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Button, Chip, Modal, Portal, Surface, Text, Menu, Divider, List } from 'react-native-paper';
import { StudentDetailsModalProps } from './types';
import { apiClient } from '../../../../config/api';

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
};

const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  student,
  visible,
  onClose,
  onRemoveStudent,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [extending, setExtending] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(1);
  
  if (!student) return null;
  
  const handleExtendSubscription = async () => {
    try {
      setExtending(true);
      
      // Calculate new end date
      const currentEndDate = new Date(student.subscription_end);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + selectedMonths);
      
      // Update the subscription end date using FastAPI
      await apiClient.put(`/admin/students/${student.id}/extend-subscription`, {
        months: selectedMonths
      });
      
      Alert.alert(
        'Success', 
        `Subscription extended by ${selectedMonths} month${selectedMonths > 1 ? 's' : ''}. New end date: ${formatDate(newEndDate.toISOString())}`
      );
      
      // Close the menu
      setMenuVisible(false);
      
      // Close the modal to refresh data
      onClose();
      
    } catch (err: any) {
      console.error('Error extending subscription:', err);
      Alert.alert('Error', `Failed to extend subscription: ${err.message}`);
    } finally {
      setExtending(false);
    }
  };
  
  const monthOptions = [1, 2, 3, 6, 12];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.surface}>
          <Text style={styles.title}>Student Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Student ID:</Text>
            <Text style={styles.value}>{student.student_id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{student.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{student.email}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Mobile:</Text>
            <Text style={styles.value}>{student.mobile_no}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{student.address}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Subscription:</Text>
            <View style={styles.subscriptionContainer}>
              <Chip
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      student.subscription_status === 'Active'
                        ? '#E8F5E9'
                        : '#FFEBEE',
                  },
                ]}
                textStyle={{
                  color:
                    student.subscription_status === 'Active'
                      ? '#4CAF50'
                      : '#F44336',
                }}
              >
                {student.subscription_status}
              </Chip>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Start Date:</Text>
            <Text style={styles.value}>{formatDate(student.subscription_start)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>End Date:</Text>
            <Text style={styles.value}>{formatDate(student.subscription_end)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{student.status}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Last Visit:</Text>
            <Text style={styles.value}>{formatDate(student.last_visit)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Member Since:</Text>
            <Text style={styles.value}>{formatDate(student.created_at)}</Text>
          </View>

          <View style={styles.buttonContainer}>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  mode="contained"
                  onPress={() => setMenuVisible(true)}
                  style={[styles.button, { backgroundColor: '#2196F3' }]}
                >
                  Extend Subscription
                </Button>
              }
            >
              <Menu.Item 
                title="Select months to extend:"
                disabled={true}
              />
              <Divider />
              {monthOptions.map((months) => (
                <Menu.Item
                  key={months}
                  title={`${months} month${months > 1 ? 's' : ''}`}
                  onPress={() => {
                    setSelectedMonths(months);
                    setMenuVisible(false);
                    Alert.alert(
                      'Confirm Extension',
                      `Extend subscription by ${months} month${months > 1 ? 's' : ''}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Extend', onPress: handleExtendSubscription }
                      ]
                    );
                  }}
                />
              ))}
            </Menu>
            
            {onRemoveStudent && (
              <Button
                mode="contained"
                onPress={() => {
                  Alert.alert(
                    'Remove Student',
                    `Are you sure you want to remove ${student.name}?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Remove', 
                        onPress: () => onRemoveStudent(student.id),
                        style: 'destructive'
                      }
                    ]
                  );
                }}
                style={[styles.button, { backgroundColor: '#F44336' }]}
              >
                Remove Student
              </Button>
            )}
            
            <Button
              mode="outlined"
              onPress={onClose}
              style={styles.button}
            >
              Close
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    padding: 20,
  },
  surface: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: 'white',
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a1a1a',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  value: {
    flex: 2,
    fontSize: 16,
    color: '#1a1a1a',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 8,
    flexWrap: 'wrap',
  },
  button: {
    flex: 1,
    marginBottom: 8,
  },
  statusChip: {
    borderRadius: 16,
  },
  subscriptionContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

export default StudentDetailsModal;
