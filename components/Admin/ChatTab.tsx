import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Button, Surface, ActivityIndicator, FAB, Portal, Modal, List, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../common/Header';

interface StudentWithMessages {
  student_id: string;
  student_name: string;
  email: string;
  latest_message: string | null;
  latest_message_time: string | null;
  unread_count: number;
}

const ChatTab: React.FC = () => {
  const navigation = useNavigation();
  const { user, libraryName } = useAuth();
  const [students, setStudents] = useState<StudentWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<StudentWithMessages[]>([]);

  useEffect(() => {
    loadStudentsWithMessages();
  }, []);

  useEffect(() => {
    // Filter students based on search query
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const loadStudentsWithMessages = async () => {
    try {
      setLoading(true);
      const studentsData = await apiClient.get<StudentWithMessages[]>('/messaging/admin/students');
      setStudents(studentsData || []);
      setFilteredStudents(studentsData || []);
    } catch (error) {
      console.error('Error loading students with messages:', error);
      Alert.alert('Error', 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChat = (student: StudentWithMessages) => {
    setShowStudentSelector(false);
    setSearchQuery('');
    navigation.navigate('Chat', {
      studentId: student.student_id,
      studentName: student.student_name,
      fromAttendance: false
    });
  };

  const handleBroadcastMessage = () => {
    navigation.navigate('Chat', {
      fromAttendance: false
    });
  };

  const handleSingleStudentChat = () => {
    setShowStudentSelector(true);
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading students...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Chat"
        libraryName={libraryName || undefined}
        isAdminPage={true}
      />

      <ScrollView style={styles.content}>
        {/* Quick Action Cards */}
        <View style={styles.quickActionsContainer}>
          <Card style={styles.broadcastCard} onPress={handleBroadcastMessage}>
            <Card.Content style={styles.quickActionContent}>
              <MaterialCommunityIcons name="broadcast" size={32} color="white" />
              <View style={styles.quickActionText}>
                <Text style={styles.broadcastTitle}>Broadcast Message</Text>
                <Text style={styles.broadcastSubtitle}>Send to all students</Text>
              </View>
            </Card.Content>
          </Card>

          <Card style={styles.singleStudentCard} onPress={handleSingleStudentChat}>
            <Card.Content style={styles.quickActionContent}>
              <MaterialCommunityIcons name="account-message" size={32} color="white" />
              <View style={styles.quickActionText}>
                <Text style={styles.singleStudentTitle}>Single Student</Text>
                <Text style={styles.singleStudentSubtitle}>Chat with specific student</Text>
              </View>
            </Card.Content>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Recent Conversations</Text>

        {students.length > 0 ? (
          students.map((student) => (
            <Card
              key={student.student_id}
              style={styles.studentCard}
              onPress={() => handleStudentChat(student)}
            >
              <Card.Content>
                <View style={styles.studentHeader}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.student_name}</Text>
                    <Text style={styles.studentEmail}>{student.email}</Text>
                  </View>
                  {student.unread_count > 0 && (
                    <Surface style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>{student.unread_count}</Text>
                    </Surface>
                  )}
                </View>
                
                {student.latest_message && (
                  <View style={styles.messagePreview}>
                    <Text style={styles.messageText} numberOfLines={2}>
                      {student.latest_message}
                    </Text>
                    <Text style={styles.messageTime}>
                      {formatTime(student.latest_message_time)}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="chat-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>
              Start chatting with your students or send a broadcast message
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Student Selector Modal */}
      <Portal>
        <Modal
          visible={showStudentSelector}
          onDismiss={() => {
            setShowStudentSelector(false);
            setSearchQuery('');
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Student</Text>
            <TouchableOpacity
              onPress={() => {
                setShowStudentSelector(false);
                setSearchQuery('');
              }}
            >
              <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Searchbar
            placeholder="Search students..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          <ScrollView style={styles.studentList}>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <List.Item
                  key={student.student_id}
                  title={student.student_name}
                  description={student.email}
                  left={(props) => (
                    <MaterialCommunityIcons
                      {...props}
                      name="account"
                      size={24}
                      color="#6B7280"
                    />
                  )}
                  right={(props) => (
                    student.unread_count > 0 ? (
                      <Surface style={styles.modalUnreadBadge}>
                        <Text style={styles.modalUnreadCount}>{student.unread_count}</Text>
                      </Surface>
                    ) : null
                  )}
                  onPress={() => handleStudentChat(student)}
                  style={styles.studentListItem}
                />
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>No students found</Text>
              </View>
            )}
          </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  quickActionsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  broadcastCard: {
    backgroundColor: '#4F46E5',
    elevation: 4,
  },
  singleStudentCard: {
    backgroundColor: '#059669',
    elevation: 4,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  quickActionText: {
    marginLeft: 16,
    flex: 1,
  },
  broadcastTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  broadcastSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  singleStudentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  singleStudentSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  studentCard: {
    marginBottom: 12,
    backgroundColor: 'white',
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagePreview: {
    marginTop: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchBar: {
    margin: 16,
    backgroundColor: '#F9FAFB',
  },
  studentList: {
    maxHeight: 400,
  },
  studentListItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalUnreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  modalUnreadCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default ChatTab; 