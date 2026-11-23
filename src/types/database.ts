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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      psychology_activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_availability_exceptions: {
        Row: {
          created_at: string
          end_date: string
          end_time: string | null
          exception_type: string
          id: string
          notes: string | null
          psychologist_id: string
          start_date: string
          start_time: string | null
        }
        Insert: {
          created_at?: string
          end_date: string
          end_time?: string | null
          exception_type: string
          id?: string
          notes?: string | null
          psychologist_id: string
          start_date: string
          start_time?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string
          end_time?: string | null
          exception_type?: string
          id?: string
          notes?: string | null
          psychologist_id?: string
          start_date?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "psychology_availability_exceptions_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychology_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "psychology_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_booking_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_bookings: {
        Row: {
          booking_code: string
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          consultation_mode: string
          created_at: string
          customer_id: string
          end_time: string
          hold_expires_at: string | null
          id: string
          intake_notes: string | null
          location_notes: string | null
          price_amount: number
          psychologist_id: string
          service_id: string
          session_link: string | null
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_code: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          consultation_mode: string
          created_at?: string
          customer_id: string
          end_time: string
          hold_expires_at?: string | null
          id?: string
          intake_notes?: string | null
          location_notes?: string | null
          price_amount: number
          psychologist_id: string
          service_id: string
          session_link?: string | null
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_code?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          consultation_mode?: string
          created_at?: string
          customer_id?: string
          end_time?: string
          hold_expires_at?: string | null
          id?: string
          intake_notes?: string | null
          location_notes?: string | null
          price_amount?: number
          psychologist_id?: string
          service_id?: string
          session_link?: string | null
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_bookings_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychology_psychologists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "psychology_services"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_conversations: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          customer_id: string
          id: string
          psychologist_id: string
          state: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          customer_id: string
          id?: string
          psychologist_id: string
          state?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          psychologist_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_conversations_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_conversations_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychology_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      psychology_invoices: {
        Row: {
          booking_id: string
          created_at: string
          customer_id: string
          discount_amount: number
          id: string
          invoice_number: string
          issued_at: string
          paid_at: string | null
          payment_id: string | null
          status: string
          subtotal: number
          total_amount: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_id: string
          discount_amount?: number
          id?: string
          invoice_number: string
          issued_at?: string
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          subtotal: number
          total_amount: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_id?: string
          discount_amount?: number
          id?: string
          invoice_number?: string
          issued_at?: string
          paid_at?: string | null
          payment_id?: string | null
          status?: string
          subtotal?: number
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "psychology_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "psychology_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_invoices_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "psychology_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_text: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_text?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "psychology_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          customer_id: string
          expired_at: string | null
          gateway_order_id: string
          gateway_payload: Json | null
          id: string
          paid_at: string | null
          payment_method: string | null
          snap_redirect_url: string | null
          snap_token: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          customer_id: string
          expired_at?: string | null
          gateway_order_id: string
          gateway_payload?: Json | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          snap_redirect_url?: string | null
          snap_token?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          customer_id?: string
          expired_at?: string | null
          gateway_order_id?: string
          gateway_payload?: Json | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          snap_redirect_url?: string | null
          snap_token?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "psychology_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_permissions: {
        Row: {
          created_at: string
          description: string
          id: string
        }
        Insert: {
          created_at?: string
          description: string
          id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      psychology_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone_number: string | null
          role_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone_number?: string | null
          role_id?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          role_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "psychology_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_psychologist_specializations: {
        Row: {
          created_at: string
          psychologist_id: string
          specialization_id: string
        }
        Insert: {
          created_at?: string
          psychologist_id: string
          specialization_id: string
        }
        Update: {
          created_at?: string
          psychologist_id?: string
          specialization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_psychologist_specializations_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychology_psychologists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_psychologist_specializations_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "psychology_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_psychologists: {
        Row: {
          accepts_preliminary_chat: boolean
          approach: string | null
          bio: string | null
          created_at: string
          id: string
          is_active: boolean
          profile_id: string
          sipp_number: string | null
          slug: string
          str_number: string | null
          title: string
          updated_at: string
          years_of_experience: number
        }
        Insert: {
          accepts_preliminary_chat?: boolean
          approach?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id: string
          sipp_number?: string | null
          slug: string
          str_number?: string | null
          title?: string
          updated_at?: string
          years_of_experience?: number
        }
        Update: {
          accepts_preliminary_chat?: boolean
          approach?: string | null
          bio?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id?: string
          sipp_number?: string | null
          slug?: string
          str_number?: string | null
          title?: string
          updated_at?: string
          years_of_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "psychology_psychologists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_refunds: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          customer_id: string
          gateway_refund_id: string | null
          id: string
          payment_id: string
          processed_at: string | null
          processed_by: string | null
          reason: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          customer_id: string
          gateway_refund_id?: string | null
          id?: string
          payment_id: string
          processed_at?: string | null
          processed_by?: string | null
          reason: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          customer_id?: string
          gateway_refund_id?: string | null
          id?: string
          payment_id?: string
          processed_at?: string | null
          processed_by?: string | null
          reason?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_refunds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "psychology_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_refunds_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "psychology_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_refunds_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "psychology_permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychology_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "psychology_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      psychology_services: {
        Row: {
          base_price: number
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          supports_offline: boolean
          supports_online: boolean
          updated_at: string
        }
        Insert: {
          base_price: number
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          supports_offline?: boolean
          supports_online?: boolean
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          supports_offline?: boolean
          supports_online?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      psychology_site_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "psychology_site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "psychology_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_specializations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      psychology_testimonials: {
        Row: {
          client_name: string
          created_at: string
          id: string
          is_published: boolean
          quote: string
          rating: number
          service_id: string | null
          sort_order: number
        }
        Insert: {
          client_name: string
          created_at?: string
          id?: string
          is_published?: boolean
          quote: string
          rating?: number
          service_id?: string | null
          sort_order?: number
        }
        Update: {
          client_name?: string
          created_at?: string
          id?: string
          is_published?: boolean
          quote?: string
          rating?: number
          service_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "psychology_testimonials_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "psychology_services"
            referencedColumns: ["id"]
          },
        ]
      }
      psychology_working_hours: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          psychologist_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          psychologist_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          psychologist_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychology_working_hours_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "psychology_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_assessments: {
        Row: {
          answers: Json
          assessment_type: string
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          answers?: Json
          assessment_type: string
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          answers?: Json
          assessment_type?: string
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_assessments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_assessments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_name: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      Soulaide_availability_overrides: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          is_available: boolean
          override_date: string
          psychologist_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          override_date: string
          psychologist_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          override_date?: string
          psychologist_id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_availability_overrides_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_booking_status_history: {
        Row: {
          booking_id: string
          changed_by: string | null
          created_at: string
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          booking_id: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
        }
        Update: {
          booking_id?: string
          changed_by?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_booking_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_bookings: {
        Row: {
          booking_code: string
          created_at: string
          customer_id: string
          delivery_method: string
          id: string
          location_address: string | null
          meeting_link: string | null
          notes: string | null
          psychologist_id: string
          service_id: string
          session_date: string
          session_end_time: string
          session_start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          booking_code: string
          created_at?: string
          customer_id: string
          delivery_method: string
          id?: string
          location_address?: string | null
          meeting_link?: string | null
          notes?: string | null
          psychologist_id: string
          service_id: string
          session_date: string
          session_end_time: string
          session_start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          booking_code?: string
          created_at?: string
          customer_id?: string
          delivery_method?: string
          id?: string
          location_address?: string | null
          meeting_link?: string | null
          notes?: string | null
          psychologist_id?: string
          service_id?: string
          session_date?: string
          session_end_time?: string
          session_start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_bookings_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_psychologists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_services"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_client_profiles: {
        Row: {
          created_at: string
          customer_id: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          gender: string | null
          id: string
          occupation: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          id?: string
          occupation?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          id?: string
          occupation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_client_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "Soulaide_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_clinical_notes: {
        Row: {
          booking_id: string
          clinical_observations: string | null
          created_at: string
          customer_id: string
          id: string
          interventions_used: string | null
          is_confidential: boolean
          psychologist_id: string
          recommendations: string | null
          session_summary: string | null
          updated_at: string
        }
        Insert: {
          booking_id: string
          clinical_observations?: string | null
          created_at?: string
          customer_id: string
          id?: string
          interventions_used?: string | null
          is_confidential?: boolean
          psychologist_id: string
          recommendations?: string | null
          session_summary?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string
          clinical_observations?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          interventions_used?: string | null
          is_confidential?: boolean
          psychologist_id?: string
          recommendations?: string | null
          session_summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_clinical_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "Soulaide_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_clinical_notes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_clinical_notes_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_clinical_reports: {
        Row: {
          booking_id: string
          created_at: string
          customer_id: string
          file_path: string
          id: string
          psychologist_id: string
          report_type: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          customer_id: string
          file_path: string
          id?: string
          psychologist_id: string
          report_type: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          customer_id?: string
          file_path?: string
          id?: string
          psychologist_id?: string
          report_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_clinical_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_clinical_reports_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_clinical_reports_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_cms_pages: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      Soulaide_consent_records: {
        Row: {
          agreed_at: string
          consent_type: string
          customer_id: string
          id: string
          ip_address: string | null
          version: string
        }
        Insert: {
          agreed_at?: string
          consent_type: string
          customer_id: string
          id?: string
          ip_address?: string | null
          version: string
        }
        Update: {
          agreed_at?: string
          consent_type?: string
          customer_id?: string
          id?: string
          ip_address?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_consent_records_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_conversations: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          kind: string
          psychologist_id: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          kind?: string
          psychologist_id?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          kind?: string
          psychologist_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_conversations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_conversations_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          question: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
        }
        Relationships: []
      }
      Soulaide_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          meta: Json
          sender_id: string | null
          sender_kind: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          meta?: Json
          sender_id?: string | null
          sender_kind?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          meta?: Json
          sender_id?: string | null
          sender_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      Soulaide_payment_webhook_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          order_id: string
          processed_at: string
          raw_payload: Json
          status: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          order_id: string
          processed_at?: string
          raw_payload: Json
          status?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          order_id?: string
          processed_at?: string
          raw_payload?: Json
          status?: string
        }
        Relationships: []
      }
      Soulaide_payments: {
        Row: {
          amount: number
          booking_id: string
          checkout_url: string | null
          created_at: string
          expires_at: string | null
          id: string
          payment_time: string | null
          payment_type: string | null
          provider: string
          provider_order_id: string
          provider_transaction_id: string | null
          qr_image: string | null
          qr_string: string | null
          status: string
          total_amount: number | null
          unique_code: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          checkout_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_time?: string | null
          payment_type?: string | null
          provider?: string
          provider_order_id: string
          provider_transaction_id?: string | null
          qr_image?: string | null
          qr_string?: string | null
          status?: string
          total_amount?: number | null
          unique_code?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          checkout_url?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_time?: string | null
          payment_type?: string | null
          provider?: string
          provider_order_id?: string
          provider_transaction_id?: string | null
          qr_image?: string | null
          qr_string?: string | null
          status?: string
          total_amount?: number | null
          unique_code?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      Soulaide_psychologist_presence: {
        Row: {
          id: string
          last_active_at: string
          psychologist_id: string
          status: string
        }
        Insert: {
          id?: string
          last_active_at?: string
          psychologist_id: string
          status?: string
        }
        Update: {
          id?: string
          last_active_at?: string
          psychologist_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_psychologist_presence_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: true
            referencedRelation: "Soulaide_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_psychologist_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          psychologist_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          psychologist_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          psychologist_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_psychologist_schedules_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_psychologists"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_psychologists: {
        Row: {
          approaches: string[]
          bio: string | null
          card_image_url: string | null
          created_at: string
          credentials: string
          experience_years: string
          full_name: string
          id: string
          initial_schedule: string | null
          is_active: boolean
          is_bot: boolean
          practice_areas: string[]
          profile_image_url: string | null
          slug: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          approaches?: string[]
          bio?: string | null
          card_image_url?: string | null
          created_at?: string
          credentials: string
          experience_years: string
          full_name: string
          id?: string
          initial_schedule?: string | null
          is_active?: boolean
          is_bot?: boolean
          practice_areas?: string[]
          profile_image_url?: string | null
          slug: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          approaches?: string[]
          bio?: string | null
          card_image_url?: string | null
          created_at?: string
          credentials?: string
          experience_years?: string
          full_name?: string
          id?: string
          initial_schedule?: string | null
          is_active?: boolean
          is_bot?: boolean
          practice_areas?: string[]
          profile_image_url?: string | null
          slug?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      Soulaide_refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string
          reason: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id: string
          reason: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string
          reason?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_reschedule_requests: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          proposed_date: string
          proposed_end_time: string
          proposed_start_time: string
          reason: string | null
          requested_by: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          proposed_date: string
          proposed_end_time: string
          proposed_start_time: string
          reason?: string | null
          requested_by: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          proposed_date?: string
          proposed_end_time?: string
          proposed_start_time?: string
          reason?: string | null
          requested_by?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_reschedule_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_service_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      Soulaide_service_psychologists: {
        Row: {
          created_at: string
          id: string
          psychologist_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          psychologist_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          psychologist_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_service_psychologists_psychologist_id_fkey"
            columns: ["psychologist_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_psychologists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Soulaide_service_psychologists_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_services"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_services: {
        Row: {
          category_id: string
          created_at: string
          delivery_methods: string[]
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price_offline: number | null
          price_online: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          delivery_methods?: string[]
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          price_offline?: number | null
          price_online?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          delivery_methods?: string[]
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price_offline?: number | null
          price_online?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "Soulaide_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "Soulaide_service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      Soulaide_site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      Soulaide_staff_members: {
        Row: {
          created_at: string
          department: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      Soulaide_user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      psychology_is_admin: { Args: never; Returns: boolean }
      psychology_is_slot_available: {
        Args: {
          p_end_time: string
          p_exclude_booking_id?: string
          p_psychologist_id: string
          p_start_time: string
        }
        Returns: boolean
      }
      psychology_user_has_role: {
        Args: { target_role: string }
        Returns: boolean
      }
      Soulaide_append_thread_message: {
        Args: {
          p_content: string
          p_conversation_id: string
          p_meta?: Json
          p_sender_kind?: string
        }
        Returns: Json
      }
      Soulaide_day_availability: {
        Args: { p_date: string; p_psychologist_id: string }
        Returns: Json
      }
      Soulaide_find_or_create_thread: {
        Args: {
          p_customer_id: string
          p_kind?: string
          p_psychologist_id?: string
        }
        Returns: string
      }
      Soulaide_get_psychologist_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      Soulaide_get_user_role: { Args: { p_user_id: string }; Returns: string }
      Soulaide_is_admin: { Args: { p_user_id: string }; Returns: boolean }
      Soulaide_is_psychologist: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      Soulaide_open_booking_thread: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      Soulaide_open_thread: {
        Args: { p_customer_id?: string; p_psychologist_id?: string }
        Returns: Json
      }
      Soulaide_reserve_slot_atomic:
        | {
            Args: {
              p_customer_id: string
              p_delivery_method: string
              p_notes?: string
              p_psychologist_id: string
              p_service_id: string
              p_session_date: string
              p_session_start_time: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_consent?: boolean
              p_customer_id: string
              p_delivery_method: string
              p_notes?: string
              p_psychologist_id: string
              p_service_id: string
              p_session_date: string
              p_session_start_time: string
            }
            Returns: Json
          }
      Soulaide_send_chat: {
        Args: { p_content: string; p_conversation_id: string }
        Returns: Json
      }
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
    Enums: {},
  },
} as const
