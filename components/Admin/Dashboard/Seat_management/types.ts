import { StudentProfile } from '../../../../config/api';

export interface SeatData {
  seatNumber: number;
  isOccupied: boolean;
  student?: StudentProfile;
}

export interface StudentDetailsModalProps {
  student: StudentProfile | null;
  visible: boolean;
  onClose: () => void;
  onRemoveStudent?: (studentId: string) => void;
  onUpdateStudent?: () => void;
}

export interface SeatGridProps {
  seats: SeatData[];
  onSeatPress: (seat: SeatData) => void;
}
