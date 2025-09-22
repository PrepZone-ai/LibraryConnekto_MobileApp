export interface FormData {
  name: string;
  mobile: string;
  email: string;
  address: string;
  subscription: string;
  selectedLibrary: string;
  selectedLibraryData: Library | null;
}

export interface Library {
  id: string;
  user_id: string;
  library_name: string;
  address: string;
  total_seats: number;
  occupied_seats: number;
  latitude: number;
  longitude: number;
  distance?: number;
}

export interface SubscriptionOption {
  value: string;
  label: string;
  price: number;
  originalPrice: number;
  months: number;
}

export interface ErrorState {
  library?: string;
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  subscription?: string;
}
