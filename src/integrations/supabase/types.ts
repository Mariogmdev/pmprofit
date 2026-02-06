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
      modules: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          default_config: Json
          id: string
          is_public: boolean | null
          is_system: boolean | null
          name: string
          type: string
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          default_config: Json
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          name: string
          type: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          default_config?: Json
          id?: string
          is_public?: boolean | null
          is_system?: boolean | null
          name?: string
          type?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      obra_civil: {
        Row: {
          area_total_proyecto: number | null
          capex_construccion: number | null
          capex_obra_civil_total: number | null
          costo_construccion_por_m2: number | null
          estudios_disenos: number | null
          id: string
          imprevistos_porcentaje: number | null
          imprevistos_valor: number | null
          interventoria: number | null
          interventoria_porcentaje: number | null
          paisajismo: number | null
          permisos_licencias: number | null
          project_id: string
          updated_at: string | null
        }
        Insert: {
          area_total_proyecto?: number | null
          capex_construccion?: number | null
          capex_obra_civil_total?: number | null
          costo_construccion_por_m2?: number | null
          estudios_disenos?: number | null
          id?: string
          imprevistos_porcentaje?: number | null
          imprevistos_valor?: number | null
          interventoria?: number | null
          interventoria_porcentaje?: number | null
          paisajismo?: number | null
          permisos_licencias?: number | null
          project_id: string
          updated_at?: string | null
        }
        Update: {
          area_total_proyecto?: number | null
          capex_construccion?: number | null
          capex_obra_civil_total?: number | null
          costo_construccion_por_m2?: number | null
          estudios_disenos?: number | null
          id?: string
          imprevistos_porcentaje?: number | null
          imprevistos_valor?: number | null
          interventoria?: number | null
          interventoria_porcentaje?: number | null
          paisajismo?: number | null
          permisos_licencias?: number | null
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obra_civil_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_activities: {
        Row: {
          capex: number | null
          config: Json | null
          created_at: string | null
          id: string
          module_id: string | null
          name: string
          opex_monthly: number | null
          order_index: number | null
          project_id: string
          quantity: number | null
          revenue_monthly: number | null
        }
        Insert: {
          capex?: number | null
          config?: Json | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          name: string
          opex_monthly?: number | null
          order_index?: number | null
          project_id: string
          quantity?: number | null
          revenue_monthly?: number | null
        }
        Update: {
          capex?: number | null
          config?: Json | null
          created_at?: string | null
          id?: string
          module_id?: string | null
          name?: string
          opex_monthly?: number | null
          order_index?: number | null
          project_id?: string
          quantity?: number | null
          revenue_monthly?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_opex: {
        Row: {
          administrativos: Json | null
          arrendamiento_fijo: number | null
          arrendamiento_mixto_base: string | null
          arrendamiento_mixto_fijo: number | null
          arrendamiento_mixto_porcentaje: number | null
          arrendamiento_modelo: string | null
          arrendamiento_variable_base: string | null
          arrendamiento_variable_porcentaje: number | null
          comision_datafono_porcentaje: number | null
          comisiones: Json | null
          comisiones_bancarias: Json | null
          depreciacion_anos: number | null
          gastos_financieros: Json | null
          id: string
          impuestos: Json | null
          incluir_4x1000: boolean | null
          incluir_comision_datafono: boolean | null
          incluir_depreciacion: boolean | null
          incluir_iva: boolean | null
          incluir_retenciones: boolean | null
          iva_pagado_estimado: number | null
          mantenimiento_general: Json | null
          marketing: Json | null
          nomina_administrativa: Json | null
          nomina_operativa: Json | null
          otros_gastos: Json | null
          porcentaje_ingresos_iva: number | null
          porcentaje_ventas_datafono: number | null
          prestaciones_porcentaje: number | null
          project_id: string
          retenciones: Json | null
          seguridad: Json | null
          seguros: Json | null
          servicios_publicos: Json | null
          tarifa_iva: number | null
          tecnologia: Json | null
          updated_at: string | null
        }
        Insert: {
          administrativos?: Json | null
          arrendamiento_fijo?: number | null
          arrendamiento_mixto_base?: string | null
          arrendamiento_mixto_fijo?: number | null
          arrendamiento_mixto_porcentaje?: number | null
          arrendamiento_modelo?: string | null
          arrendamiento_variable_base?: string | null
          arrendamiento_variable_porcentaje?: number | null
          comision_datafono_porcentaje?: number | null
          comisiones?: Json | null
          comisiones_bancarias?: Json | null
          depreciacion_anos?: number | null
          gastos_financieros?: Json | null
          id?: string
          impuestos?: Json | null
          incluir_4x1000?: boolean | null
          incluir_comision_datafono?: boolean | null
          incluir_depreciacion?: boolean | null
          incluir_iva?: boolean | null
          incluir_retenciones?: boolean | null
          iva_pagado_estimado?: number | null
          mantenimiento_general?: Json | null
          marketing?: Json | null
          nomina_administrativa?: Json | null
          nomina_operativa?: Json | null
          otros_gastos?: Json | null
          porcentaje_ingresos_iva?: number | null
          porcentaje_ventas_datafono?: number | null
          prestaciones_porcentaje?: number | null
          project_id: string
          retenciones?: Json | null
          seguridad?: Json | null
          seguros?: Json | null
          servicios_publicos?: Json | null
          tarifa_iva?: number | null
          tecnologia?: Json | null
          updated_at?: string | null
        }
        Update: {
          administrativos?: Json | null
          arrendamiento_fijo?: number | null
          arrendamiento_mixto_base?: string | null
          arrendamiento_mixto_fijo?: number | null
          arrendamiento_mixto_porcentaje?: number | null
          arrendamiento_modelo?: string | null
          arrendamiento_variable_base?: string | null
          arrendamiento_variable_porcentaje?: number | null
          comision_datafono_porcentaje?: number | null
          comisiones?: Json | null
          comisiones_bancarias?: Json | null
          depreciacion_anos?: number | null
          gastos_financieros?: Json | null
          id?: string
          impuestos?: Json | null
          incluir_4x1000?: boolean | null
          incluir_comision_datafono?: boolean | null
          incluir_depreciacion?: boolean | null
          incluir_iva?: boolean | null
          incluir_retenciones?: boolean | null
          iva_pagado_estimado?: number | null
          mantenimiento_general?: Json | null
          marketing?: Json | null
          nomina_administrativa?: Json | null
          nomina_operativa?: Json | null
          otros_gastos?: Json | null
          porcentaje_ingresos_iva?: number | null
          porcentaje_ventas_datafono?: number | null
          prestaciones_porcentaje?: number | null
          project_id?: string
          retenciones?: Json | null
          seguridad?: Json | null
          seguros?: Json | null
          servicios_publicos?: Json | null
          tarifa_iva?: number | null
          tecnologia?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_opex_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_spaces: {
        Row: {
          area: number | null
          breakdown: Json | null
          capex_por_m2: number | null
          configuracion_ingresos: Json | null
          created_at: string | null
          genera_ingresos: boolean | null
          id: string
          name: string
          order_index: number | null
          project_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          area?: number | null
          breakdown?: Json | null
          capex_por_m2?: number | null
          configuracion_ingresos?: Json | null
          created_at?: string | null
          genera_ingresos?: boolean | null
          id?: string
          name: string
          order_index?: number | null
          project_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          area?: number | null
          breakdown?: Json | null
          capex_por_m2?: number | null
          configuracion_ingresos?: Json | null
          created_at?: string | null
          genera_ingresos?: boolean | null
          id?: string
          name?: string
          order_index?: number | null
          project_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_spaces_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          area_total: number | null
          closing_hour: number | null
          closing_minute: number | null
          created_at: string | null
          currency: string
          currency_symbol: string | null
          days_per_month: number | null
          discount_rate: number | null
          holidays_different: boolean | null
          id: string
          inflation_rate: number | null
          last_saved_at: string | null
          location: string | null
          name: string
          opening_date: string | null
          opening_hour: number | null
          opening_minute: number | null
          projection_years: number | null
          updated_at: string | null
          user_id: string
          weekend_closing_hour: number | null
          weekend_different: boolean | null
          weekend_opening_hour: number | null
          working_capital_months: number | null
        }
        Insert: {
          area_total?: number | null
          closing_hour?: number | null
          closing_minute?: number | null
          created_at?: string | null
          currency?: string
          currency_symbol?: string | null
          days_per_month?: number | null
          discount_rate?: number | null
          holidays_different?: boolean | null
          id?: string
          inflation_rate?: number | null
          last_saved_at?: string | null
          location?: string | null
          name: string
          opening_date?: string | null
          opening_hour?: number | null
          opening_minute?: number | null
          projection_years?: number | null
          updated_at?: string | null
          user_id: string
          weekend_closing_hour?: number | null
          weekend_different?: boolean | null
          weekend_opening_hour?: number | null
          working_capital_months?: number | null
        }
        Update: {
          area_total?: number | null
          closing_hour?: number | null
          closing_minute?: number | null
          created_at?: string | null
          currency?: string
          currency_symbol?: string | null
          days_per_month?: number | null
          discount_rate?: number | null
          holidays_different?: boolean | null
          id?: string
          inflation_rate?: number | null
          last_saved_at?: string | null
          location?: string | null
          name?: string
          opening_date?: string | null
          opening_hour?: number | null
          opening_minute?: number | null
          projection_years?: number | null
          updated_at?: string | null
          user_id?: string
          weekend_closing_hour?: number | null
          weekend_different?: boolean | null
          weekend_opening_hour?: number | null
          working_capital_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
