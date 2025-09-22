import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, Text, Surface, Portal, Dialog, HelperText, Card, List, useTheme, IconButton } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { addStudent } from '../../../services/studentService';
import Header from '../../common/Header';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AdminStackParamList } from '../../../types/navigation';
import { API_BASE_URL, getAuthToken, apiClient } from '../../../config/api';

interface UploadResult {
  success: boolean;
  message: string;
  studentName: string;
  error?: string;
}

const BulkStudentUpload: React.FC<NativeStackScreenProps<AdminStackParamList, 'BulkStudentUpload'>> = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const downloadTemplate = async () => {
    try {
      setError(null);
      console.log('Downloading CSV template from backend...');
      
      // Get auth token
      const token = await getAuthToken();
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }
      
      // Download template from backend
      const response = await fetch(`${API_BASE_URL}/admin/students/template`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download template: ${response.status} ${response.statusText}`);
      }
      
      const csvContent = await response.text();
      console.log('Template downloaded from backend');
      
      // Check if we're on web platform
      if (Platform.OS === 'web') {
        // Web-specific download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'student_template.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log('CSV template downloaded for web');
        return;
      }
      
      // Mobile-specific download
      const templatePath = `${FileSystem.documentDirectory}student_template.csv`;
      await FileSystem.writeAsStringAsync(templatePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      console.log('Template saved, checking sharing...');
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(templatePath);
        console.log('Template shared successfully');
      } else {
        setError('Sharing is not available on this device. Template saved to device.');
      }
    } catch (error: any) {
      console.error('Error downloading template:', error);
      setError(`Failed to download template: ${error.message}`);
    }
  };

  const validateStudent = (student: any): string | null => {
    if (!student.name) return 'Name is required';
    if (!student.email) return 'Email is required';
    if (!student.mobile_no) return 'Mobile number is required';
    if (!student.address) return 'Address is required';
    if (!student.subscription_end) return 'Subscription end date is required';
    if (student.is_shift_student === undefined || student.is_shift_student === null) return 'Is Shift Student is required (true/false)';
    return null;
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults([]);

      console.log('Starting file picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv', // .csv
        ],
      });

      if (result.canceled) {
        console.log('File picker canceled');
        setLoading(false);
        return;
      }

      console.log('File selected:', result.assets[0]);
      console.log('File URI:', result.assets[0].uri);
      console.log('File type:', result.assets[0].mimeType);
      console.log('File name:', result.assets[0].name);
      
      let students: any[] = [];
      
      // For web platform, we need to handle the file differently
      if (Platform.OS === 'web' && result.assets[0].file) {
        console.log('Processing web file directly...');
        students = await processWebFile(result.assets[0].file);
        console.log(`Processing ${students.length} students...`);
      } else {
        console.log('Processing file via URI...');
        students = await processFile(result.assets[0].uri);
        console.log(`Processing ${students.length} students...`);
      }

      const uploadResults: UploadResult[] = [];

      for (let i = 0; i < students.length; i++) {
        const studentData = students[i];
        console.log(`Processing student ${i + 1}/${students.length}: ${studentData.name}`);
        
        try {
          const validationError = validateStudent(studentData);
          if (validationError) {
            throw new Error(validationError);
          }

          // Ensure required dates are set
          if (!studentData.subscription_start) {
            studentData.subscription_start = new Date().toISOString().split('T')[0];
          }
          if (!studentData.subscription_end) {
            throw new Error(`Subscription end date is required for ${studentData.name}`);
          }
          
          console.log(`Adding student: ${studentData.name}`);
          const response = await addStudent({
            ...studentData,
            subscription_start: studentData.subscription_start,
            subscription_end: studentData.subscription_end,
            // These fields are not in the CSV but required by StudentDetails type
            // They will be generated/set by the backend, so we pass dummy values.
            auth_user_id: '', 
            status: 'Absent',
            last_visit: null
          });

          console.log(`Student ${studentData.name} added successfully`);
          uploadResults.push({
            success: true,
            message: `Successfully registered ${studentData.name}`,
            studentName: studentData.name,
          });

        } catch (error: any) {
          console.error(`Failed to add student ${studentData.name}:`, error);
          uploadResults.push({
            success: false,
            message: `Failed to register ${studentData.name}`,
            studentName: studentData.name,
            error: error.message,
          });
        }
      }

      console.log('Upload completed, showing results');
      setResults(uploadResults);
      setShowResults(true);

      // Show summary
      const successCount = uploadResults.filter(r => r.success).length;
      const totalCount = uploadResults.length;
      console.log(`Upload summary: ${successCount}/${totalCount} students added successfully`);

    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const processFile = async (fileUri: string) => {
    console.log('Processing CSV file with URI:', fileUri);
    console.log('Platform:', Platform.OS);
    
    let content: string;
    
    try {
      if (Platform.OS === 'web') {
        // Web-specific file reading - handle both URLs and File objects
        if (fileUri.startsWith('http') || fileUri.startsWith('blob:')) {
          console.log('Using fetch for URL/blob');
          // Handle URLs and blob URLs
          const response = await fetch(fileUri);
          content = await response.text();
        } else {
          console.log('Using FileSystem for local file path');
          // Handle local file paths - use FileSystem for both web and mobile
          content = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        }
      } else {
        console.log('Using FileSystem for mobile');
        // Mobile-specific file reading
        content = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }
      
      console.log('File content length:', content?.length || 0);
      
      if (!content) {
        throw new Error('Failed to read file content');
      }

      // Parse CSV content
      const lines = content.split('\n').filter(line => line.trim() !== '');
      console.log('CSV lines count:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim());
      console.log('CSV headers:', headers);
      
      // Parse data rows
      const students = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        
        return row;
      });
      
      console.log('Parsed students count:', students.length);
      console.log('First student data:', students[0]);

      return students.map((row: any, index: number) => {
        // Parse and validate dates
        const parseDate = (dateStr: string) => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            throw new Error(`Row ${index + 2}: Invalid date format. Use YYYY-MM-DD format.`);
          }
          return date.toISOString().split('T')[0];
        };

        const subscription_start = parseDate(row['Subscription Start (YYYY-MM-DD)*']);
        const subscription_end = parseDate(row['Subscription End (YYYY-MM-DD)*']);

        // Validate subscription dates
        if (subscription_start && subscription_end) {
          const startDate = new Date(subscription_start);
          const endDate = new Date(subscription_end);
          if (endDate <= startDate) {
            throw new Error(`Row ${index + 2}: Subscription end date must be after start date.`);
          }
        }

        return {
          name: row['Name*']?.trim(),
          email: row['Email*']?.trim().toLowerCase(),
          mobile_no: row['Mobile Number*']?.toString().trim(),
          address: row['Address*']?.trim(),
          subscription_start: subscription_start,
          subscription_end: subscription_end,
          is_shift_student: row['Is Shift Student (true/false)*']?.toString().toLowerCase() === 'true',
          shift_time: row['Shift Time (HH:mm - HH:mm)']?.trim() || null,
        };
      });
    } catch (error: any) {
      console.error('Error in processFile:', error);
      throw new Error(`Failed to process CSV file: ${error.message}`);
    }
  };

  const processWebFile = async (file: File) => {
    console.log('Processing web CSV file:', file.name, file.size, file.type);
    
    try {
      // Read file as text
      const content = await file.text();
      
      console.log('File content length:', content?.length || 0);
      
      if (!content) {
        throw new Error('Failed to read file content');
      }

      // Parse CSV content
      const lines = content.split('\n').filter(line => line.trim() !== '');
      console.log('CSV lines count:', lines.length);
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim());
      console.log('CSV headers:', headers);
      
      // Parse data rows
      const students = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        
        return row;
      });
      
      console.log('Parsed students count:', students.length);
      console.log('First student data:', students[0]);

      return students.map((row: any, index: number) => {
        // Parse and validate dates
        const parseDate = (dateStr: string) => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            throw new Error(`Row ${index + 2}: Invalid date format. Use YYYY-MM-DD format.`);
          }
          return date.toISOString().split('T')[0];
        };

        const subscription_start = parseDate(row['Subscription Start (YYYY-MM-DD)*']);
        const subscription_end = parseDate(row['Subscription End (YYYY-MM-DD)*']);

        // Validate subscription dates
        if (subscription_start && subscription_end) {
          const startDate = new Date(subscription_start);
          const endDate = new Date(subscription_end);
          if (endDate <= startDate) {
            throw new Error(`Row ${index + 2}: Subscription end date must be after start date.`);
          }
        }

        return {
          name: row['Name*']?.trim(),
          email: row['Email*']?.trim().toLowerCase(),
          mobile_no: row['Mobile Number*']?.toString().trim(),
          address: row['Address*']?.trim(),
          subscription_start: subscription_start,
          subscription_end: subscription_end,
          is_shift_student: row['Is Shift Student (true/false)*']?.toString().toLowerCase() === 'true',
          shift_time: row['Shift Time (HH:mm - HH:mm)']?.trim() || null,
        };
      });
    } catch (error: any) {
      console.error('Error in processWebFile:', error);
      throw new Error(`Failed to process web CSV file: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Bulk Student Upload"
        username="Admin"
        showWelcome={false}
        autoBackButton={true}
      />
      <ScrollView style={styles.content}>
        <Surface style={styles.uploadSection}>
          <Text variant="titleLarge" style={styles.title}>Upload Students</Text>
          
          <Text style={styles.description}>
            Upload multiple students using a CSV file. Download the template below to ensure correct formatting.
            {'\n\n'}Note: Students will receive an email to set their password. If email fails, admin can set password manually.
          </Text>

          <Button
            mode="outlined"
            onPress={downloadTemplate}
            style={styles.button}
            icon="download"
          >
            Download Template
          </Button>

          <Button
            mode="contained"
            onPress={handleUpload}
            loading={loading}
            disabled={loading}
            style={styles.button}
            icon="upload"
          >
            Upload CSV File
          </Button>

          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}
        </Surface>

        {showResults && (
          <Surface style={styles.resultsSection}>
            <Text variant="titleLarge" style={styles.title}>Upload Results</Text>
            
            <List.Section>
              {results.map((result, index) => (
                <Card
                  key={index}
                  style={[
                    styles.resultCard,
                    { borderColor: result.success ? theme.colors.primary : theme.colors.error }
                  ]}
                >
                  <Card.Content>
                    <View style={styles.resultHeader}>
                      <IconButton
                        icon={result.success ? 'check-circle' : 'alert-circle'}
                        iconColor={result.success ? theme.colors.primary : theme.colors.error}
                        size={24}
                      />
                      <Text variant="titleMedium">{result.message}</Text>
                    </View>
                    
                    {result.success && (
                      <Text style={styles.loginInfo}>
                        Login Credentials:
                        {'\n'}• Student Name: {result.studentName}
                        {'\n'}• Student ID: Generated by system
                        {'\n'}• Password: Set via email link
                        {'\n\n'}Note: Student will receive an email to set their password.
                        {'\n'}If email fails, admin can set password manually.
                      </Text>
                    )}
                    
                    {result.error && (
                      <Text style={{ color: theme.colors.error }}>
                        Error: {result.error}
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </List.Section>
          </Surface>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadSection: {
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  resultsSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  title: {
    marginBottom: 16,
  },
  description: {
    marginBottom: 16,
    color: '#666',
  },
  button: {
    marginVertical: 8,
  },
  resultCard: {
    marginVertical: 8,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  loginInfo: {
    marginTop: 8,
    fontFamily: 'monospace',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  }
});

export default BulkStudentUpload;
