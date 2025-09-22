import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, IconButton, Portal, Surface, Text, TextInput } from 'react-native-paper';
import { apiClient } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

interface ExamDetail {
  id: string;
  exam_name: string;
  exam_date: string;
  notes: string | null;
  is_completed: boolean;
}

const ExamDetails: React.FC = () => {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examNotes, setExamNotes] = useState('');
  const [examDetails, setExamDetails] = useState<ExamDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchExams();
    }
  }, [user]);

  const fetchExams = async () => {
    try {
      setLoading(true);

      // Fetch current exams using FastAPI
      const data = await apiClient.get('/students/exams');
      setExamDetails(data || []);
    } catch (error) {
      console.error('Error in fetchExams:', error);
      Alert.alert('Error', 'Failed to load exam details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilExam = (examDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDay = new Date(examDate);
    examDay.setHours(0, 0, 0, 0);

    const diffTime = examDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const handleDateSelect = (day: number) => {
    setSelectedDay(day);
    setExamDate(formatDate(selectedYear, selectedMonth, day));
    setShowDatePicker(false);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setSelectedDay(null);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setSelectedDay(null);
  };

  const handleAddExam = async () => {
    if (!examName.trim() || !examDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const examData = {
        exam_name: examName.trim(),
        exam_date: examDate,
        notes: examNotes.trim() || null
      };

      await apiClient.post('/students/exams', examData);

      setModalVisible(false);
      setExamName('');
      setExamDate('');
      setExamNotes('');
      fetchExams();
    } catch (error) {
      console.error('Error adding exam:', error);
      Alert.alert('Error', 'Failed to add exam');
    }
  };

  const handleDeleteExam = async (examId: string) => {
    try {
      await apiClient.delete(`/students/exams/${examId}`);
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
      Alert.alert('Error', 'Failed to delete exam');
    }
  };

  const generateDatePicker = () => {
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);
    const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i).toLocaleString('en-US', { month: 'long' }));
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <View>
        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {years.map(year => (
                <Button
                  key={year}
                  mode={selectedYear === year ? "contained" : "outlined"}
                  onPress={() => handleYearChange(year)}
                  style={[styles.pickerButton, selectedYear === year && styles.selectedButton]}
                  labelStyle={selectedYear === year ? styles.selectedButtonText : undefined}
                >
                  {year.toString()}
                </Button>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.pickerRow}>
              {months.map((month, index) => (
                <Button
                  key={month}
                  mode={selectedMonth === index ? "contained" : "outlined"}
                  onPress={() => handleMonthChange(index)}
                  style={[styles.pickerButton, selectedMonth === index && styles.selectedButton]}
                  labelStyle={selectedMonth === index ? styles.selectedButtonText : undefined}
                >
                  {month}
                </Button>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.pickerSection}>
          <Text style={styles.pickerLabel}>Day</Text>
          <View style={styles.daysGrid}>
            {days.map(day => (
              <Button
                key={day}
                mode={selectedDay === day ? "contained" : "outlined"}
                onPress={() => handleDateSelect(day)}
                style={[styles.dayButton, selectedDay === day && styles.selectedButton]}
                labelStyle={selectedDay === day ? styles.selectedButtonText : undefined}
              >
                {day.toString()}
              </Button>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Surface style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Upcoming Exams</Text>
          <Button
            mode="contained"
            onPress={() => setModalVisible(true)}
            style={styles.addButton}
            icon="plus"
          >
            Add Exam
          </Button>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <MaterialCommunityIcons name="clock-outline" size={36} color="#6b7280" />
            <Text style={styles.loadingText}>Loading exam details...</Text>
          </View>
        ) : examDetails.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={48}
              color="#6b7280"
            />
            <Text style={styles.emptyText}>No upcoming exams</Text>
            <Text style={styles.helperText}>
              Click the button above to add your exam details
            </Text>
          </View>
        ) : (
          <View style={styles.examList}>
            {examDetails.map((exam) => {
              const daysUntil = getDaysUntilExam(exam.exam_date);
              let chipColor = '#10b981'; // Green for exams more than 7 days away

              if (daysUntil <= 3) {
                chipColor = '#ef4444'; // Red for exams within 3 days
              } else if (daysUntil <= 7) {
                chipColor = '#f59e0b'; // Amber for exams within 7 days
              }

              return (
                <Surface key={exam.id} style={styles.examItem}>
                  <View style={styles.examHeader}>
                    <Text style={styles.examName}>{exam.exam_name}</Text>
                    <IconButton
                      icon="delete-outline"
                      size={20}
                      onPress={() => handleDeleteExam(exam.id)}
                      style={styles.deleteButton}
                    />
                  </View>

                  <Text style={styles.examDate}>
                    {formatDateForDisplay(exam.exam_date)}
                  </Text>

                  {exam.notes && (
                    <Text style={styles.examNotes}>{exam.notes}</Text>
                  )}

                  <View style={styles.examFooter}>
                    <Chip
                      style={[styles.daysChip, { backgroundColor: `${chipColor}20` }]}
                      textStyle={{ color: chipColor, fontWeight: '600' }}
                    >
                      {daysUntil === 0 ? 'Today' :
                       daysUntil === 1 ? 'Tomorrow' :
                       `${daysUntil} days left`}
                    </Chip>
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={24}
                      color="#6366f1"
                    />
                  </View>
                </Surface>
              );
            })}
          </View>
        )}
      </Surface>

      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Add Exam Details</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Exam Name"
              value={examName}
              onChangeText={setExamName}
              mode="outlined"
              style={styles.input}
            />

            <Button
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
              icon="calendar"
            >
              {examDate || "Select Exam Date"}
            </Button>

            <TextInput
              label="Notes (Optional)"
              value={examNotes}
              onChangeText={setExamNotes}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Add any important details about this exam"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button onPress={handleAddExam} disabled={!examName || !examDate}>
              Add Exam
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showDatePicker} onDismiss={() => setShowDatePicker(false)}>
          <Dialog.Title>Select Date</Dialog.Title>
          <Dialog.ScrollArea style={styles.datePickerScrollArea}>
            <ScrollView>
              {generateDatePicker()}
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setShowDatePicker(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#6366f1',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 12,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  examList: {
    gap: 12,
  },
  examItem: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    elevation: 1,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  deleteButton: {
    margin: -8,
  },
  examDate: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 4,
  },
  examNotes: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
  examFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  daysChip: {
    height: 28,
  },
  input: {
    marginBottom: 16,
  },
  dateButton: {
    marginBottom: 16,
  },
  datePickerScrollArea: {
    maxHeight: 400,
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 8,
  },
  pickerButton: {
    marginRight: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 8,
  },
  dayButton: {
    width: '13%',
    marginBottom: 8,
  },
  selectedButton: {
    backgroundColor: '#6366f1',
  },
  selectedButtonText: {
    color: 'white',
  },
});

export default ExamDetails;
