export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      battery_types: {
        Row: {
          created_at: string | null
          currentQty: number | null
          description: string | null
          id: string
          isActive: boolean | null
          name: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currentQty?: number | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          name: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currentQty?: number | null
          description?: string | null
          id?: string
          isActive?: boolean | null
          name?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          note_id: string
          text: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          note_id: string
          text: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          note_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          average_price: number | null
          balance: number | null
          block_reason: string | null
          created_at: string | null
          customer_code: string
          description: string | null
          id: string
          is_blocked: boolean | null
          last_message_sent: string | null
          last_purchase: string | null
          message_sent: boolean | null
          name: string
          notes: string | null
          phone: string | null
          total_amount: number | null
          total_purchases: number | null
          updated_at: string | null
        }
        Insert: {
          average_price?: number | null
          balance?: number | null
          block_reason?: string | null
          created_at?: string | null
          customer_code: string
          description?: string | null
          id?: string
          is_blocked?: boolean | null
          last_message_sent?: string | null
          last_purchase?: string | null
          message_sent?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          total_amount?: number | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Update: {
          average_price?: number | null
          balance?: number | null
          block_reason?: string | null
          created_at?: string | null
          customer_code?: string
          description?: string | null
          id?: string
          is_blocked?: boolean | null
          last_message_sent?: string | null
          last_purchase?: string | null
          message_sent?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          total_amount?: number | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_purchases: {
        Row: {
          battery_type: string
          batteryTypeId: string
          created_at: string | null
          date: string
          discount: number | null
          final_total: number
          id: string
          is_saved: boolean | null
          price_per_kg: number
          quantity: number
          supplier_code: string | null
          supplier_name: string
          supplier_phone: string | null
          total: number
          updated_at: string | null
        }
        Insert: {
          battery_type: string
          batteryTypeId?: string
          created_at?: string | null
          date: string
          discount?: number | null
          final_total: number
          id?: string
          is_saved?: boolean | null
          price_per_kg: number
          quantity: number
          supplier_code?: string | null
          supplier_name: string
          supplier_phone?: string | null
          total: number
          updated_at?: string | null
        }
        Update: {
          battery_type?: string
          batteryTypeId?: string
          created_at?: string | null
          date?: string
          discount?: number | null
          final_total?: number
          id?: string
          is_saved?: boolean | null
          price_per_kg?: number
          quantity?: number
          supplier_code?: string | null
          supplier_name?: string
          supplier_phone?: string | null
          total?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          color: string | null
          completed: boolean | null
          content: string | null
          created_at: string | null
          date: string
          id: string
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          completed?: boolean | null
          content?: string | null
          created_at?: string | null
          date: string
          id?: string
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          completed?: boolean | null
          content?: string | null
          created_at?: string | null
          date?: string
          id?: string
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          battery_type_id: string
          created_at: string | null
          id: string
          price_per_kg: number
          purchase_id: string
          quantity: number
          total: number
        }
        Insert: {
          battery_type_id: string
          created_at?: string | null
          id?: string
          price_per_kg: number
          purchase_id: string
          quantity: number
          total: number
        }
        Update: {
          battery_type_id?: string
          created_at?: string | null
          id?: string
          price_per_kg?: number
          purchase_id?: string
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_battery_type_id_fkey"
            columns: ["battery_type_id"]
            isOneToOne: false
            referencedRelation: "battery_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string | null
          date: string
          discount: number | null
          id: string
          invoice_number: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["status_type"] | null
          subtotal: number
          supplier_id: string
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          discount?: number | null
          id?: string
          invoice_number: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["status_type"] | null
          subtotal?: number
          supplier_id: string
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          discount?: number | null
          id?: string
          invoice_number?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["status_type"] | null
          subtotal?: number
          supplier_id?: string
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          battery_type_id: string
          created_at: string | null
          id: string
          price_per_kg: number
          quantity: number
          sale_id: string
          total: number
        }
        Insert: {
          battery_type_id: string
          created_at?: string | null
          id?: string
          price_per_kg: number
          quantity: number
          sale_id: string
          total: number
        }
        Update: {
          battery_type_id?: string
          created_at?: string | null
          id?: string
          price_per_kg?: number
          quantity?: number
          sale_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_battery_type_id_fkey"
            columns: ["battery_type_id"]
            isOneToOne: false
            referencedRelation: "battery_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          customer_id: string
          date: string
          discount: number | null
          id: string
          invoice_number: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["status_type"] | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          date: string
          discount?: number | null
          id?: string
          invoice_number: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["status_type"] | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          date?: string
          discount?: number | null
          id?: string
          invoice_number?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["status_type"] | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          average_price: number | null
          balance: number | null
          block_reason: string | null
          created_at: string | null
          description: string | null
          id: string
          is_blocked: boolean | null
          last_message_sent: string | null
          last_purchase: string | null
          message_sent: boolean | null
          name: string
          notes: string | null
          phone: string | null
          supplier_code: string
          total_amount: number | null
          total_purchases: number | null
          updated_at: string | null
        }
        Insert: {
          average_price?: number | null
          balance?: number | null
          block_reason?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_blocked?: boolean | null
          last_message_sent?: string | null
          last_purchase?: string | null
          message_sent?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          supplier_code: string
          total_amount?: number | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Update: {
          average_price?: number | null
          balance?: number | null
          block_reason?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_blocked?: boolean | null
          last_message_sent?: string | null
          last_purchase?: string | null
          message_sent?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          supplier_code?: string
          total_amount?: number | null
          total_purchases?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_group_items: {
        Row: {
          created_at: string | null
          id: string
          task_group_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_group_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          task_group_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_group_items_task_group_id_fkey"
            columns: ["task_group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_group_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_groups: {
        Row: {
          color: string | null
          created_date: string | null
          id: string
          title: string
        }
        Insert: {
          color?: string | null
          created_date?: string | null
          id?: string
          title: string
        }
        Update: {
          color?: string | null
          created_date?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          color: string | null
          completed: boolean | null
          completed_date: string | null
          created_date: string | null
          id: string
          task_group_id: string | null
          title: string
        }
        Insert: {
          color?: string | null
          completed?: boolean | null
          completed_date?: string | null
          created_date?: string | null
          id?: string
          task_group_id?: string | null
          title: string
        }
        Update: {
          color?: string | null
          completed?: boolean | null
          completed_date?: string | null
          created_date?: string | null
          id?: string
          task_group_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_task_group_id_fkey"
            columns: ["task_group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          total_amount: number
          vat: number | null
          vat_amount: number | null
          voucher_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          total_amount: number
          vat?: number | null
          vat_amount?: number | null
          voucher_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          total_amount?: number
          vat?: number | null
          vat_amount?: number | null
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_items_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          entity_id: string
          entity_name: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference: string | null
          status: Database["public"]["Enums"]["status_type"] | null
          subtotal: number
          total: number
          total_vat: number | null
          type: Database["public"]["Enums"]["voucher_type"]
          updated_at: string | null
          voucher_number: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          date: string
          entity_id: string
          entity_name?: string | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          notes?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          subtotal?: number
          total?: number
          total_vat?: number | null
          type: Database["public"]["Enums"]["voucher_type"]
          updated_at?: string | null
          voucher_number: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          entity_id?: string
          entity_name?: string | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          reference?: string | null
          status?: Database["public"]["Enums"]["status_type"] | null
          subtotal?: number
          total?: number
          total_vat?: number | null
          type?: Database["public"]["Enums"]["voucher_type"]
          updated_at?: string | null
          voucher_number?: string
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
      entity_type: "customer" | "supplier"
      payment_method: "cash" | "card" | "bank_transfer" | "check"
      status_type: "pending" | "completed" | "cancelled"
      voucher_type: "receipt" | "payment" | "all"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      entity_type: ["customer", "supplier"],
      payment_method: ["cash", "card", "bank_transfer", "check"],
      status_type: ["pending", "completed", "cancelled"],
      voucher_type: ["receipt", "payment", "all"],
    },
  },
} as const
