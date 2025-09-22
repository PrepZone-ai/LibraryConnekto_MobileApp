import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const AuthDebug: React.FC = () => {
  const auth = useAuth();

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Auth Debug Info:</Text>
      <Text style={styles.text}>isLoggedIn: {auth.isLoggedIn ? 'true' : 'false'}</Text>
      <Text style={styles.text}>selectedRole: {auth.selectedRole || 'null'}</Text>
      <Text style={styles.text}>studentId: {auth.studentId || 'null'}</Text>
      <Text style={styles.text}>studentName: {auth.studentName || 'null'}</Text>
      <Text style={styles.text}>loading: {auth.loading ? 'true' : 'false'}</Text>
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
    marginBottom: 5,
  },
  text: {
    fontSize: 12,
    marginBottom: 2,
  },
});

export default AuthDebug; 