import React, { useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';

const AuthTest: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { isLoggedIn, studentId, studentName, selectedRole } = useAuth();

  const checkAuthState = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => 
        key.includes('auth') || 
        key.includes('user') || 
        key.includes('student') || 
        key.includes('admin')
      );
      
      let info = '=== AUTH DEBUG INFO ===\n';
      info += `isLoggedIn: ${isLoggedIn}\n`;
      info += `selectedRole: ${selectedRole}\n`;
      info += `studentId: ${studentId}\n`;
      info += `studentName: ${studentName}\n`;
      info += `\n=== ASYNC STORAGE ===\n`;
      
      for (const key of authKeys) {
        const value = await AsyncStorage.getItem(key);
        info += `${key}: ${value}\n`;
      }
      
      // Test API call
      info += `\n=== API TEST ===\n`;
      try {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          const response = await fetch('http://localhost:8000/api/v1/student/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const profile = await response.json();
            info += `Profile API: SUCCESS\n`;
            info += `Name: ${profile.name}\n`;
            info += `Email: ${profile.email}\n`;
          } else {
            info += `Profile API: ERROR ${response.status}\n`;
          }
        } else {
          info += `Profile API: NO TOKEN\n`;
        }
      } catch (error) {
        info += `Profile API: EXCEPTION ${error.message}\n`;
      }
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`Error: ${error}`);
    }
  };

  const clearAuthData = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const authKeys = allKeys.filter(key => 
        key.includes('auth') || 
        key.includes('user') || 
        key.includes('student') || 
        key.includes('admin')
      );
      await AsyncStorage.multiRemove(authKeys);
      setDebugInfo('Auth data cleared!');
    } catch (error) {
      setDebugInfo(`Error clearing: ${error}`);
    }
  };

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Test Panel</Text>
      <Button title="Check Auth State" onPress={checkAuthState} />
      <Button title="Clear Auth Data" onPress={clearAuthData} />
      <Text style={styles.debugText}>{debugInfo}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    margin: 10,
    borderRadius: 5,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 10,
    marginTop: 10,
    fontFamily: 'monospace',
  },
});

export default AuthTest; 