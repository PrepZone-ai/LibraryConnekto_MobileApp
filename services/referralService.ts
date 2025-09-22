import { apiClient } from '../config/api';

/**
 * Generates a new referral code for either admin or student
 */
export const generateReferralCode = async (
  type: 'admin' | 'student',
  name: string,
  libraryName?: string
): Promise<{ code: string; id: string }> => {
  try {
    const response = await apiClient.post<any>('/referral/codes', {
      type: type
    });

    return {
      code: response.code,
      id: response.id
    };
  } catch (error: any) {
    console.error('Error generating referral code:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Error generating referral code');
  }
};

/**
 * Gets existing referral codes for the current user
 */
export const getReferralCodes = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get<any[]>('/referral/codes');
    return response;
  } catch (error: any) {
    console.error('Error fetching referral codes:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Error fetching referral codes');
  }
};

/**
 * Validates a referral code
 */
export const validateReferralCode = async (code: string): Promise<{ 
  success: boolean; 
  message: string;
  referral_code?: any;
  referrer_name?: string;
  referrer_type?: string;
}> => {
  try {
    const response = await apiClient.post<any>('/referral/validate', { code });
    return {
      success: response.success,
      message: response.message,
      referral_code: response.referral_code,
      referrer_name: response.referrer_name,
      referrer_type: response.referrer_type
    };
  } catch (error: any) {
    console.error('Error validating referral code:', error);
    return { 
      success: false, 
      message: error.response?.data?.detail || error.message || 'Error validating referral code' 
    };
  }
};

/**
 * Creates a new referral record
 */
export const createReferral = async (
  referralCodeId: string,
  referredName: string,
  referredEmail?: string
): Promise<any> => {
  try {
    const response = await apiClient.post<any>('/referral/referrals', {
      referral_code_id: referralCodeId,
      referred_name: referredName,
      referred_email: referredEmail
    });
    return response;
  } catch (error: any) {
    console.error('Error creating referral:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Error creating referral');
  }
};

/**
 * Gets referral history for the current user
 */
export const getReferrals = async (): Promise<any[]> => {
  try {
    const response = await apiClient.get<any[]>('/referral/referrals');
    return response;
  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Error fetching referrals');
  }
};

// Development endpoints for testing without authentication
export const getTestReferralData = async (): Promise<any> => {
  try {
    const response = await apiClient.get<any>('/referral/test');
    return response;
  } catch (error: any) {
    console.error('Error fetching test data:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Error fetching test data');
  }
};

export const getTestAuthData = async (): Promise<any> => {
  try {
    const response = await apiClient.get<any>('/referral/test-auth');
    return response;
  } catch (error: any) {
    console.error('Error fetching test auth data:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Error fetching test auth data');
  }
};