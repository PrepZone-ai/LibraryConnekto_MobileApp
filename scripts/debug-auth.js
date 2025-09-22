// Debug script for authentication flow
import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugAuthFlow = async () => {
  console.log('=== AUTHENTICATION FLOW DEBUG ===');
  
  // Check current auth state
  const authToken = await AsyncStorage.getItem('auth_token');
  const userRole = await AsyncStorage.getItem('userRole');
  const studentId = await AsyncStorage.getItem('studentId');
  const studentName = await AsyncStorage.getItem('studentName');
  const userId = await AsyncStorage.getItem('userId');
  const isFirstLogin = await AsyncStorage.getItem('isFirstLogin');
  
  console.log('Current Auth State:');
  console.log('- Auth Token:', authToken ? 'Present' : 'Missing');
  console.log('- User Role:', userRole);
  console.log('- Student ID:', studentId);
  console.log('- Student Name:', studentName);
  console.log('- User ID:', userId);
  console.log('- Is First Login:', isFirstLogin);
  
  // Check all auth-related keys
  const allKeys = await AsyncStorage.getAllKeys();
  const authKeys = allKeys.filter(key => 
    key.includes('auth') || 
    key.includes('user') || 
    key.includes('student') || 
    key.includes('admin')
  );
  
  console.log('\nAll Auth Keys:', authKeys);
  
  // Test API calls
  try {
    const response = await fetch('http://localhost:8000/api/v1/student/profile', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const profile = await response.json();
      console.log('\nProfile API Response:', profile);
    } else {
      console.log('\nProfile API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('\nProfile API Exception:', error.message);
  }
};

export const clearAllAuthData = async () => {
  console.log('Clearing all auth data...');
  
  const allKeys = await AsyncStorage.getAllKeys();
  const authKeys = allKeys.filter(key => 
    key.includes('auth') || 
    key.includes('user') || 
    key.includes('student') || 
    key.includes('admin')
  );
  
  await AsyncStorage.multiRemove(authKeys);
  console.log('Auth data cleared successfully');
};

export const simulateFirstLogin = async () => {
  console.log('Simulating first login...');
  
  // Set up first login state
  await AsyncStorage.multiSet([
    ['auth_token', 'test-token'],
    ['userRole', 'student'],
    ['studentId', 'LIBR25001'],
    ['userId', 'test-user-id'],
    ['isFirstLogin', 'true']
  ]);
  
  console.log('First login state set up');
}; 