export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          amount_charged: number | null
          amount_paid: number | null
          appointment_date: string
          appointment_time: string
          created_at: string
          id: string
          notes: string | null
          patient_age: number | null
          patient_email: string | null
          patient_gender: string | null
          patient_name: string
          patient_phone: string | null
          payment_status: string
          prescription_data: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_charged?: number | null
          amount_paid?: number | null
          appointment_date: string
          appointment_time: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_email?: string | null
          patient_gender?: string | null
          patient_name: string
          patient_phone?: string | null
          payment_status?: string
          prescription_data?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_charged?: number | null
          amount_paid?: number | null
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          patient_age?: number | null
          patient_email?: string | null
          patient_gender?: string | null
          patient_name?: string
          patient_phone?: string | null
          payment_status?: string
          prescription_data?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gemini_api_keys: {
        Row: {
          api_key: string
          created_at: string
          error_count: number
          id: string
          is_active: boolean
          last_error: string | null
          last_used_at: string | null
          name: string
          priority: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          error_count?: number
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_used_at?: string | null
          name: string
          priority?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          error_count?: number
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_used_at?: string | null
          name?: string
          priority?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string | null
          discount_amount: number | null
          discount_percentage: number | null
          doctor_fees: number | null
          gst_amount: number | null
          gst_percentage: number | null
          id: string
          invoice_date: string
          invoice_number: string
          is_referred: boolean | null
          notes: string | null
          other_charges: number | null
          other_charges_description: string | null
          patient_email: string | null
          patient_name: string
          patient_phone: string | null
          payment_date: string | null
          payment_method: string | null
          platform_fees: number | null
          referral_commission_amount: number | null
          referral_commission_paid: boolean | null
          referral_commission_percentage: number | null
          referrer_id: string | null
          status: string | null
          subtotal: number | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          doctor_fees?: number | null
          gst_amount?: number | null
          gst_percentage?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          is_referred?: boolean | null
          notes?: string | null
          other_charges?: number | null
          other_charges_description?: string | null
          patient_email?: string | null
          patient_name: string
          patient_phone?: string | null
          payment_date?: string | null
          payment_method?: string | null
          platform_fees?: number | null
          referral_commission_amount?: number | null
          referral_commission_paid?: boolean | null
          referral_commission_percentage?: number | null
          referrer_id?: string | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          doctor_fees?: number | null
          gst_amount?: number | null
          gst_percentage?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          is_referred?: boolean | null
          notes?: string | null
          other_charges?: number | null
          other_charges_description?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_phone?: string | null
          payment_date?: string | null
          payment_method?: string | null
          platform_fees?: number | null
          referral_commission_amount?: number | null
          referral_commission_paid?: boolean | null
          referral_commission_percentage?: number | null
          referrer_id?: string | null
          status?: string | null
          subtotal?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
        ]
      }
      referrers: {
        Row: {
          created_at: string | null
          default_commission_percentage: number | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          total_commission_earned: number | null
          total_commission_paid: number | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_commission_percentage?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          total_commission_earned?: number | null
          total_commission_paid?: number | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_commission_percentage?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          total_commission_earned?: number | null
          total_commission_paid?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
