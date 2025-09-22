import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Surface, Text, TextInput } from 'react-native-paper';

interface ExamDetail {
  id: string;
  name: string;
  date: string;
}

const ExamDetails: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examDetails, setExamDetails] = useState<ExamDetail[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const formatDate = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const handleAddExam = () => {
    if (examName && examDate) {
      const newExam: ExamDetail = {
        id: Date.now().toString(),
        name: examName,
        date: examDate,
      };
      setExamDetails([...examDetails, newExam]);
      setExamName('');
      setExamDate('');
      setSelectedDay(null);
      setModalVisible(false);
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
          <Text style={styles.title}>Your Exam Details</Text>
          <Button
            mode="contained"
            onPress={() => setModalVisible(true)}
            style={styles.addButton}
            icon="plus"
          >
            Add Exam Details
          </Button>
        </View>

        {examDetails.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="file-document-outline"
              size={48}
              color="#6b7280"
            />
            <Text style={styles.emptyText}>No exam details added yet</Text>
            <Text style={styles.helperText}>
              Click the button above to add your exam details
            </Text>
          </View>
        ) : (
          <View style={styles.examList}>
            {examDetails.map((exam) => (
              <View key={exam.id} style={styles.examItem}>
                <View>
                  <Text style={styles.examName}>{exam.name}</Text>
                  <Text style={styles.examDate}>{exam.date}</Text>
                </View>
                <MaterialCommunityIcons
                  name="calendar"
                  size={24}
                  color="#6366f1"
                />
              </View>
            ))}
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
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    borderRadius: 20,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 16,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  examList: {
    gap: 12,
  },
  examItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  examName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 14,
    color: '#6b7280',
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
