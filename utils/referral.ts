import { apiClient } from '../config/api';

// Get current year for the code
const getCurrentYear = () => new Date().getFullYear().toString().slice(-2);

// Clean name for code generation (take first 4 letters, remove spaces and special chars)
const cleanNameForCode = (name: string): string => {
  if (!name) return 'USER';
  return name
    .replace(/[^a-zA-Z]/g, '') // Remove non-letters
    .slice(0, 4) // Take first 4 letters
    .toUpperCase();
};

// Generate a unique 5-digit number by checking existing codes
const generateUniqueNumber = async (prefix: string, nameCode: string, year: string): Promise<string> => {
  try {
    // Get existing codes with same prefix pattern from FastAPI
    const codes = await apiClient.get<{ code: string }[]>('/referral/codes');

    const pattern = `${prefix}${nameCode}${year}`;
    const matchingCodes = codes.filter(item => item.code.startsWith(pattern));

    if (!matchingCodes || matchingCodes.length === 0) {
      return '00001';
    }

    // Find the highest number used
    let maxNumber = 0;
    for (const { code } of matchingCodes) {
      const numberPart = parseInt(code.slice(-5));
      if (!isNaN(numberPart) && numberPart > maxNumber) {
        maxNumber = numberPart;
      }
    }

    // Generate next number
    return (maxNumber + 1).toString().padStart(5, '0');
  } catch (error) {
    console.error('Error getting existing codes:', error);
    // Return a random number if we can't check existing codes
    return Math.floor(10000 + Math.random() * 90000).toString();
  }
};

// Generate random 4-digit number for students
const generateRandomNumber = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Generates a unique referral code based on type (admin or student)
 * The backend will handle the actual code generation logic
 */
export const generateReferralCode = async (
  type: 'admin' | 'student',
  name: string,
  libraryName?: string
): Promise<string> => {
  if (!name) {
    throw new Error("Name is required for generating referral code");
  }

  try {
    // Generate a temporary code that the backend will use as a base
    const year = getCurrentYear();
    let tempCode: string;

    if (type === 'admin') {
      const prefix = 'AD';
      const libCode = cleanNameForCode(libraryName || name);
      tempCode = `${prefix}${libCode}${year}`;
    } else {
      const prefix = 'ST';
      const nameCode = cleanNameForCode(name);
      tempCode = `${prefix}${nameCode}${year}`;
    }

    // Let the backend generate the final unique code
    const response = await apiClient.post<{ code: string }>('/referral/codes', {
      code: tempCode,
      type: type,
      name: name,
      library_name: libraryName
    });

    return response.code;
  } catch (error: any) {
    console.error('Error generating referral code:', error);
    throw new Error(error.message || 'Error generating referral code. Please try again.');
  }
}
