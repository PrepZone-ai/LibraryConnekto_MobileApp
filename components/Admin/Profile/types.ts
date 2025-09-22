export interface LibraryProfile {
  id: string;
  user_id: string;
  library_name: string;
  mobile_no: string;
  address: string;
  total_seats: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  library_id: string;
  months: number;
  amount: number;
  discounted_amount: number | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionFormData {
  months: number;
  amount: string;
  discounted_amount: string;
}
