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
      data_sources: {
        Row: {
          category: string
          created_at: string
          description: string
          id: number
          last_synced_at: string | null
          license: string | null
          name: string
          source_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          id?: number
          last_synced_at?: string | null
          license?: string | null
          name: string
          source_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: number
          last_synced_at?: string | null
          license?: string | null
          name?: string
          source_url?: string | null
        }
        Relationships: []
      }
      environment_inventories: {
        Row: {
          business_owner: string | null
          created_at: string
          environment: string
          eol_date: string | null
          id: number
          installed_version: string
          migration_status: string
          owner_id: string
          product_name: string
          risk_status: Database["public"]["Enums"]["lifecycle_status"]
          updated_at: string
        }
        Insert: {
          business_owner?: string | null
          created_at?: string
          environment: string
          eol_date?: string | null
          id?: number
          installed_version: string
          migration_status?: string
          owner_id: string
          product_name: string
          risk_status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Update: {
          business_owner?: string | null
          created_at?: string
          environment?: string
          eol_date?: string | null
          id?: number
          installed_version?: string
          migration_status?: string
          owner_id?: string
          product_name?: string
          risk_status?: Database["public"]["Enums"]["lifecycle_status"]
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string
          homepage_url: string | null
          id: number
          name: string
          slug: string
          source_id: number | null
          updated_at: string
          vendor: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          homepage_url?: string | null
          id?: number
          name: string
          slug: string
          source_id?: number | null
          updated_at?: string
          vendor?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          homepage_url?: string | null
          id?: number
          name?: string
          slug?: string
          source_id?: number | null
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      provenance_records: {
        Row: {
          confidence_score: number
          entity_id: number
          entity_type: string
          fetched_at: string
          id: number
          license: string | null
          notes: string
          source_name: string
          source_url: string | null
        }
        Insert: {
          confidence_score?: number
          entity_id: number
          entity_type: string
          fetched_at?: string
          id?: number
          license?: string | null
          notes?: string
          source_name: string
          source_url?: string | null
        }
        Update: {
          confidence_score?: number
          entity_id?: number
          entity_type?: string
          fetched_at?: string
          id?: number
          license?: string | null
          notes?: string
          source_name?: string
          source_url?: string | null
        }
        Relationships: []
      }
      release_cycles: {
        Row: {
          created_at: string
          cycle: string
          eol_date: string | null
          id: number
          latest_release_date: string | null
          latest_version: string | null
          product_id: number
          release_date: string | null
          status: Database["public"]["Enums"]["lifecycle_status"]
          support_end: string | null
        }
        Insert: {
          created_at?: string
          cycle: string
          eol_date?: string | null
          id?: number
          latest_release_date?: string | null
          latest_version?: string | null
          product_id: number
          release_date?: string | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          support_end?: string | null
        }
        Update: {
          created_at?: string
          cycle?: string
          eol_date?: string | null
          id?: number
          latest_release_date?: string | null
          latest_version?: string | null
          product_id?: number
          release_date?: string | null
          status?: Database["public"]["Enums"]["lifecycle_status"]
          support_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "release_cycles_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_provenance_sources: {
        Args: never
        Returns: {
          source_name: string
        }[]
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
      app_role: "admin" | "user"
      lifecycle_status: "supported" | "approaching_eol" | "end_of_life"
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
      app_role: ["admin", "user"],
      lifecycle_status: ["supported", "approaching_eol", "end_of_life"],
    },
  },
} as const
