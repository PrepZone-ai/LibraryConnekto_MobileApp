import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FAB, Portal, Modal, List, Searchbar, Text, TouchableOpacity } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../config/api';

interface Student {
  student_id: string;
  student_name: string;
  email: string;
}

interface ChatFABProps {
  visible?: boolean;
}

const ChatFAB: React.FC<ChatFABProps> = ({ visible = true }) => {
  const navigation = useNavigation();
  const [showOptions, setShowOptions] = useState(false);
  const [showStudentSelector, setShowStudentSelector] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await apiClient.get<Student[]>('/messaging/admin/students');
      setStudents(studentsData || []);
      setFilteredStudents(studentsData || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcastChat = () => {
    setShowOptions(false);
    navigation.navigate('AdminChatSelector');
  };



  const handleStudentSelect = (student: Student) => {
    setShowStudentSelector(false);
    setSearchQuery('');
    navigation.navigate('Chat', {
      studentId: student.student_id,
      studentName: student.student_name,
      fromAttendance: false
    });
  };

  const filterStudents = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.student_name.toLowerCase().includes(query.toLowerCase()) ||
        student.email.toLowerCase().includes(query.toLowerCase()) ||
        student.student_id.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  };

  if (!visible) return null;

  return (
    <>
      <FAB
        icon="chat"
        style={styles.fab}
        onPress={() => setShowOptions(true)}
        label="Chat"
      />

      {/* Chat Options Modal */}
      <Portal>
        <Modal
          visible={showOptions}
          onDismiss={() => setShowOptions(false)}
          contentContainerStyle={styles.optionsModal}
        >
                     <View style={styles.modalHeader}>
             <Text style={styles.modalTitle}>Admin Chat</Text>
             <TouchableOpacity onPress={() => setShowOptions(false)}>
               <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
             </TouchableOpacity>
           </View>

          <List.Item
            title="Broadcast Message"
            description="Send a message to all students"
            left={(props) => (
              <MaterialCommunityIcons
                {...props}
                name="broadcast"
                size={24}
                color="#4F46E5"
              />
            )}
            onPress={handleBroadcastChat}
            style={styles.optionItem}
          />

          
        </Modal>
      </Portal>

      {/* Student Selector Modal */}
      <Portal>
        <Modal
          visible={showStudentSelector}
          onDismiss={() => {
            setShowStudentSelector(false);
            setSearchQuery('');
          }}
          contentContainerStyle={styles.studentModal}
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
            onChangeText={filterStudents}
            value={searchQuery}
            style={styles.searchBar}
          />

          <List.Section style={styles.studentList}>
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
                  onPress={() => handleStudentSelect(student)}
                  style={styles.studentItem}
                />
              ))
            ) : (
              <View style={styles.noResults}>
                <Text style={styles.noResultsText}>
                  {loading ? 'Loading students...' : 'No students found'}
                </Text>
              </View>
            )}
          </List.Section>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4F46E5',
  },
  optionsModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 0,
  },
  studentModal: {
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
  optionItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    margin: 16,
    backgroundColor: '#F9FAFB',
  },
  studentList: {
    maxHeight: 400,
  },
  studentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default ChatFAB; 