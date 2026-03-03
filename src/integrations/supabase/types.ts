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
      daily_logins: {
        Row: {
          created_at: string
          id: string
          login_date: string
          stars_awarded: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          login_date?: string
          stars_awarded?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          login_date?: string
          stars_awarded?: number
          user_id?: string
        }
        Relationships: []
      }
      feedback_submissions: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feedback_votes: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          vote_type: string
          voter_key: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          vote_type: string
          voter_key: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          vote_type?: string
          voter_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_sound: string
          avatar_url: string | null
          best_streak: number
          created_at: string
          display_name: string
          id: string
          stars: number
          total_correct: number
          username: string | null
          username_changed_at: string | null
        }
        Insert: {
          active_sound?: string
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          display_name: string
          id: string
          stars?: number
          total_correct?: number
          username?: string | null
          username_changed_at?: string | null
        }
        Update: {
          active_sound?: string
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          display_name?: string
          id?: string
          stars?: number
          total_correct?: number
          username?: string | null
          username_changed_at?: string | null
        }
        Relationships: []
      }
      season_pass_daily_progress: {
        Row: {
          baseline_stars: number
          baseline_total_correct: number
          claimed_correct_reward: boolean
          claimed_login_reward: boolean
          claimed_stars_reward: boolean
          created_at: string
          progress_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_stars?: number
          baseline_total_correct?: number
          claimed_correct_reward?: boolean
          claimed_login_reward?: boolean
          claimed_stars_reward?: boolean
          created_at?: string
          progress_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_stars?: number
          baseline_total_correct?: number
          claimed_correct_reward?: boolean
          claimed_login_reward?: boolean
          claimed_stars_reward?: boolean
          created_at?: string
          progress_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_pass_daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      season_pass_daily_progress: {
        Row: {
          baseline_stars: number
          baseline_total_correct: number
          claimed_correct_reward: boolean
          claimed_login_reward: boolean
          claimed_stars_reward: boolean
          created_at: string
          progress_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          baseline_stars?: number
          baseline_total_correct?: number
          claimed_correct_reward?: boolean
          claimed_login_reward?: boolean
          claimed_stars_reward?: boolean
          created_at?: string
          progress_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          baseline_stars?: number
          baseline_total_correct?: number
          claimed_correct_reward?: boolean
          claimed_login_reward?: boolean
          claimed_stars_reward?: boolean
          created_at?: string
          progress_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_pass_daily_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sound_purchases: {
        Row: {
          id: string
          purchased_at: string
          sound_id: string
          user_id: string
        }
        Insert: {
          id?: string
          purchased_at?: string
          sound_id: string
          user_id: string
        }
        Update: {
          id?: string
          purchased_at?: string
          sound_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sound_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_streaks: {
        Row: {
          correct_count: number
          id: string
          streak_count: number
          submitted_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          correct_count?: number
          id?: string
          streak_count: number
          submitted_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          correct_count?: number
          id?: string
          streak_count?: number
          submitted_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      weekly_leaderboard: {
        Row: {
          avatar_url: string | null
          correct_count: number | null
          display_name: string | null
          rank: number | null
          streak_count: number | null
          user_id: string | null
          username: string | null
          week_start: string | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_stars: { Args: { p_amount: number }; Returns: undefined }
      change_username: { Args: { p_new_username: string }; Returns: boolean }
      claim_season_pass_reward: { Args: { p_reward_key: string }; Returns: boolean }
      claim_daily_login: { Args: never; Returns: boolean }
      current_week_start: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_or_create_season_pass_daily_progress: {
        Args: never
        Returns: {
          progress_date: string
          baseline_stars: number
          baseline_total_correct: number
          claimed_login_reward: boolean
          claimed_stars_reward: boolean
          claimed_correct_reward: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purchase_sound: {
        Args: { p_cost: number; p_sound_id: string }
        Returns: boolean
      }
      submit_streak: { Args: { p_streak_count: number }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
