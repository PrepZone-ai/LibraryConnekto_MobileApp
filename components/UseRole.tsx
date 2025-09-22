import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { Card, Surface, Text } from 'react-native-paper';
import { RootStackParamList } from '../types/navigation';

type UseRoleNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const UseRole: React.FC = () => {
  const navigation = useNavigation<UseRoleNavigationProp>();

  const handleRoleSelect = (role: 'admin' | 'student') => {
    if (role === 'admin') {
      navigation.navigate('AdminLogin');
    } else {
      navigation.navigate('StudentHome', {
        screen: 'StudentHomeTab'
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF'
    },
    content: {
      flex: 1,
      padding: 20
    },
    logoContainer: {
      alignItems: 'center',
      marginTop: 100,
      marginBottom: 60
    },
    logo: {
      width: 80,
      height: 80,
      backgroundColor: '#4285F4',
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center'
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#4285F4',
      marginTop: 16
    },
    subtitle: {
      fontSize: 16,
      color: '#666666',
      marginTop: 8
    },
    roleContainer: {
      marginTop: 40
    },
    roleCard: {
      marginVertical: 8,
      borderRadius: 12,
      elevation: 2
    },
    roleContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16
    },
    roleIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center'
    },
    roleInfo: {
      marginLeft: 16,
      flex: 1
    },
    roleName: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333333'
    },
    roleDescription: {
      fontSize: 14,
      color: '#666666',
      marginTop: 2
    },
    footer: {
      alignItems: 'center',
      marginTop: 'auto',
      marginBottom: 20,
      paddingBottom: 70
    },
    helpButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F0F0F0',
      padding: 12,
      borderRadius: 20
    },
    helpText: {
      marginLeft: 8,
      color: '#4285F4',
      fontSize: 14
    },
    version: {
      color: '#999999',
      marginTop: 8,
      fontSize: 12
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {/* Logo and Title */}
        <View style={styles.logoContainer}>
          <Surface style={styles.logo}>
            <MaterialIcons name="people" size={40} color="#FFFFFF" />
          </Surface>
          <Text style={styles.title}>Library Connekto</Text>
          <Text style={styles.subtitle}>Select your role to get started</Text>
        </View>

        {/* Role Selection Cards */}
        <View style={styles.roleContainer}>
          <Card
            style={styles.roleCard}
            onPress={() => handleRoleSelect('admin')}
          >
            <Card.Content style={styles.roleContent}>
              <Surface style={[styles.roleIcon, { backgroundColor: '#4285F4' }]}>
                <MaterialIcons name="admin-panel-settings" size={24} color="#FFFFFF" />
              </Surface>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>Admin</Text>
                <Text style={styles.roleDescription}>Manage library system</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999999" />
            </Card.Content>
          </Card>

          <Card
            style={styles.roleCard}
            onPress={() => handleRoleSelect('student')}
          >
            <Card.Content style={styles.roleContent}>
              <Surface style={[styles.roleIcon, { backgroundColor: '#FF7043' }]}>
                <MaterialIcons name="school" size={24} color="#FFFFFF" />
              </Surface>
              <View style={styles.roleInfo}>
                <Text style={styles.roleName}>Student</Text>
                <Text style={styles.roleDescription}>Tracking yourself Progress</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#999999" />
            </Card.Content>
          </Card>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Surface style={styles.helpButton}>
            <MaterialIcons name="help-outline" size={20} color="#4285F4" />
            <Text style={styles.helpText}>Need assistance?</Text>
          </Surface>
          <Text style={styles.version}>Version 2.0.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UseRole;