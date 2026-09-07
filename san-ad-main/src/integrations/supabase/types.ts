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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          child_id: string
          created_at: string
          id: string
          notes: string | null
          requested_by: string | null
          scheduled_at: string
          specialist_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          scheduled_at: string
          specialist_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          requested_by?: string | null
          scheduled_at?: string
          specialist_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          child_id: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          feedback: string | null
          grade: number | null
          id: string
          status: Database["public"]["Enums"]["assignment_status"]
          title: string
          updated_at: string
        }
        Insert: {
          child_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          title: string
          updated_at?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          feedback?: string | null
          grade?: number | null
          id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          child_id: string
          created_at: string
          date: string
          id: string
          reason: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Insert: {
          child_id: string
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
        }
        Update: {
          child_id?: string
          created_at?: string
          date?: string
          id?: string
          reason?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "attendance_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_notes: {
        Row: {
          author_id: string | null
          category: Database["public"]["Enums"]["note_category"]
          child_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          author_id?: string | null
          category: Database["public"]["Enums"]["note_category"]
          child_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["note_category"]
          child_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_notes_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          contact_info: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          disability_type: string | null
          full_name: string
          gender: string | null
          grade_level: string | null
          id: string
          institution: string | null
          notes: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          disability_type?: string | null
          full_name: string
          gender?: string | null
          grade_level?: string | null
          id?: string
          institution?: string | null
          notes?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          contact_info?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          disability_type?: string | null
          full_name?: string
          gender?: string | null
          grade_level?: string | null
          id?: string
          institution?: string | null
          notes?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      diagnoses: {
        Row: {
          attachments: Json | null
          author_id: string | null
          child_id: string
          content: string | null
          created_at: string
          diagnosed_at: string | null
          id: string
          title: string
          type: Database["public"]["Enums"]["diagnosis_type"]
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          child_id: string
          content?: string | null
          created_at?: string
          diagnosed_at?: string | null
          id?: string
          title: string
          type: Database["public"]["Enums"]["diagnosis_type"]
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          child_id?: string
          content?: string | null
          created_at?: string
          diagnosed_at?: string | null
          id?: string
          title?: string
          type?: Database["public"]["Enums"]["diagnosis_type"]
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          child_id: string
          created_at: string
          date: string
          id: string
          max_score: number
          notes: string | null
          recorded_by: string | null
          score: number
          subject: string
          type: Database["public"]["Enums"]["grade_type"]
        }
        Insert: {
          child_id: string
          created_at?: string
          date?: string
          id?: string
          max_score?: number
          notes?: string | null
          recorded_by?: string | null
          score: number
          subject: string
          type: Database["public"]["Enums"]["grade_type"]
        }
        Update: {
          child_id?: string
          created_at?: string
          date?: string
          id?: string
          max_score?: number
          notes?: string | null
          recorded_by?: string | null
          score?: number
          subject?: string
          type?: Database["public"]["Enums"]["grade_type"]
        }
        Relationships: [
          {
            foreignKeyName: "grades_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      individual_plans: {
        Row: {
          activities: string | null
          author_id: string | null
          child_id: string
          created_at: string
          end_date: string | null
          evaluation_indicators: string | null
          id: string
          long_term_goals: string | null
          short_term_goals: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          activities?: string | null
          author_id?: string | null
          child_id: string
          created_at?: string
          end_date?: string | null
          evaluation_indicators?: string | null
          id?: string
          long_term_goals?: string | null
          short_term_goals?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          activities?: string | null
          author_id?: string | null
          child_id?: string
          created_at?: string
          end_date?: string | null
          evaluation_indicators?: string | null
          id?: string
          long_term_goals?: string | null
          short_term_goals?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "individual_plans_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          child_id: string | null
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          child_id?: string | null
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          child_id?: string | null
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_child: {
        Row: {
          child_id: string
          created_at: string
          id: string
          parent_id: string
          rejection_reason: string | null
          relationship: string | null
          status: Database["public"]["Enums"]["link_status"]
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          parent_id: string
          rejection_reason?: string | null
          relationship?: string | null
          status?: Database["public"]["Enums"]["link_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          parent_id?: string
          rejection_reason?: string | null
          relationship?: string | null
          status?: Database["public"]["Enums"]["link_status"]
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parent_child_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_contacts: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          attachments: Json | null
          author_id: string | null
          child_id: string
          content: string | null
          created_at: string
          id: string
          period: string | null
          title: string
        }
        Insert: {
          attachments?: Json | null
          author_id?: string | null
          child_id: string
          content?: string | null
          created_at?: string
          id?: string
          period?: string | null
          title: string
        }
        Update: {
          attachments?: Json | null
          author_id?: string | null
          child_id?: string
          content?: string | null
          created_at?: string
          id?: string
          period?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_child: {
        Row: {
          child_id: string
          created_at: string
          id: string
          specialist_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          specialist_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          specialist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_child_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_child: {
        Row: {
          child_id: string
          created_at: string
          id: string
          teacher_id: string
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          teacher_id: string
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_child_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_child_access: {
        Args: { _child_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "parent" | "specialist" | "teacher" | "admin"
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      appointment_type:
        | "psychological"
        | "medical"
        | "speech"
        | "educational"
        | "other"
      assignment_status: "pending" | "submitted" | "graded"
      attendance_status: "present" | "absent" | "late" | "excused"
      diagnosis_type: "medical" | "psychological" | "educational"
      grade_type: "homework" | "quiz" | "exam" | "participation"
      link_status: "pending" | "approved" | "rejected"
      note_category: "behavior" | "social" | "academic" | "progress"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["parent", "specialist", "teacher", "admin"],
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      appointment_type: [
        "psychological",
        "medical",
        "speech",
        "educational",
        "other",
      ],
      assignment_status: ["pending", "submitted", "graded"],
      attendance_status: ["present", "absent", "late", "excused"],
      diagnosis_type: ["medical", "psychological", "educational"],
      grade_type: ["homework", "quiz", "exam", "participation"],
      link_status: ["pending", "approved", "rejected"],
      note_category: ["behavior", "social", "academic", "progress"],
    },
  },
} as const
