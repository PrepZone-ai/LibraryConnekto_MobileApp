// This is a simple in-memory counter. In a real application, this should be persisted in a database
let currentStudentId = 0;

export const getNextStudentId = (prefix: string = 'libr'): string => {
  currentStudentId++;
  return `${prefix}${String(currentStudentId).padStart(3, '0')}`;
};

export const getCurrentCount = (): number => {
  return currentStudentId;
};

export const setCurrentCount = (count: number): void => {
  currentStudentId = count;
};
