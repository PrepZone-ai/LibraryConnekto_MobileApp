export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: number
          student_id: string
          admin_id: string
          name: string
          email: string
          mobile_no: string
          address: string
          subscription_time: number
          subscription_status: 'Active' | 'Expired'
          is_shift_student: boolean
          shift_time: string | null
          status: 'Present' | 'Absent'
          last_visit: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          student_id: string
          admin_id: string
          name: string
          email: string
          mobile_no: string
          address: string
          subscription_time: number
          subscription_status?: 'Active' | 'Expired'
          is_shift_student?: boolean
          shift_time?: string | null
          status?: 'Present' | 'Absent'
          last_visit?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          student_id?: string
          admin_id?: string
          name?: string
          email?: string
          mobile_no?: string
          address?: string
          subscription_time?: number
          subscription_status?: 'Active' | 'Expired'
          is_shift_student?: boolean
          shift_time?: string | null
          status?: 'Present' | 'Absent'
          last_visit?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
