// Test script for authentication flow
// This script can be run to test the authentication flow

const testAuthFlow = async () => {
  console.log('Testing Authentication Flow...');
  
  // Test 1: Check if auth token is stored
  const token = await AsyncStorage.getItem('auth_token');
  console.log('Auth token exists:', !!token);
  
  // Test 2: Check if user role is stored
  const userRole = await AsyncStorage.getItem('userRole');
  console.log('User role:', userRole);
  
  // Test 3: Check if student info is stored
  const studentId = await AsyncStorage.getItem('studentId');
  const studentName = await AsyncStorage.getItem('studentName');
  console.log('Student ID:', studentId);
  console.log('Student Name:', studentName);
  
  // Test 4: Check if first login flag is set
  const isFirstLogin = await AsyncStorage.getItem('isFirstLogin');
  console.log('Is first login:', isFirstLogin);
  
  // Test 5: Check all auth-related storage
  const allKeys = await AsyncStorage.getAllKeys();
  const authKeys = allKeys.filter(key => 
    key.includes('auth') || 
    key.includes('user') || 
    key.includes('student') || 
    key.includes('admin')
  );
  
  console.log('All auth-related keys:', authKeys);
  
  // Test 6: Clear all auth data (for testing)
  console.log('\nClearing all auth data for testing...');
  await AsyncStorage.multiRemove(authKeys);
  console.log('Auth data cleared');
};

export default testAuthFlow; 