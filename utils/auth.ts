import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Generates a random password that meets the following criteria:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
export const generateRandomPassword = (): string => {
  const length = 12;
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*';
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;

  // Ensure at least one of each type
  let password = 
    uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)] +
    lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)] +
    numberChars[Math.floor(Math.random() * numberChars.length)] +
    specialChars[Math.floor(Math.random() * specialChars.length)];

  // Fill the rest with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Validates if a password meets the minimum requirements:
 * - At least 8 characters long
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 * - Contains at least one special character
 */
export const validatePassword = (password: string): boolean => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial
  );
};

/**
 * Generates a reset token for password reset functionality
 */
export const generateResetToken = (): string => {
  const tokenLength = 6;
  const chars = '0123456789';
  let token = '';
  
  for (let i = 0; i < tokenLength; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return token;
};

/**
 * Validate JWT token format and expiration
 * @param token The JWT token to validate
 * @returns Object with validation results
 */
export const validateJWTToken = (token: string) => {
  try {
    // Check if token exists
    if (!token) {
      return { valid: false, error: 'Token is empty' };
    }

    // Check if token has the correct format (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    // Try to decode the payload (second part)
    try {
      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token has required fields
      if (!payload.sub || !payload.user_type) {
        return { valid: false, error: 'Token missing required fields' };
      }

      // Check expiration
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: 'Token has expired' };
      }

      return { 
        valid: true, 
        payload,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        userType: payload.user_type,
        userId: payload.sub
      };
    } catch (decodeError) {
      return { valid: false, error: 'Failed to decode token payload' };
    }
  } catch (error) {
    return { valid: false, error: 'Token validation failed' };
  }
};

/**
 * Debug authentication state
 */
export const debugAuthState = async () => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    const studentId = await AsyncStorage.getItem('studentId');
    const studentName = await AsyncStorage.getItem('studentName');
    const userRole = await AsyncStorage.getItem('userRole');
    const userEmail = await AsyncStorage.getItem('userEmail');
    const userId = await AsyncStorage.getItem('userId');

    console.log('=== AUTH DEBUG INFO ===');
    console.log('Token exists:', !!token);
    if (token) {
      console.log('Token length:', token.length);
      console.log('Token preview:', token.substring(0, 50) + '...');
      
      const validation = validateJWTToken(token);
      console.log('Token validation:', validation);
    }
    console.log('Student ID:', studentId);
    console.log('Student Name:', studentName);
    console.log('User Role:', userRole);
    console.log('User Email:', userEmail);
    console.log('User ID:', userId);
    console.log('========================');

    return {
      token: !!token,
      tokenValidation: token ? validateJWTToken(token) : null,
      studentId,
      studentName,
      userRole,
      userEmail,
      userId
    };
  } catch (error) {
    console.error('Error debugging auth state:', error);
    return { error: error.message };
  }
};
