export interface AuthFormData {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin';
  created_at: string;
}
