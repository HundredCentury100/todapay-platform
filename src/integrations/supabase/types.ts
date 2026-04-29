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
      a2a_transactions: {
        Row: {
          agent_id: string | null
          amount: number | null
          commission_chain: Json | null
          created_at: string | null
          id: string
          item_id: string | null
          metadata: Json | null
          session_id: string | null
          status: string
          transaction_type: string
          updated_at: string | null
          vertical: string | null
        }
        Insert: {
          agent_id?: string | null
          amount?: number | null
          commission_chain?: Json | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          metadata?: Json | null
          session_id?: string | null
          status?: string
          transaction_type: string
          updated_at?: string | null
          vertical?: string | null
        }
        Update: {
          agent_id?: string | null
          amount?: number | null
          commission_chain?: Json | null
          created_at?: string | null
          id?: string
          item_id?: string | null
          metadata?: Json | null
          session_id?: string | null
          status?: string
          transaction_type?: string
          updated_at?: string | null
          vertical?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "a2a_transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "registered_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "a2a_transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "commerce_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      account_lifecycle_log: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string | null
          reason: string | null
          target_entity_id: string
          target_type: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by?: string | null
          reason?: string | null
          target_entity_id: string
          target_type: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string | null
          reason?: string | null
          target_entity_id?: string
          target_type?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      active_rides: {
        Row: {
          created_at: string
          current_driver_lat: number | null
          current_driver_lng: number | null
          driver_arrived_at: string | null
          driver_assigned_at: string
          driver_id: string
          dropoff_time: string | null
          emergency_triggered: boolean | null
          final_price: number | null
          id: string
          passenger_id: string | null
          payment_collected_amount: number | null
          payment_collected_by_driver: boolean | null
          payment_collected_method: string | null
          payment_completed_at: string | null
          payment_method: string | null
          payment_proof_url: string | null
          payment_status: string | null
          pickup_pin: string | null
          pickup_time: string | null
          ride_request_id: string
          share_code: string | null
          status: string
          tip_amount: number | null
          updated_at: string
          wallet_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          current_driver_lat?: number | null
          current_driver_lng?: number | null
          driver_arrived_at?: string | null
          driver_assigned_at?: string
          driver_id: string
          dropoff_time?: string | null
          emergency_triggered?: boolean | null
          final_price?: number | null
          id?: string
          passenger_id?: string | null
          payment_collected_amount?: number | null
          payment_collected_by_driver?: boolean | null
          payment_collected_method?: string | null
          payment_completed_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          pickup_pin?: string | null
          pickup_time?: string | null
          ride_request_id: string
          share_code?: string | null
          status?: string
          tip_amount?: number | null
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          current_driver_lat?: number | null
          current_driver_lng?: number | null
          driver_arrived_at?: string | null
          driver_assigned_at?: string
          driver_id?: string
          dropoff_time?: string | null
          emergency_triggered?: boolean | null
          final_price?: number | null
          id?: string
          passenger_id?: string | null
          payment_collected_amount?: number | null
          payment_collected_by_driver?: boolean | null
          payment_collected_method?: string | null
          payment_completed_at?: string | null
          payment_method?: string | null
          payment_proof_url?: string | null
          payment_status?: string | null
          pickup_pin?: string | null
          pickup_time?: string | null
          ride_request_id?: string
          share_code?: string | null
          status?: string
          tip_amount?: number | null
          updated_at?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_rides_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "available_ride_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_rides_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_clicks: {
        Row: {
          advertisement_id: string
          cost: number
          created_at: string
          id: string
          impression_id: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          advertisement_id: string
          cost: number
          created_at?: string
          id?: string
          impression_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          advertisement_id?: string
          cost?: number
          created_at?: string
          id?: string
          impression_id?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_clicks_advertisement_id_fkey"
            columns: ["advertisement_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_clicks_impression_id_fkey"
            columns: ["impression_id"]
            isOneToOne: false
            referencedRelation: "ad_impressions"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_impressions: {
        Row: {
          advertisement_id: string
          created_at: string
          id: string
          placement: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          advertisement_id: string
          created_at?: string
          id?: string
          placement: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          advertisement_id?: string
          created_at?: string
          id?: string
          placement?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_advertisement_id_fkey"
            columns: ["advertisement_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_activity_log: {
        Row: {
          action_description: string
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_resource_id: string | null
          target_resource_type: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action_description: string
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action_description?: string
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_resource_id?: string | null
          target_resource_type?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_impersonation_logs: {
        Row: {
          actions_performed: Json | null
          admin_user_id: string
          ended_at: string | null
          id: string
          merchant_profile_id: string
          reason: string
          started_at: string
        }
        Insert: {
          actions_performed?: Json | null
          admin_user_id: string
          ended_at?: string | null
          id?: string
          merchant_profile_id: string
          reason: string
          started_at?: string
        }
        Update: {
          actions_performed?: Json | null
          admin_user_id?: string
          ended_at?: string | null
          id?: string
          merchant_profile_id?: string
          reason?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_impersonation_logs_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_service_actions: {
        Row: {
          action_reason: string | null
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          merchant_profile_id: string
          new_data: Json | null
          previous_data: Json | null
          service_id: string
          service_type: string
        }
        Insert: {
          action_reason?: string | null
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          merchant_profile_id: string
          new_data?: Json | null
          previous_data?: Json | null
          service_id: string
          service_type: string
        }
        Update: {
          action_reason?: string | null
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          merchant_profile_id?: string
          new_data?: Json | null
          previous_data?: Json | null
          service_id?: string
          service_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_service_actions_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          ad_type: string
          amount_spent: number
          approved_at: string | null
          approved_by: string | null
          cost_per_click: number
          created_at: string
          daily_budget: number
          description: string | null
          destination_id: string | null
          destination_type: string | null
          destination_url: string | null
          end_date: string | null
          id: string
          image_url: string | null
          merchant_profile_id: string
          rejection_reason: string | null
          start_date: string | null
          status: string
          target_event_types: string[] | null
          target_locations: string[] | null
          target_route_types: string[] | null
          title: string
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          ad_type: string
          amount_spent?: number
          approved_at?: string | null
          approved_by?: string | null
          cost_per_click?: number
          created_at?: string
          daily_budget?: number
          description?: string | null
          destination_id?: string | null
          destination_type?: string | null
          destination_url?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          merchant_profile_id: string
          rejection_reason?: string | null
          start_date?: string | null
          status?: string
          target_event_types?: string[] | null
          target_locations?: string[] | null
          target_route_types?: string[] | null
          title: string
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          ad_type?: string
          amount_spent?: number
          approved_at?: string | null
          approved_by?: string | null
          cost_per_click?: number
          created_at?: string
          daily_budget?: number
          description?: string | null
          destination_id?: string | null
          destination_type?: string | null
          destination_url?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          merchant_profile_id?: string
          rejection_reason?: string | null
          start_date?: string | null
          status?: string
          target_event_types?: string[] | null
          target_locations?: string[] | null
          target_route_types?: string[] | null
          title?: string
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_clients: {
        Row: {
          agent_profile_id: string
          client_company: string | null
          client_email: string
          client_name: string
          client_passport: string | null
          client_phone: string | null
          created_at: string | null
          id: string
          last_booking_date: string | null
          notes: string | null
          total_bookings: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          agent_profile_id: string
          client_company?: string | null
          client_email: string
          client_name: string
          client_passport?: string | null
          client_phone?: string | null
          created_at?: string | null
          id?: string
          last_booking_date?: string | null
          notes?: string | null
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_profile_id?: string
          client_company?: string | null
          client_email?: string
          client_name?: string
          client_passport?: string | null
          client_phone?: string | null
          created_at?: string | null
          id?: string
          last_booking_date?: string | null
          notes?: string | null
          total_bookings?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_clients_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_commissions: {
        Row: {
          agent_profile_id: string
          approved_at: string | null
          approved_by: string | null
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          notes: string | null
          paid_at: string | null
          paid_by: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string | null
        }
        Insert: {
          agent_profile_id: string
          approved_at?: string | null
          approved_by?: string | null
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
        }
        Update: {
          agent_profile_id?: string
          approved_at?: string | null
          approved_by?: string | null
          booking_amount?: number
          booking_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_commissions_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_float_accounts: {
        Row: {
          agent_profile_id: string
          balance_usd: number
          balance_zwg: number
          created_at: string | null
          id: string
          low_balance_threshold_usd: number
          low_balance_threshold_zwg: number
          total_deducted_usd: number
          total_deducted_zwg: number
          total_loaded_usd: number
          total_loaded_zwg: number
          updated_at: string | null
        }
        Insert: {
          agent_profile_id: string
          balance_usd?: number
          balance_zwg?: number
          created_at?: string | null
          id?: string
          low_balance_threshold_usd?: number
          low_balance_threshold_zwg?: number
          total_deducted_usd?: number
          total_deducted_zwg?: number
          total_loaded_usd?: number
          total_loaded_zwg?: number
          updated_at?: string | null
        }
        Update: {
          agent_profile_id?: string
          balance_usd?: number
          balance_zwg?: number
          created_at?: string | null
          id?: string
          low_balance_threshold_usd?: number
          low_balance_threshold_zwg?: number
          total_deducted_usd?: number
          total_deducted_zwg?: number
          total_loaded_usd?: number
          total_loaded_zwg?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_float_accounts_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: true
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_float_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          bill_payment_id: string | null
          created_at: string | null
          currency: string
          description: string | null
          float_account_id: string
          id: string
          loaded_by_admin_id: string | null
          metadata: Json | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          bill_payment_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          float_account_id: string
          id?: string
          loaded_by_admin_id?: string | null
          metadata?: Json | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          bill_payment_id?: string | null
          created_at?: string | null
          currency?: string
          description?: string | null
          float_account_id?: string
          id?: string
          loaded_by_admin_id?: string | null
          metadata?: Json | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_float_transactions_bill_payment_id_fkey"
            columns: ["bill_payment_id"]
            isOneToOne: false
            referencedRelation: "bill_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_float_transactions_float_account_id_fkey"
            columns: ["float_account_id"]
            isOneToOne: false
            referencedRelation: "agent_float_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_notifications: {
        Row: {
          agent_profile_id: string
          body: string
          created_at: string | null
          data: Json | null
          id: string
          notification_type: string
          read: boolean | null
          title: string
        }
        Insert: {
          agent_profile_id: string
          body: string
          created_at?: string | null
          data?: Json | null
          id?: string
          notification_type: string
          read?: boolean | null
          title: string
        }
        Update: {
          agent_profile_id?: string
          body?: string
          created_at?: string | null
          data?: Json | null
          id?: string
          notification_type?: string
          read?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_notifications_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_override_commissions: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          override_amount: number
          override_rate: number
          referrer_agent_id: string
          status: string | null
          sub_agent_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          override_amount: number
          override_rate?: number
          referrer_agent_id: string
          status?: string | null
          sub_agent_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          override_amount?: number
          override_rate?: number
          referrer_agent_id?: string
          status?: string | null
          sub_agent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_override_commissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_override_commissions_referrer_agent_id_fkey"
            columns: ["referrer_agent_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_override_commissions_sub_agent_id_fkey"
            columns: ["sub_agent_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_payment_records: {
        Row: {
          agent_profile_id: string
          amount: number
          booking_id: string
          commission_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          payment_method: string
          payment_proof_url: string | null
          payment_reference: string | null
          payment_type: string
          status: string
          transaction_id: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          agent_profile_id: string
          amount: number
          booking_id: string
          commission_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_type: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          agent_profile_id?: string
          amount?: number
          booking_id?: string
          commission_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_proof_url?: string | null
          payment_reference?: string | null
          payment_type?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_payment_records_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payment_records_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payment_records_commission_id_fkey"
            columns: ["commission_id"]
            isOneToOne: false
            referencedRelation: "agent_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payment_records_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_payment_records_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_payout_requests: {
        Row: {
          agent_profile_id: string
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          payment_method: string
          payment_reference: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_profile_id: string
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method: string
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_profile_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string
          payment_reference?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_payout_requests_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_push_tokens: {
        Row: {
          agent_profile_id: string
          created_at: string | null
          device_type: string | null
          id: string
          last_used_at: string | null
          token: string
        }
        Insert: {
          agent_profile_id: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          token: string
        }
        Update: {
          agent_profile_id?: string
          created_at?: string | null
          device_type?: string | null
          id?: string
          last_used_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_push_tokens_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_agent_id: string
          referrer_agent_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_agent_id: string
          referrer_agent_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_agent_id?: string
          referrer_agent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_referrals_referred_agent_id_fkey"
            columns: ["referred_agent_id"]
            isOneToOne: true
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_referrals_referrer_agent_id_fkey"
            columns: ["referrer_agent_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_payments: {
        Row: {
          account_number: string
          agent_profile_id: string | null
          amount: number
          biller_name: string
          biller_type: string
          created_at: string
          currency: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          status: string
          tokens: Json | null
          transaction_reference: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_number: string
          agent_profile_id?: string | null
          amount: number
          biller_name: string
          biller_type: string
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          status?: string
          tokens?: Json | null
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_number?: string
          agent_profile_id?: string | null
          amount?: number
          biller_name?: string
          biller_type?: string
          created_at?: string
          currency?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          status?: string
          tokens?: Json | null
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_agent_profile_id_fkey"
            columns: ["agent_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      booking_actions: {
        Row: {
          action_status: string
          action_type: string
          booking_id: string
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          processed_by: string | null
          reason: string | null
          refund_amount: number | null
          refund_percentage: number | null
          requested_by: string | null
          updated_at: string
        }
        Insert: {
          action_status?: string
          action_type: string
          booking_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_by?: string | null
          reason?: string | null
          refund_amount?: number | null
          refund_percentage?: number | null
          requested_by?: string | null
          updated_at?: string
        }
        Update: {
          action_status?: string
          action_type?: string
          booking_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          processed_by?: string | null
          reason?: string | null
          refund_amount?: number | null
          refund_percentage?: number | null
          requested_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_actions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_addons: {
        Row: {
          addon_id: string
          booking_id: string
          created_at: string | null
          id: string
          price_at_booking: number
          quantity: number
        }
        Insert: {
          addon_id: string
          booking_id: string
          created_at?: string | null
          id?: string
          price_at_booking: number
          quantity?: number
        }
        Update: {
          addon_id?: string
          booking_id?: string
          created_at?: string | null
          id?: string
          price_at_booking?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_addons_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "event_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_addons_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_links: {
        Row: {
          corporate_account_id: string | null
          created_at: string
          created_by_user_id: string
          currency: string
          custom_message: string | null
          expires_at: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          link_code: string
          link_type: string
          max_uses: number | null
          merchant_profile_id: string | null
          preset_config: Json | null
          service_id: string
          service_name: string
          service_type: string
          times_used: number
          updated_at: string
        }
        Insert: {
          corporate_account_id?: string | null
          created_at?: string
          created_by_user_id: string
          currency?: string
          custom_message?: string | null
          expires_at?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          link_code: string
          link_type?: string
          max_uses?: number | null
          merchant_profile_id?: string | null
          preset_config?: Json | null
          service_id: string
          service_name: string
          service_type: string
          times_used?: number
          updated_at?: string
        }
        Update: {
          corporate_account_id?: string | null
          created_at?: string
          created_by_user_id?: string
          currency?: string
          custom_message?: string | null
          expires_at?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          link_code?: string
          link_type?: string
          max_uses?: number | null
          merchant_profile_id?: string | null
          preset_config?: Json | null
          service_id?: string
          service_name?: string
          service_type?: string
          times_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_links_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_links_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_policies: {
        Row: {
          automated_enforcement: boolean
          cancellation_window_hours: number
          created_at: string
          full_refund_percentage: number
          id: string
          max_reschedules: number
          merchant_profile_id: string | null
          no_refund_window_hours: number
          partial_refund_percentage: number
          partial_refund_window_hours: number
          policy_type: string
          reschedule_allowed: boolean
          reschedule_fee: number
          updated_at: string
        }
        Insert: {
          automated_enforcement?: boolean
          cancellation_window_hours?: number
          created_at?: string
          full_refund_percentage?: number
          id?: string
          max_reschedules?: number
          merchant_profile_id?: string | null
          no_refund_window_hours?: number
          partial_refund_percentage?: number
          partial_refund_window_hours?: number
          policy_type: string
          reschedule_allowed?: boolean
          reschedule_fee?: number
          updated_at?: string
        }
        Update: {
          automated_enforcement?: boolean
          cancellation_window_hours?: number
          created_at?: string
          full_refund_percentage?: number
          id?: string
          max_reschedules?: number
          merchant_profile_id?: string | null
          no_refund_window_hours?: number
          partial_refund_percentage?: number
          partial_refund_window_hours?: number
          policy_type?: string
          reschedule_allowed?: boolean
          reschedule_fee?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_policies_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          accessibility_needs: Json | null
          additional_passengers: Json | null
          agent_client_id: string | null
          agent_commission_rate: number | null
          arrival_time: string | null
          base_price: number
          booked_by_agent_id: string | null
          booking_reference: string
          booking_timestamp: string | null
          booking_type: string
          cancellation_reason: string | null
          cash_payment_deadline: string | null
          category_specific_data: Json | null
          checked_in: boolean
          checked_in_at: string | null
          created_at: string | null
          departure_time: string | null
          discount_code: string | null
          event_category: string | null
          event_date: string | null
          event_time: string | null
          event_venue: string | null
          final_destination_city: string | null
          flexi_options: Json | null
          from_location: string | null
          group_booking_id: string | null
          group_discount: number | null
          guest_email: string
          has_reviewed: boolean | null
          id: string
          is_return_ticket: boolean | null
          item_id: string
          item_name: string
          luggage_weight: number | null
          next_of_kin_number: string | null
          number_of_adults: number | null
          number_of_bags: number | null
          number_of_children: number | null
          operator: string | null
          original_booking_id: string | null
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          passport_number: string | null
          payment_plan_id: string | null
          payment_status: string
          pet_travel: Json | null
          qr_code_data: string | null
          refund_requested: boolean | null
          refund_status: string | null
          reschedule_requested: boolean | null
          reschedule_status: string | null
          reservation_expires_at: string | null
          reservation_type: string | null
          return_date: string | null
          seat_preferences: Json | null
          selected_meals: Json | null
          selected_seats: string[] | null
          special_assistance: Json | null
          status: string
          ticket_number: string
          ticket_quantity: number | null
          ticket_upgrade_from: string | null
          to_location: string | null
          total_price: number
          transfer_count: number | null
          transfer_date: string | null
          transferred_from_email: string | null
          transferred_to_email: string | null
          travel_date: string | null
          updated_at: string | null
          upgrade_requested: boolean | null
          upgrade_status: string | null
          user_id: string | null
          vertical: string | null
          whatsapp_number: string | null
        }
        Insert: {
          accessibility_needs?: Json | null
          additional_passengers?: Json | null
          agent_client_id?: string | null
          agent_commission_rate?: number | null
          arrival_time?: string | null
          base_price: number
          booked_by_agent_id?: string | null
          booking_reference?: string
          booking_timestamp?: string | null
          booking_type: string
          cancellation_reason?: string | null
          cash_payment_deadline?: string | null
          category_specific_data?: Json | null
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string | null
          departure_time?: string | null
          discount_code?: string | null
          event_category?: string | null
          event_date?: string | null
          event_time?: string | null
          event_venue?: string | null
          final_destination_city?: string | null
          flexi_options?: Json | null
          from_location?: string | null
          group_booking_id?: string | null
          group_discount?: number | null
          guest_email: string
          has_reviewed?: boolean | null
          id?: string
          is_return_ticket?: boolean | null
          item_id: string
          item_name: string
          luggage_weight?: number | null
          next_of_kin_number?: string | null
          number_of_adults?: number | null
          number_of_bags?: number | null
          number_of_children?: number | null
          operator?: string | null
          original_booking_id?: string | null
          passenger_email: string
          passenger_name: string
          passenger_phone: string
          passport_number?: string | null
          payment_plan_id?: string | null
          payment_status?: string
          pet_travel?: Json | null
          qr_code_data?: string | null
          refund_requested?: boolean | null
          refund_status?: string | null
          reschedule_requested?: boolean | null
          reschedule_status?: string | null
          reservation_expires_at?: string | null
          reservation_type?: string | null
          return_date?: string | null
          seat_preferences?: Json | null
          selected_meals?: Json | null
          selected_seats?: string[] | null
          special_assistance?: Json | null
          status?: string
          ticket_number: string
          ticket_quantity?: number | null
          ticket_upgrade_from?: string | null
          to_location?: string | null
          total_price: number
          transfer_count?: number | null
          transfer_date?: string | null
          transferred_from_email?: string | null
          transferred_to_email?: string | null
          travel_date?: string | null
          updated_at?: string | null
          upgrade_requested?: boolean | null
          upgrade_status?: string | null
          user_id?: string | null
          vertical?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          accessibility_needs?: Json | null
          additional_passengers?: Json | null
          agent_client_id?: string | null
          agent_commission_rate?: number | null
          arrival_time?: string | null
          base_price?: number
          booked_by_agent_id?: string | null
          booking_reference?: string
          booking_timestamp?: string | null
          booking_type?: string
          cancellation_reason?: string | null
          cash_payment_deadline?: string | null
          category_specific_data?: Json | null
          checked_in?: boolean
          checked_in_at?: string | null
          created_at?: string | null
          departure_time?: string | null
          discount_code?: string | null
          event_category?: string | null
          event_date?: string | null
          event_time?: string | null
          event_venue?: string | null
          final_destination_city?: string | null
          flexi_options?: Json | null
          from_location?: string | null
          group_booking_id?: string | null
          group_discount?: number | null
          guest_email?: string
          has_reviewed?: boolean | null
          id?: string
          is_return_ticket?: boolean | null
          item_id?: string
          item_name?: string
          luggage_weight?: number | null
          next_of_kin_number?: string | null
          number_of_adults?: number | null
          number_of_bags?: number | null
          number_of_children?: number | null
          operator?: string | null
          original_booking_id?: string | null
          passenger_email?: string
          passenger_name?: string
          passenger_phone?: string
          passport_number?: string | null
          payment_plan_id?: string | null
          payment_status?: string
          pet_travel?: Json | null
          qr_code_data?: string | null
          refund_requested?: boolean | null
          refund_status?: string | null
          reschedule_requested?: boolean | null
          reschedule_status?: string | null
          reservation_expires_at?: string | null
          reservation_type?: string | null
          return_date?: string | null
          seat_preferences?: Json | null
          selected_meals?: Json | null
          selected_seats?: string[] | null
          special_assistance?: Json | null
          status?: string
          ticket_number?: string
          ticket_quantity?: number | null
          ticket_upgrade_from?: string | null
          to_location?: string | null
          total_price?: number
          transfer_count?: number | null
          transfer_date?: string | null
          transferred_from_email?: string | null
          transferred_to_email?: string | null
          travel_date?: string | null
          updated_at?: string | null
          upgrade_requested?: boolean | null
          upgrade_status?: string | null
          user_id?: string | null
          vertical?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_agent_client_id_fkey"
            columns: ["agent_client_id"]
            isOneToOne: false
            referencedRelation: "agent_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_booked_by_agent_id_fkey"
            columns: ["booked_by_agent_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_group_booking_id_fkey"
            columns: ["group_booking_id"]
            isOneToOne: false
            referencedRelation: "group_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_original_booking_id_fkey"
            columns: ["original_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bus_schedules: {
        Row: {
          arrival_time: string
          available_date: string
          base_price: number
          bus_id: string
          created_at: string | null
          created_by_admin_id: string | null
          departure_time: string
          dropoff_address: string | null
          duration: string
          from_location: string
          id: string
          pickup_address: string | null
          stops: string[] | null
          to_location: string
          updated_at: string | null
        }
        Insert: {
          arrival_time: string
          available_date: string
          base_price: number
          bus_id: string
          created_at?: string | null
          created_by_admin_id?: string | null
          departure_time: string
          dropoff_address?: string | null
          duration: string
          from_location: string
          id?: string
          pickup_address?: string | null
          stops?: string[] | null
          to_location: string
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string
          available_date?: string
          base_price?: number
          bus_id?: string
          created_at?: string | null
          created_by_admin_id?: string | null
          departure_time?: string
          dropoff_address?: string | null
          duration?: string
          from_location?: string
          id?: string
          pickup_address?: string | null
          stops?: string[] | null
          to_location?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bus_schedules_bus_id_fkey"
            columns: ["bus_id"]
            isOneToOne: false
            referencedRelation: "buses"
            referencedColumns: ["id"]
          },
        ]
      }
      buses: {
        Row: {
          amenities: string[] | null
          created_at: string | null
          id: string
          image: string | null
          images: Json | null
          operator: string
          operator_code: string | null
          seat_layout: Json | null
          total_seats: number
          type: string
          updated_at: string | null
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string | null
          id?: string
          image?: string | null
          images?: Json | null
          operator: string
          operator_code?: string | null
          seat_layout?: Json | null
          total_seats?: number
          type: string
          updated_at?: string | null
        }
        Update: {
          amenities?: string[] | null
          created_at?: string | null
          id?: string
          image?: string | null
          images?: Json | null
          operator?: string
          operator_code?: string | null
          seat_layout?: Json | null
          total_seats?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      car_bookings: {
        Row: {
          add_ons: Json | null
          booking_id: string
          created_at: string
          driver_details: Json
          dropoff_datetime: string
          dropoff_location: string
          id: string
          insurance_type: string | null
          pickup_datetime: string
          pickup_location: string
          vehicle_id: string
        }
        Insert: {
          add_ons?: Json | null
          booking_id: string
          created_at?: string
          driver_details: Json
          dropoff_datetime: string
          dropoff_location: string
          id?: string
          insurance_type?: string | null
          pickup_datetime: string
          pickup_location: string
          vehicle_id: string
        }
        Update: {
          add_ons?: Json | null
          booking_id?: string
          created_at?: string
          driver_details?: Json
          dropoff_datetime?: string
          dropoff_location?: string
          id?: string
          insurance_type?: string | null
          pickup_datetime?: string
          pickup_location?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          booking_id: string
          checked_in_by: string | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
        }
        Insert: {
          booking_id: string
          checked_in_by?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
        }
        Update: {
          booking_id?: string
          checked_in_by?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      check_outs: {
        Row: {
          booking_id: string
          checked_out_at: string
          created_at: string
          id: string
          id_verified: boolean | null
          notes: string | null
          picked_up_by: string | null
          relationship_to_student: string | null
        }
        Insert: {
          booking_id: string
          checked_out_at?: string
          created_at?: string
          id?: string
          id_verified?: boolean | null
          notes?: string | null
          picked_up_by?: string | null
          relationship_to_student?: string | null
        }
        Update: {
          booking_id?: string
          checked_out_at?: string
          created_at?: string
          id?: string
          id_verified?: boolean | null
          notes?: string | null
          picked_up_by?: string | null
          relationship_to_student?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "check_outs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          message_type: string | null
          rich_data: Json | null
          role: string
          session_id: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          message_type?: string | null
          rich_data?: Json | null
          role: string
          session_id: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          message_type?: string | null
          rich_data?: Json | null
          role?: string
          session_id?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "commerce_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      commerce_sessions: {
        Row: {
          context: Json | null
          created_at: string | null
          expires_at: string | null
          external_agent_id: string | null
          held_items: Json | null
          id: string
          session_type: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          expires_at?: string | null
          external_agent_id?: string | null
          held_items?: Json | null
          id?: string
          session_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          expires_at?: string | null
          external_agent_id?: string | null
          held_items?: Json | null
          id?: string
          session_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commerce_sessions_external_agent_id_fkey"
            columns: ["external_agent_id"]
            isOneToOne: false
            referencedRelation: "registered_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commerce_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commission_config: {
        Row: {
          config_key: string
          config_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          min_bookings: number | null
          multiplier: number | null
          rate_type: string | null
          rate_value: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_bookings?: number | null
          multiplier?: number | null
          rate_type?: string | null
          rate_value: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          min_bookings?: number | null
          multiplier?: number | null
          rate_type?: string | null
          rate_value?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      consumer_analytics: {
        Row: {
          created_at: string
          favorite_destinations: Json | null
          id: string
          last_calculated_at: string
          spending_by_category: Json | null
          total_bookings: number | null
          total_spent: number | null
          travel_patterns: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_destinations?: Json | null
          id?: string
          last_calculated_at?: string
          spending_by_category?: Json | null
          total_bookings?: number | null
          total_spent?: number | null
          travel_patterns?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_destinations?: Json | null
          id?: string
          last_calculated_at?: string
          spending_by_category?: Json | null
          total_bookings?: number | null
          total_spent?: number | null
          travel_patterns?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      corporate_accounts: {
        Row: {
          account_number: string | null
          account_status: string
          billing_address: string | null
          company_email: string
          company_name: string
          company_phone: string | null
          created_at: string
          credit_limit: number | null
          current_balance: number | null
          id: string
          last_active_at: string | null
          logo_url: string | null
          payment_terms_days: number | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_status?: string
          billing_address?: string | null
          company_email: string
          company_name: string
          company_phone?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          id?: string
          last_active_at?: string | null
          logo_url?: string | null
          payment_terms_days?: number | null
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_status?: string
          billing_address?: string | null
          company_email?: string
          company_name?: string
          company_phone?: string | null
          created_at?: string
          credit_limit?: number | null
          current_balance?: number | null
          id?: string
          last_active_at?: string | null
          logo_url?: string | null
          payment_terms_days?: number | null
          primary_contact_email?: string
          primary_contact_name?: string
          primary_contact_phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      corporate_bookings: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          booking_id: string
          corporate_account_id: string
          cost_center: string | null
          created_at: string
          employee_id: string
          id: string
          invoice_id: string | null
          invoiced: boolean | null
          policy_id: string | null
          policy_violations: string[] | null
          project_code: string | null
          rejection_reason: string | null
          travel_purpose: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id: string
          corporate_account_id: string
          cost_center?: string | null
          created_at?: string
          employee_id: string
          id?: string
          invoice_id?: string | null
          invoiced?: boolean | null
          policy_id?: string | null
          policy_violations?: string[] | null
          project_code?: string | null
          rejection_reason?: string | null
          travel_purpose?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          booking_id?: string
          corporate_account_id?: string
          cost_center?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          invoice_id?: string | null
          invoiced?: boolean | null
          policy_id?: string | null
          policy_violations?: string[] | null
          project_code?: string | null
          rejection_reason?: string | null
          travel_purpose?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_bookings_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "corporate_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_bookings_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_bookings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "corporate_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_bookings_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "corporate_travel_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_employees: {
        Row: {
          corporate_account_id: string
          created_at: string
          department: string | null
          employee_email: string
          employee_id_number: string | null
          employee_name: string
          employee_phone: string | null
          id: string
          is_active: boolean | null
          is_admin: boolean | null
          job_title: string | null
          travel_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          corporate_account_id: string
          created_at?: string
          department?: string | null
          employee_email: string
          employee_id_number?: string | null
          employee_name: string
          employee_phone?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          job_title?: string | null
          travel_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          corporate_account_id?: string
          created_at?: string
          department?: string | null
          employee_email?: string
          employee_id_number?: string | null
          employee_name?: string
          employee_phone?: string | null
          id?: string
          is_active?: boolean | null
          is_admin?: boolean | null
          job_title?: string | null
          travel_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corporate_employees_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_invoice_items: {
        Row: {
          booking_reference: string | null
          corporate_booking_id: string | null
          created_at: string
          description: string
          employee_name: string | null
          id: string
          invoice_id: string
          quantity: number | null
          total_price: number
          travel_date: string | null
          unit_price: number
        }
        Insert: {
          booking_reference?: string | null
          corporate_booking_id?: string | null
          created_at?: string
          description: string
          employee_name?: string | null
          id?: string
          invoice_id: string
          quantity?: number | null
          total_price: number
          travel_date?: string | null
          unit_price: number
        }
        Update: {
          booking_reference?: string | null
          corporate_booking_id?: string | null
          created_at?: string
          description?: string
          employee_name?: string | null
          id?: string
          invoice_id?: string
          quantity?: number | null
          total_price?: number
          travel_date?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "corporate_invoice_items_corporate_booking_id_fkey"
            columns: ["corporate_booking_id"]
            isOneToOne: false
            referencedRelation: "corporate_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "corporate_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "corporate_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_invoices: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          corporate_account_id: string
          created_at: string
          currency: string | null
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          payment_reference: string | null
          pdf_url: string | null
          status: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          corporate_account_id: string
          created_at?: string
          currency?: string | null
          due_date: string
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          corporate_account_id?: string
          created_at?: string
          currency?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_invoices_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_travel_policies: {
        Row: {
          advance_booking_days: number | null
          allowed_booking_types: string[] | null
          allowed_bus_tiers: string[] | null
          allowed_stay_ratings: number[] | null
          apply_to_tiers: string[] | null
          approval_required_above: number | null
          corporate_account_id: string
          created_at: string
          id: string
          is_default: boolean | null
          max_bus_price: number | null
          max_event_price: number | null
          max_experience_price: number | null
          max_stay_price_per_night: number | null
          max_trip_duration_days: number | null
          max_venue_price: number | null
          max_workspace_price_per_hour: number | null
          policy_name: string
          require_project_code: boolean | null
          require_purpose: boolean | null
          updated_at: string
        }
        Insert: {
          advance_booking_days?: number | null
          allowed_booking_types?: string[] | null
          allowed_bus_tiers?: string[] | null
          allowed_stay_ratings?: number[] | null
          apply_to_tiers?: string[] | null
          approval_required_above?: number | null
          corporate_account_id: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          max_bus_price?: number | null
          max_event_price?: number | null
          max_experience_price?: number | null
          max_stay_price_per_night?: number | null
          max_trip_duration_days?: number | null
          max_venue_price?: number | null
          max_workspace_price_per_hour?: number | null
          policy_name: string
          require_project_code?: boolean | null
          require_purpose?: boolean | null
          updated_at?: string
        }
        Update: {
          advance_booking_days?: number | null
          allowed_booking_types?: string[] | null
          allowed_bus_tiers?: string[] | null
          allowed_stay_ratings?: number[] | null
          apply_to_tiers?: string[] | null
          approval_required_above?: number | null
          corporate_account_id?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          max_bus_price?: number | null
          max_event_price?: number | null
          max_experience_price?: number | null
          max_stay_price_per_night?: number | null
          max_trip_duration_days?: number | null
          max_venue_price?: number | null
          max_workspace_price_per_hour?: number | null
          policy_name?: string
          require_project_code?: boolean | null
          require_purpose?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_travel_policies_corporate_account_id_fkey"
            columns: ["corporate_account_id"]
            isOneToOne: false
            referencedRelation: "corporate_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_history: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_status: string
          id: string
          job_name: string
          result_data: Json | null
          started_at: string
          triggered_by: string
          triggered_by_user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_status: string
          id?: string
          job_name: string
          result_data?: Json | null
          started_at?: string
          triggered_by: string
          triggered_by_user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_status?: string
          id?: string
          job_name?: string
          result_data?: Json | null
          started_at?: string
          triggered_by?: string
          triggered_by_user_id?: string | null
        }
        Relationships: []
      }
      driver_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          created_at: string | null
          description: string | null
          driver_id: string
          earned_at: string | null
          icon: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          created_at?: string | null
          description?: string | null
          driver_id: string
          earned_at?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          created_at?: string | null
          description?: string | null
          driver_id?: string
          earned_at?: string | null
          icon?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_achievements_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string | null
          document_type: string
          driver_id: string
          expires_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          metadata: Json | null
          mime_type: string | null
          rejection_reason: string | null
          status: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          driver_id: string
          expires_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          driver_id?: string
          expires_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          rejection_reason?: string | null
          status?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_earnings: {
        Row: {
          created_at: string
          driver_id: string
          gross_amount: number
          id: string
          net_amount: number
          paid_at: string | null
          payout_reference: string | null
          payout_status: string | null
          platform_fee_amount: number
          platform_fee_percentage: number
          ride_id: string | null
          tip_amount: number | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          gross_amount: number
          id?: string
          net_amount: number
          paid_at?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          platform_fee_amount: number
          platform_fee_percentage?: number
          ride_id?: string | null
          tip_amount?: number | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          gross_amount?: number
          id?: string
          net_amount?: number
          paid_at?: string | null
          payout_reference?: string | null
          payout_status?: string | null
          platform_fee_amount?: number
          platform_fee_percentage?: number
          ride_id?: string | null
          tip_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_earnings_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_earnings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "active_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_streaks: {
        Row: {
          bonus_credits: number
          completed_at: string | null
          created_at: string | null
          current_count: number | null
          driver_id: string
          expires_at: string | null
          id: string
          started_at: string | null
          streak_type: string
          target_count: number
          updated_at: string | null
        }
        Insert: {
          bonus_credits: number
          completed_at?: string | null
          created_at?: string | null
          current_count?: number | null
          driver_id: string
          expires_at?: string | null
          id?: string
          started_at?: string | null
          streak_type: string
          target_count: number
          updated_at?: string | null
        }
        Update: {
          bonus_credits?: number
          completed_at?: string | null
          created_at?: string | null
          current_count?: number | null
          driver_id?: string
          expires_at?: string | null
          id?: string
          started_at?: string | null
          streak_type?: string
          target_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_streaks_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          acceptance_rate: number | null
          account_status: string
          background_check_status: string | null
          base_fare: number | null
          cancellation_rate: number | null
          cancellations_this_week: number | null
          created_at: string
          current_lat: number | null
          current_lng: number | null
          current_ride_id: string | null
          documents: Json | null
          email: string
          fixed_routes: Json | null
          full_name: string
          id: string
          insurance_verified: boolean | null
          is_available: boolean
          is_online: boolean
          last_active_at: string | null
          last_cancellation_reset: string | null
          last_location_update: string | null
          license_plate: string
          license_verified: boolean | null
          merchant_profile_id: string | null
          minimum_fare: number | null
          payout_details: Json | null
          phone: string
          price_per_km: number | null
          profile_photo_url: string | null
          rating: number | null
          service_areas: Json | null
          service_types: string[] | null
          status: string
          suspension_until: string | null
          total_earnings: number | null
          total_rides: number | null
          updated_at: string
          user_id: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_photo_url: string | null
          vehicle_type: string
          vehicle_year: number | null
          wallet_id: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          account_status?: string
          background_check_status?: string | null
          base_fare?: number | null
          cancellation_rate?: number | null
          cancellations_this_week?: number | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_ride_id?: string | null
          documents?: Json | null
          email: string
          fixed_routes?: Json | null
          full_name: string
          id?: string
          insurance_verified?: boolean | null
          is_available?: boolean
          is_online?: boolean
          last_active_at?: string | null
          last_cancellation_reset?: string | null
          last_location_update?: string | null
          license_plate: string
          license_verified?: boolean | null
          merchant_profile_id?: string | null
          minimum_fare?: number | null
          payout_details?: Json | null
          phone: string
          price_per_km?: number | null
          profile_photo_url?: string | null
          rating?: number | null
          service_areas?: Json | null
          service_types?: string[] | null
          status?: string
          suspension_until?: string | null
          total_earnings?: number | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
          vehicle_type?: string
          vehicle_year?: number | null
          wallet_id?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          account_status?: string
          background_check_status?: string | null
          base_fare?: number | null
          cancellation_rate?: number | null
          cancellations_this_week?: number | null
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_ride_id?: string | null
          documents?: Json | null
          email?: string
          fixed_routes?: Json | null
          full_name?: string
          id?: string
          insurance_verified?: boolean | null
          is_available?: boolean
          is_online?: boolean
          last_active_at?: string | null
          last_cancellation_reset?: string | null
          last_location_update?: string | null
          license_plate?: string
          license_verified?: boolean | null
          merchant_profile_id?: string | null
          minimum_fare?: number | null
          payout_details?: Json | null
          phone?: string
          price_per_km?: number | null
          profile_photo_url?: string | null
          rating?: number | null
          service_areas?: Json | null
          service_types?: string[] | null
          status?: string
          suspension_until?: string | null
          total_earnings?: number | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
          vehicle_type?: string
          vehicle_year?: number | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          name: string
          notify_on_ride: boolean | null
          phone: string
          relationship: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          name: string
          notify_on_ride?: boolean | null
          phone: string
          relationship?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          name?: string
          notify_on_ride?: boolean | null
          phone?: string
          relationship?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      escrow_holds: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          dispute_reason: string | null
          disputed_at: string | null
          hold_until: string
          id: string
          merchant_amount: number
          merchant_profile_id: string
          platform_fee_amount: number
          refund_amount: number | null
          refunded_at: string | null
          release_notes: string | null
          released_at: string | null
          service_date: string | null
          status: Database["public"]["Enums"]["escrow_status"] | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          hold_until: string
          id?: string
          merchant_amount: number
          merchant_profile_id: string
          platform_fee_amount?: number
          refund_amount?: number | null
          refunded_at?: string | null
          release_notes?: string | null
          released_at?: string | null
          service_date?: string | null
          status?: Database["public"]["Enums"]["escrow_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          dispute_reason?: string | null
          disputed_at?: string | null
          hold_until?: string
          id?: string
          merchant_amount?: number
          merchant_profile_id?: string
          platform_fee_amount?: number
          refund_amount?: number | null
          refunded_at?: string | null
          release_notes?: string | null
          released_at?: string | null
          service_date?: string | null
          status?: Database["public"]["Enums"]["escrow_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_holds_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holds_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_holds_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_addons: {
        Row: {
          available_quantity: number | null
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          image: string | null
          metadata: Json | null
          name: string
          price: number
          requires_details: boolean | null
          type: string
          updated_at: string | null
        }
        Insert: {
          available_quantity?: number | null
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          image?: string | null
          metadata?: Json | null
          name: string
          price: number
          requires_details?: boolean | null
          type: string
          updated_at?: string | null
        }
        Update: {
          available_quantity?: number | null
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string
          price?: number
          requires_details?: boolean | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_addons_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_pricing_tiers: {
        Row: {
          created_at: string | null
          discount_percentage: number
          event_id: string
          id: string
          tier_name: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string | null
          discount_percentage: number
          event_id: string
          id?: string
          tier_name: string
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string | null
          discount_percentage?: number
          event_id?: string
          id?: string
          tier_name?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_pricing_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_reviews: {
        Row: {
          booking_id: string | null
          comment: string
          created_at: string
          event_id: string
          id: string
          merchant_response: string | null
          rating: number
          responded_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment: string
          created_at?: string
          event_id: string
          id?: string
          merchant_response?: string | null
          rating: number
          responded_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string
          created_at?: string
          event_id?: string
          id?: string
          merchant_response?: string | null
          rating?: number
          responded_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_reviews_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_schedule_items: {
        Row: {
          created_at: string
          day_number: number
          description: string | null
          end_time: string
          event_id: string
          id: string
          item_type: string
          performer_image: string | null
          performer_name: string | null
          stage_id: string | null
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_number?: number
          description?: string | null
          end_time: string
          event_id: string
          id?: string
          item_type?: string
          performer_image?: string | null
          performer_name?: string | null
          stage_id?: string | null
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_number?: number
          description?: string | null
          end_time?: string
          event_id?: string
          id?: string
          item_type?: string
          performer_image?: string | null
          performer_name?: string | null
          stage_id?: string | null
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_schedule_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_schedule_items_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "event_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      event_seats: {
        Row: {
          booking_id: string | null
          created_at: string
          event_id: string
          id: string
          seat_column: number
          seat_number: string
          seat_row: number
          status: string
          ticket_tier_id: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          seat_column: number
          seat_number: string
          seat_row: number
          status?: string
          ticket_tier_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          seat_column?: number
          seat_number?: string
          seat_row?: number
          status?: string
          ticket_tier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_seats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_seats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_seats_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsors: {
        Row: {
          amount_paid: number | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          deliverables: Json | null
          event_id: string
          id: string
          logo_url: string | null
          notes: string | null
          payment_status: string | null
          placement: string[] | null
          sponsor_name: string
          status: string
          tier: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          amount_paid?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deliverables?: Json | null
          event_id: string
          id?: string
          logo_url?: string | null
          notes?: string | null
          payment_status?: string | null
          placement?: string[] | null
          sponsor_name: string
          status?: string
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          amount_paid?: number | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          deliverables?: Json | null
          event_id?: string
          id?: string
          logo_url?: string | null
          notes?: string | null
          payment_status?: string | null
          placement?: string[] | null
          sponsor_name?: string
          status?: string
          tier?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          assigned_gate: string | null
          checked_in_at: string | null
          created_at: string
          credential_code: string | null
          event_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string
          status: string
          updated_at: string
          user_email: string | null
        }
        Insert: {
          assigned_gate?: string | null
          checked_in_at?: string | null
          created_at?: string
          credential_code?: string | null
          event_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_email?: string | null
        }
        Update: {
          assigned_gate?: string | null
          checked_in_at?: string | null
          created_at?: string
          credential_code?: string | null
          event_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_stages: {
        Row: {
          capacity: number | null
          created_at: string
          description: string | null
          event_id: string
          id: string
          location_within_venue: string | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          location_within_venue?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          location_within_venue?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_stages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_ticket_tiers: {
        Row: {
          age_restriction: string | null
          available_tickets: number
          created_at: string
          description: string | null
          event_id: string
          family_pricing: Json | null
          features: Json | null
          id: string
          name: string
          price: number
          requires_student_id: boolean | null
          section_details: Json | null
          student_only: boolean | null
          total_tickets: number
          updated_at: string
          viewing_section: string | null
        }
        Insert: {
          age_restriction?: string | null
          available_tickets: number
          created_at?: string
          description?: string | null
          event_id: string
          family_pricing?: Json | null
          features?: Json | null
          id?: string
          name: string
          price: number
          requires_student_id?: boolean | null
          section_details?: Json | null
          student_only?: boolean | null
          total_tickets: number
          updated_at?: string
          viewing_section?: string | null
        }
        Update: {
          age_restriction?: string | null
          available_tickets?: number
          created_at?: string
          description?: string | null
          event_id?: string
          family_pricing?: Json | null
          features?: Json | null
          id?: string
          name?: string
          price?: number
          requires_student_id?: boolean | null
          section_details?: Json | null
          student_only?: boolean | null
          total_tickets?: number
          updated_at?: string
          viewing_section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_ticket_tiers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_waitlist: {
        Row: {
          created_at: string
          email: string
          event_id: string
          id: string
          notified: boolean
          ticket_tier_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          event_id: string
          id?: string
          notified?: boolean
          ticket_tier_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          notified?: boolean
          ticket_tier_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_waitlist_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_waitlist_ticket_tier_id_fkey"
            columns: ["ticket_tier_id"]
            isOneToOne: false
            referencedRelation: "event_ticket_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          description: string
          end_date: string | null
          event_date: string
          event_instance_number: number | null
          event_time: string
          grade_levels: string[] | null
          id: string
          image: string | null
          images: Json | null
          is_multi_day: boolean | null
          is_recurring: boolean | null
          location: string
          name: string
          number_of_days: number | null
          organizer: string | null
          organizer_code: string | null
          parent_event_id: string | null
          permission_slip_required: boolean | null
          recurrence_days: number[] | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reporting_time: string | null
          school_address: string | null
          school_contact_email: string | null
          school_contact_phone: string | null
          school_name: string | null
          season_name: string | null
          series_id: string | null
          status: string
          supervision_ratio: string | null
          type: string
          updated_at: string
          venue: string
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          description: string
          end_date?: string | null
          event_date: string
          event_instance_number?: number | null
          event_time: string
          grade_levels?: string[] | null
          id?: string
          image?: string | null
          images?: Json | null
          is_multi_day?: boolean | null
          is_recurring?: boolean | null
          location: string
          name: string
          number_of_days?: number | null
          organizer?: string | null
          organizer_code?: string | null
          parent_event_id?: string | null
          permission_slip_required?: boolean | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reporting_time?: string | null
          school_address?: string | null
          school_contact_email?: string | null
          school_contact_phone?: string | null
          school_name?: string | null
          season_name?: string | null
          series_id?: string | null
          status?: string
          supervision_ratio?: string | null
          type: string
          updated_at?: string
          venue: string
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          description?: string
          end_date?: string | null
          event_date?: string
          event_instance_number?: number | null
          event_time?: string
          grade_levels?: string[] | null
          id?: string
          image?: string | null
          images?: Json | null
          is_multi_day?: boolean | null
          is_recurring?: boolean | null
          location?: string
          name?: string
          number_of_days?: number | null
          organizer?: string | null
          organizer_code?: string | null
          parent_event_id?: string | null
          permission_slip_required?: boolean | null
          recurrence_days?: number[] | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reporting_time?: string | null
          school_address?: string | null
          school_contact_email?: string | null
          school_contact_phone?: string | null
          school_name?: string | null
          season_name?: string | null
          series_id?: string | null
          status?: string
          supervision_ratio?: string | null
          type?: string
          updated_at?: string
          venue?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_parent_event_id_fkey"
            columns: ["parent_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string
          expires_at: string
          fetched_at: string
          id: string
          rate: number
          source: string
          target_currency: string
          updated_at: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          rate: number
          source?: string
          target_currency: string
          updated_at?: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          rate?: number
          source?: string
          target_currency?: string
          updated_at?: string
        }
        Relationships: []
      }
      experience_bookings: {
        Row: {
          booking_id: string
          created_at: string
          experience_id: string
          id: string
          is_private: boolean | null
          num_participants: number
          participant_details: Json | null
          schedule_id: string | null
          special_requests: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          experience_id: string
          id?: string
          is_private?: boolean | null
          num_participants?: number
          participant_details?: Json | null
          schedule_id?: string | null
          special_requests?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          experience_id?: string
          id?: string
          is_private?: boolean | null
          num_participants?: number
          participant_details?: Json | null
          schedule_id?: string | null
          special_requests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_bookings_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "experience_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_reviews: {
        Row: {
          booking_id: string | null
          comment: string
          created_at: string
          experience_id: string
          id: string
          merchant_response: string | null
          rating: number
          responded_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string
          created_at?: string
          experience_id: string
          id?: string
          merchant_response?: string | null
          rating: number
          responded_at?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string
          created_at?: string
          experience_id?: string
          id?: string
          merchant_response?: string | null
          rating?: number
          responded_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_reviews_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_schedules: {
        Row: {
          available_spots: number
          created_at: string
          date: string
          experience_id: string
          guide_assigned: string | null
          id: string
          price_override: number | null
          start_time: string
        }
        Insert: {
          available_spots: number
          created_at?: string
          date: string
          experience_id: string
          guide_assigned?: string | null
          id?: string
          price_override?: number | null
          start_time: string
        }
        Update: {
          available_spots?: number
          created_at?: string
          date?: string
          experience_id?: string
          guide_assigned?: string | null
          id?: string
          price_override?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_schedules_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          age_restriction: string | null
          cancellation_policy: string | null
          city: string
          country: string
          created_at: string
          created_by_admin_id: string | null
          description: string | null
          difficulty_level: string | null
          duration_hours: number
          experience_type: string
          id: string
          images: Json | null
          languages: string[] | null
          latitude: number | null
          location: string
          longitude: number | null
          max_participants: number
          meeting_point: string | null
          merchant_profile_id: string
          min_participants: number | null
          name: string
          price_per_person: number
          private_group_price: number | null
          status: string
          updated_at: string
          what_included: string[] | null
          what_to_bring: string[] | null
        }
        Insert: {
          age_restriction?: string | null
          cancellation_policy?: string | null
          city: string
          country: string
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_hours: number
          experience_type: string
          id?: string
          images?: Json | null
          languages?: string[] | null
          latitude?: number | null
          location: string
          longitude?: number | null
          max_participants?: number
          meeting_point?: string | null
          merchant_profile_id: string
          min_participants?: number | null
          name: string
          price_per_person: number
          private_group_price?: number | null
          status?: string
          updated_at?: string
          what_included?: string[] | null
          what_to_bring?: string[] | null
        }
        Update: {
          age_restriction?: string | null
          cancellation_policy?: string | null
          city?: string
          country?: string
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number
          experience_type?: string
          id?: string
          images?: Json | null
          languages?: string[] | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          max_participants?: number
          meeting_point?: string | null
          merchant_profile_id?: string
          min_participants?: number | null
          name?: string
          price_per_person?: number
          private_group_price?: number | null
          status?: string
          updated_at?: string
          what_included?: string[] | null
          what_to_bring?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string | null
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
        }
        Insert: {
          attempted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          attempted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      favorite_properties: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_properties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_workspaces: {
        Row: {
          created_at: string
          id: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_bookings: {
        Row: {
          airline_code: string | null
          arrival_datetime: string
          booking_id: string
          cabin_class: string | null
          created_at: string
          departure_datetime: string
          destination_code: string
          external_booking_ref: string | null
          flight_number: string | null
          id: string
          origin_code: string
          passengers: Json
          provider: string
          segments: Json | null
        }
        Insert: {
          airline_code?: string | null
          arrival_datetime: string
          booking_id: string
          cabin_class?: string | null
          created_at?: string
          departure_datetime: string
          destination_code: string
          external_booking_ref?: string | null
          flight_number?: string | null
          id?: string
          origin_code: string
          passengers: Json
          provider: string
          segments?: Json | null
        }
        Update: {
          airline_code?: string | null
          arrival_datetime?: string
          booking_id?: string
          cabin_class?: string | null
          created_at?: string
          departure_datetime?: string
          destination_code?: string
          external_booking_ref?: string | null
          flight_number?: string | null
          id?: string
          origin_code?: string
          passengers?: Json
          provider?: string
          segments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_searches: {
        Row: {
          cabin_class: string | null
          created_at: string
          departure_date: string
          destination_code: string
          id: string
          origin_code: string
          passengers: Json
          return_date: string | null
          search_results: Json | null
          user_id: string | null
        }
        Insert: {
          cabin_class?: string | null
          created_at?: string
          departure_date: string
          destination_code: string
          id?: string
          origin_code: string
          passengers?: Json
          return_date?: string | null
          search_results?: Json | null
          user_id?: string | null
        }
        Update: {
          cabin_class?: string | null
          created_at?: string
          departure_date?: string
          destination_code?: string
          id?: string
          origin_code?: string
          passengers?: Json
          return_date?: string | null
          search_results?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flight_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_card_transactions: {
        Row: {
          amount: number
          balance_after: number
          booking_id: string | null
          created_at: string
          description: string | null
          gift_card_id: string
          id: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          gift_card_id: string
          id?: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          gift_card_id?: string
          id?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          card_type: string
          code: string
          created_at: string
          created_by_user_id: string | null
          currency: string
          design_template: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          initial_amount: number
          is_digital: boolean
          merchant_profile_id: string | null
          personal_message: string | null
          purchased_at: string
          recipient_email: string | null
          recipient_name: string | null
          recipient_phone: string | null
          redeemed_at: string | null
          redeemed_by_user_id: string | null
          remaining_balance: number
          sender_email: string | null
          sender_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          card_type?: string
          code: string
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          design_template?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          initial_amount: number
          is_digital?: boolean
          merchant_profile_id?: string | null
          personal_message?: string | null
          purchased_at?: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          remaining_balance: number
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          card_type?: string
          code?: string
          created_at?: string
          created_by_user_id?: string | null
          currency?: string
          design_template?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          initial_amount?: number
          is_digital?: boolean
          merchant_profile_id?: string | null
          personal_message?: string | null
          purchased_at?: string
          recipient_email?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          redeemed_at?: string | null
          redeemed_by_user_id?: string | null
          remaining_balance?: number
          sender_email?: string | null
          sender_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_bookings: {
        Row: {
          coordinator_email: string
          coordinator_name: string
          coordinator_phone: string
          created_at: string | null
          discount_percentage: number | null
          group_name: string | null
          id: string
          split_payment: boolean | null
          status: string
          total_tickets: number
          updated_at: string | null
        }
        Insert: {
          coordinator_email: string
          coordinator_name: string
          coordinator_phone: string
          created_at?: string | null
          discount_percentage?: number | null
          group_name?: string | null
          id?: string
          split_payment?: boolean | null
          status?: string
          total_tickets: number
          updated_at?: string | null
        }
        Update: {
          coordinator_email?: string
          coordinator_name?: string
          coordinator_phone?: string
          created_at?: string | null
          discount_percentage?: number | null
          group_name?: string | null
          id?: string
          split_payment?: boolean | null
          status?: string
          total_tickets?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      host_message_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          merchant_profile_id: string
          message: string
          name: string
          template_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          merchant_profile_id: string
          message: string
          name: string
          template_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          merchant_profile_id?: string
          message?: string
          name?: string
          template_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_message_templates_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      host_messages: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          is_automated: boolean | null
          is_read: boolean | null
          message: string
          property_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          is_automated?: boolean | null
          is_read?: boolean | null
          message: string
          property_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          is_automated?: boolean | null
          is_read?: boolean | null
          message?: string
          property_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "host_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_documents: {
        Row: {
          document_type: string
          document_url: string
          id: string
          merchant_profile_id: string
          notes: string | null
          uploaded_at: string
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_type: string
          document_url: string
          id?: string
          merchant_profile_id: string
          notes?: string | null
          uploaded_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_type?: string
          document_url?: string
          id?: string
          merchant_profile_id?: string
          notes?: string | null
          uploaded_at?: string
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_documents_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_account_sequences: {
        Row: {
          country_code: string
          created_at: string | null
          id: string
          last_sequence: number
          role_code: string
          updated_at: string | null
        }
        Insert: {
          country_code: string
          created_at?: string | null
          id?: string
          last_sequence?: number
          role_code: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string | null
          id?: string
          last_sequence?: number
          role_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      merchant_account_status: {
        Row: {
          created_at: string | null
          id: string
          is_suspended: boolean | null
          merchant_profile_id: string
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_suspended?: boolean | null
          merchant_profile_id: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_suspended?: boolean | null
          merchant_profile_id?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_account_status_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: true
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_activity_logs: {
        Row: {
          activity_description: string
          activity_type: string
          created_at: string
          id: string
          merchant_profile_id: string
          metadata: Json | null
        }
        Insert: {
          activity_description: string
          activity_type: string
          created_at?: string
          id?: string
          merchant_profile_id: string
          metadata?: Json | null
        }
        Update: {
          activity_description?: string
          activity_type?: string
          created_at?: string
          id?: string
          merchant_profile_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_activity_logs_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_chat_messages: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_name: string | null
          id: string
          merchant_profile_id: string
          message: string
          metadata: Json | null
          sender_type: string
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_name?: string | null
          id?: string
          merchant_profile_id: string
          message: string
          metadata?: Json | null
          sender_type: string
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_name?: string | null
          id?: string
          merchant_profile_id?: string
          message?: string
          metadata?: Json | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_chat_messages_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_chatbot_settings: {
        Row: {
          auto_response_enabled: boolean | null
          business_hours: Json | null
          created_at: string | null
          faqs: Json | null
          id: string
          merchant_profile_id: string
          response_tone: string | null
          system_prompt: string | null
          updated_at: string | null
        }
        Insert: {
          auto_response_enabled?: boolean | null
          business_hours?: Json | null
          created_at?: string | null
          faqs?: Json | null
          id?: string
          merchant_profile_id: string
          response_tone?: string | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_response_enabled?: boolean | null
          business_hours?: Json | null
          created_at?: string | null
          faqs?: Json | null
          id?: string
          merchant_profile_id?: string
          response_tone?: string | null
          system_prompt?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_chatbot_settings_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: true
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_payment_methods: {
        Row: {
          configuration: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          merchant_profile_id: string
          payment_type: Database["public"]["Enums"]["payment_method_type"]
          updated_at: string
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          merchant_profile_id: string
          payment_type: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          merchant_profile_id?: string
          payment_type?: Database["public"]["Enums"]["payment_method_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_payment_methods_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_payouts: {
        Row: {
          amount: number
          created_at: string | null
          failure_reason: string | null
          fee_deducted: number | null
          id: string
          merchant_profile_id: string
          notes: string | null
          payout_details: Json | null
          payout_method: string
          payout_reference: string | null
          period_end: string | null
          period_start: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["payout_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          failure_reason?: string | null
          fee_deducted?: number | null
          id?: string
          merchant_profile_id: string
          notes?: string | null
          payout_details?: Json | null
          payout_method: string
          payout_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          failure_reason?: string | null
          fee_deducted?: number | null
          id?: string
          merchant_profile_id?: string
          notes?: string | null
          payout_details?: Json | null
          payout_method?: string
          payout_reference?: string | null
          period_end?: string | null
          period_start?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["payout_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_payouts_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_profiles: {
        Row: {
          account_number: string | null
          account_status: string
          agent_code: string | null
          agent_commission_model: string | null
          agent_license_number: string | null
          agent_tier: string | null
          agent_type: string | null
          allow_agent_commission_deduction: boolean | null
          auto_payout_enabled: boolean | null
          business_address: string | null
          business_email: string
          business_name: string
          business_phone: string | null
          commission_rate: number | null
          country_code: string | null
          created_at: string
          created_by_agent_id: string | null
          customer_agent_email: string | null
          customer_agent_name: string | null
          customer_agent_phone: string | null
          escrow_release_days: number | null
          fund_collection_model:
            | Database["public"]["Enums"]["fund_collection_model"]
            | null
          id: string
          last_active_at: string | null
          logo_url: string | null
          onboarding_completed: boolean | null
          payment_details: Json | null
          payout_details: Json | null
          payout_frequency:
            | Database["public"]["Enums"]["payout_frequency"]
            | null
          payout_method: string | null
          referral_code: string | null
          role: Database["public"]["Enums"]["merchant_role"]
          social_media_links: Json | null
          support_email: string | null
          support_phone: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
          website_url: string | null
          whatsapp_number: string | null
        }
        Insert: {
          account_number?: string | null
          account_status?: string
          agent_code?: string | null
          agent_commission_model?: string | null
          agent_license_number?: string | null
          agent_tier?: string | null
          agent_type?: string | null
          allow_agent_commission_deduction?: boolean | null
          auto_payout_enabled?: boolean | null
          business_address?: string | null
          business_email: string
          business_name: string
          business_phone?: string | null
          commission_rate?: number | null
          country_code?: string | null
          created_at?: string
          created_by_agent_id?: string | null
          customer_agent_email?: string | null
          customer_agent_name?: string | null
          customer_agent_phone?: string | null
          escrow_release_days?: number | null
          fund_collection_model?:
            | Database["public"]["Enums"]["fund_collection_model"]
            | null
          id?: string
          last_active_at?: string | null
          logo_url?: string | null
          onboarding_completed?: boolean | null
          payment_details?: Json | null
          payout_details?: Json | null
          payout_frequency?:
            | Database["public"]["Enums"]["payout_frequency"]
            | null
          payout_method?: string | null
          referral_code?: string | null
          role: Database["public"]["Enums"]["merchant_role"]
          social_media_links?: Json | null
          support_email?: string | null
          support_phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          verified_at?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          account_number?: string | null
          account_status?: string
          agent_code?: string | null
          agent_commission_model?: string | null
          agent_license_number?: string | null
          agent_tier?: string | null
          agent_type?: string | null
          allow_agent_commission_deduction?: boolean | null
          auto_payout_enabled?: boolean | null
          business_address?: string | null
          business_email?: string
          business_name?: string
          business_phone?: string | null
          commission_rate?: number | null
          country_code?: string | null
          created_at?: string
          created_by_agent_id?: string | null
          customer_agent_email?: string | null
          customer_agent_name?: string | null
          customer_agent_phone?: string | null
          escrow_release_days?: number | null
          fund_collection_model?:
            | Database["public"]["Enums"]["fund_collection_model"]
            | null
          id?: string
          last_active_at?: string | null
          logo_url?: string | null
          onboarding_completed?: boolean | null
          payment_details?: Json | null
          payout_details?: Json | null
          payout_frequency?:
            | Database["public"]["Enums"]["payout_frequency"]
            | null
          payout_method?: string | null
          referral_code?: string | null
          role?: Database["public"]["Enums"]["merchant_role"]
          social_media_links?: Json | null
          support_email?: string | null
          support_phone?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
          website_url?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_profiles_created_by_agent_id_fkey"
            columns: ["created_by_agent_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      money_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          expires_at: string
          id: string
          paid_transaction_id: string | null
          payer_account_number: string
          payer_user_id: string | null
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string
          id?: string
          paid_transaction_id?: string | null
          payer_account_number: string
          payer_user_id?: string | null
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          expires_at?: string
          id?: string
          paid_transaction_id?: string | null
          payer_account_number?: string
          payer_user_id?: string | null
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          app_booking_confirmation: boolean | null
          app_booking_reminder: boolean | null
          app_promotions: boolean | null
          app_refund_status: boolean | null
          app_reschedule_status: boolean | null
          app_trip_updates: boolean | null
          app_upgrade_status: boolean | null
          created_at: string
          email_booking_confirmation: boolean | null
          email_booking_reminder: boolean | null
          email_promotions: boolean | null
          email_refund_status: boolean | null
          email_reschedule_status: boolean | null
          email_trip_updates: boolean | null
          email_upgrade_status: boolean | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_booking_confirmation?: boolean | null
          app_booking_reminder?: boolean | null
          app_promotions?: boolean | null
          app_refund_status?: boolean | null
          app_reschedule_status?: boolean | null
          app_trip_updates?: boolean | null
          app_upgrade_status?: boolean | null
          created_at?: string
          email_booking_confirmation?: boolean | null
          email_booking_reminder?: boolean | null
          email_promotions?: boolean | null
          email_refund_status?: boolean | null
          email_reschedule_status?: boolean | null
          email_trip_updates?: boolean | null
          email_upgrade_status?: boolean | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_booking_confirmation?: boolean | null
          app_booking_reminder?: boolean | null
          app_promotions?: boolean | null
          app_refund_status?: boolean | null
          app_reschedule_status?: boolean | null
          app_trip_updates?: boolean | null
          app_upgrade_status?: boolean | null
          created_at?: string
          email_booking_confirmation?: boolean | null
          email_booking_reminder?: boolean | null
          email_promotions?: boolean | null
          email_refund_status?: boolean | null
          email_reschedule_status?: boolean | null
          email_trip_updates?: boolean | null
          email_upgrade_status?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_associations: {
        Row: {
          created_at: string
          id: string
          merchant_profile_id: string
          operator_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          merchant_profile_id: string
          operator_name: string
        }
        Update: {
          created_at?: string
          id?: string
          merchant_profile_id?: string
          operator_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_associations_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          amount_per_installment: number
          booking_id: string
          created_at: string | null
          id: string
          installments: number
          next_payment_date: string
          payments_completed: number | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_per_installment: number
          booking_id: string
          created_at?: string | null
          id?: string
          installments: number
          next_payment_date: string
          payments_completed?: number | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount_per_installment?: number
          booking_id?: string
          created_at?: string | null
          id?: string
          installments?: number
          next_payment_date?: string
          payments_completed?: number | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_verifications: {
        Row: {
          booking_id: string | null
          created_at: string | null
          gateway_provider: string
          gateway_reference: string | null
          gateway_response: Json | null
          id: string
          transaction_id: string | null
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          gateway_provider: string
          gateway_reference?: string | null
          gateway_response?: Json | null
          id?: string
          transaction_id?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          gateway_provider?: string
          gateway_reference?: string | null
          gateway_response?: Json | null
          id?: string
          transaction_id?: string | null
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_verifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_verifications_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_items: {
        Row: {
          amount: number
          created_at: string | null
          escrow_hold_id: string | null
          id: string
          payout_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          escrow_hold_id?: string | null
          id?: string
          payout_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          escrow_hold_id?: string | null
          id?: string
          payout_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_escrow_hold_id_fkey"
            columns: ["escrow_hold_id"]
            isOneToOne: false
            referencedRelation: "escrow_holds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "merchant_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_number: string | null
          account_status: string
          address: Json | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          email_verified: boolean | null
          emergency_contacts: Json | null
          full_name: string | null
          gender: string | null
          id: string
          last_active_at: string | null
          loyalty_points: number | null
          loyalty_tier: string | null
          nationality: string | null
          next_of_kin_number: string | null
          passport_number: string | null
          phone: string | null
          phone_verified: boolean | null
          preferences: Json | null
          profile_completion_percentage: number | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          account_number?: string | null
          account_status?: string
          address?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          email_verified?: boolean | null
          emergency_contacts?: Json | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_active_at?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          nationality?: string | null
          next_of_kin_number?: string | null
          passport_number?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          profile_completion_percentage?: number | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          account_number?: string | null
          account_status?: string
          address?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          email_verified?: boolean | null
          emergency_contacts?: Json | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_active_at?: string | null
          loyalty_points?: number | null
          loyalty_tier?: string | null
          nationality?: string | null
          next_of_kin_number?: string | null
          passport_number?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          preferences?: Json | null
          profile_completion_percentage?: number | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      promo_code_usage: {
        Row: {
          booking_id: string | null
          discount_applied: number
          id: string
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          discount_applied?: number
          id?: string
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          discount_applied?: number
          id?: string
          promo_code_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_verticals: string[]
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          first_time_only: boolean
          id: string
          is_active: boolean
          max_discount_amount: number | null
          max_uses: number | null
          max_uses_per_user: number
          min_order_amount: number
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applicable_verticals?: string[]
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_time_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number
          min_order_amount?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applicable_verticals?: string[]
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          first_time_only?: boolean
          id?: string
          is_active?: boolean
          max_discount_amount?: number | null
          max_uses?: number | null
          max_uses_per_user?: number
          min_order_amount?: number
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          check_in_time: string | null
          check_out_time: string | null
          city: string
          country: string
          created_at: string
          created_by_admin_id: string | null
          description: string | null
          id: string
          images: Json | null
          latitude: number | null
          longitude: number | null
          merchant_profile_id: string
          name: string
          policies: Json | null
          property_type: string
          star_rating: number | null
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          city: string
          country: string
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          latitude?: number | null
          longitude?: number | null
          merchant_profile_id: string
          name: string
          policies?: Json | null
          property_type: string
          star_rating?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          city?: string
          country?: string
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          id?: string
          images?: Json | null
          latitude?: number | null
          longitude?: number | null
          merchant_profile_id?: string
          name?: string
          policies?: Json | null
          property_type?: string
          star_rating?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      property_price_alerts: {
        Row: {
          check_in_date: string | null
          check_out_date: string | null
          city: string
          created_at: string
          id: string
          is_active: boolean
          last_notified_at: string | null
          property_type: string | null
          target_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in_date?: string | null
          check_out_date?: string | null
          city: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_notified_at?: string | null
          property_type?: string | null
          target_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in_date?: string | null
          check_out_date?: string | null
          city?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_notified_at?: string | null
          property_type?: string | null
          target_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      property_reviews: {
        Row: {
          booking_id: string | null
          cleanliness_rating: number | null
          comment: string
          created_at: string
          id: string
          location_rating: number | null
          property_id: string
          rating: number
          service_rating: number | null
          title: string
          updated_at: string
          user_id: string | null
          value_rating: number | null
        }
        Insert: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          comment: string
          created_at?: string
          id?: string
          location_rating?: number | null
          property_id: string
          rating: number
          service_rating?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
          value_rating?: number | null
        }
        Update: {
          booking_id?: string | null
          cleanliness_rating?: number | null
          comment?: string
          created_at?: string
          id?: string
          location_rating?: number | null
          property_id?: string
          rating?: number
          service_rating?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
          value_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          device_type: string
          endpoint: string
          id: string
          is_active: boolean
          last_used_at: string | null
          notification_preferences: Json | null
          p256dh_key: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth_key: string
          created_at?: string
          device_type?: string
          endpoint: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          notification_preferences?: Json | null
          p256dh_key: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth_key?: string
          created_at?: string
          device_type?: string
          endpoint?: string
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          notification_preferences?: Json | null
          p256dh_key?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      registered_agents: {
        Row: {
          agent_name: string
          agent_url: string
          api_key_hash: string
          capabilities: string[] | null
          commission_rate: number | null
          created_at: string | null
          id: string
          registered_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agent_name: string
          agent_url: string
          api_key_hash: string
          capabilities?: string[] | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          registered_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          agent_name?: string
          agent_url?: string
          api_key_hash?: string
          capabilities?: string[] | null
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          registered_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registered_agents_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      remittance_orders: {
        Row: {
          completed_at: string | null
          created_at: string
          direction: string
          expected_delivery_at: string | null
          fee_amount: number
          fx_rate: number
          id: string
          notes: string | null
          payment_method: string | null
          payment_reference: string | null
          receive_amount: number
          receive_currency: string
          recipient_country: string
          recipient_details: Json
          recipient_method: string
          recipient_name: string
          reference_code: string
          send_amount: number
          send_currency: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          direction: string
          expected_delivery_at?: string | null
          fee_amount?: number
          fx_rate?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receive_amount: number
          receive_currency: string
          recipient_country: string
          recipient_details?: Json
          recipient_method: string
          recipient_name: string
          reference_code: string
          send_amount: number
          send_currency?: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          direction?: string
          expected_delivery_at?: string | null
          fee_amount?: number
          fx_rate?: number
          id?: string
          notes?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receive_amount?: number
          receive_currency?: string
          recipient_country?: string
          recipient_details?: Json
          recipient_method?: string
          recipient_name?: string
          reference_code?: string
          send_amount?: number
          send_currency?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          bus_id: string | null
          comment: string
          created_at: string
          id: string
          merchant_response: string | null
          operator: string
          rating: number
          responded_at: string | null
          sub_ratings: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          bus_id?: string | null
          comment: string
          created_at?: string
          id?: string
          merchant_response?: string | null
          operator: string
          rating: number
          responded_at?: string | null
          sub_ratings?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          bus_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          merchant_response?: string | null
          operator?: string
          rating?: number
          responded_at?: string | null
          sub_ratings?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_bids: {
        Row: {
          bid_amount: number
          created_at: string
          driver_id: string
          eta_minutes: number
          id: string
          message: string | null
          ride_request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bid_amount: number
          created_at?: string
          driver_id: string
          eta_minutes: number
          id?: string
          message?: string | null
          ride_request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          created_at?: string
          driver_id?: string
          eta_minutes?: number
          id?: string
          message?: string | null
          ride_request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_bids_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_bids_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "available_ride_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_bids_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_cancellations: {
        Row: {
          active_ride_id: string | null
          cancellation_reason: string
          cancellation_time: string | null
          cancelled_by: string
          created_at: string | null
          id: string
          minutes_after_match: number | null
          penalty_applied: boolean | null
          penalty_credits: number | null
          refund_amount: number | null
          ride_request_id: string | null
          ride_status_at_cancel: string
        }
        Insert: {
          active_ride_id?: string | null
          cancellation_reason: string
          cancellation_time?: string | null
          cancelled_by: string
          created_at?: string | null
          id?: string
          minutes_after_match?: number | null
          penalty_applied?: boolean | null
          penalty_credits?: number | null
          refund_amount?: number | null
          ride_request_id?: string | null
          ride_status_at_cancel: string
        }
        Update: {
          active_ride_id?: string | null
          cancellation_reason?: string
          cancellation_time?: string | null
          cancelled_by?: string
          created_at?: string | null
          id?: string
          minutes_after_match?: number | null
          penalty_applied?: boolean | null
          penalty_credits?: number | null
          refund_amount?: number | null
          ride_request_id?: string | null
          ride_status_at_cancel?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_cancellations_active_ride_id_fkey"
            columns: ["active_ride_id"]
            isOneToOne: false
            referencedRelation: "active_rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_cancellations_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "available_ride_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_cancellations_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string | null
          read_at: string | null
          ride_id: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string | null
          read_at?: string | null
          ride_id: string
          sender_id: string
          sender_type: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string | null
          read_at?: string | null
          ride_id?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "active_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_ratings: {
        Row: {
          created_at: string
          id: string
          is_driver_rating: boolean
          ratee_id: string
          rater_id: string
          rating: number
          review_text: string | null
          ride_id: string
          tags: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_driver_rating: boolean
          ratee_id: string
          rater_id: string
          rating: number
          review_text?: string | null
          ride_id: string
          tags?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          is_driver_rating?: boolean
          ratee_id?: string
          rater_id?: string
          rating?: number
          review_text?: string | null
          ride_id?: string
          tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_ratings_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "active_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_receipts: {
        Row: {
          base_fare: number
          created_at: string
          currency: string | null
          distance_fare: number
          distance_km: number | null
          driver_name: string
          dropoff_address: string
          dropoff_time: string | null
          duration_mins: number | null
          id: string
          passenger_email: string | null
          passenger_name: string
          payment_method: string
          payment_status: string
          pdf_url: string | null
          pickup_address: string
          pickup_time: string | null
          receipt_number: string
          ride_id: string
          surge_amount: number | null
          time_fare: number
          tip_amount: number | null
          total_amount: number
        }
        Insert: {
          base_fare: number
          created_at?: string
          currency?: string | null
          distance_fare: number
          distance_km?: number | null
          driver_name: string
          dropoff_address: string
          dropoff_time?: string | null
          duration_mins?: number | null
          id?: string
          passenger_email?: string | null
          passenger_name: string
          payment_method: string
          payment_status: string
          pdf_url?: string | null
          pickup_address: string
          pickup_time?: string | null
          receipt_number: string
          ride_id: string
          surge_amount?: number | null
          time_fare: number
          tip_amount?: number | null
          total_amount: number
        }
        Update: {
          base_fare?: number
          created_at?: string
          currency?: string | null
          distance_fare?: number
          distance_km?: number | null
          driver_name?: string
          dropoff_address?: string
          dropoff_time?: string | null
          duration_mins?: number | null
          id?: string
          passenger_email?: string | null
          passenger_name?: string
          payment_method?: string
          payment_status?: string
          pdf_url?: string | null
          pickup_address?: string
          pickup_time?: string | null
          receipt_number?: string
          ride_id?: string
          surge_amount?: number | null
          time_fare?: number
          tip_amount?: number | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "ride_receipts_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "active_rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_requests: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string
          currency: string | null
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          estimated_distance_km: number
          estimated_duration_mins: number
          expires_at: string | null
          final_price: number | null
          id: string
          matched_driver_id: string | null
          passenger_id: string | null
          passenger_name: string
          passenger_offered_price: number | null
          passenger_phone: string
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          preferences: Json | null
          pricing_mode: string
          promo_code_id: string | null
          recipient_name: string | null
          recipient_phone: string | null
          route_polyline: string | null
          status: string
          surge_multiplier: number | null
          system_estimated_price: number
          updated_at: string
          vehicle_type: string | null
          waypoints: Json | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          currency?: string | null
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          estimated_distance_km: number
          estimated_duration_mins: number
          expires_at?: string | null
          final_price?: number | null
          id?: string
          matched_driver_id?: string | null
          passenger_id?: string | null
          passenger_name: string
          passenger_offered_price?: number | null
          passenger_phone: string
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          preferences?: Json | null
          pricing_mode?: string
          promo_code_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          route_polyline?: string | null
          status?: string
          surge_multiplier?: number | null
          system_estimated_price: number
          updated_at?: string
          vehicle_type?: string | null
          waypoints?: Json | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string
          currency?: string | null
          dropoff_address?: string
          dropoff_lat?: number
          dropoff_lng?: number
          estimated_distance_km?: number
          estimated_duration_mins?: number
          expires_at?: string | null
          final_price?: number | null
          id?: string
          matched_driver_id?: string | null
          passenger_id?: string | null
          passenger_name?: string
          passenger_offered_price?: number | null
          passenger_phone?: string
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          preferences?: Json | null
          pricing_mode?: string
          promo_code_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          route_polyline?: string | null
          status?: string
          surge_multiplier?: number | null
          system_estimated_price?: number
          updated_at?: string
          vehicle_type?: string | null
          waypoints?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_matched_driver_id_fkey"
            columns: ["matched_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      room_availability: {
        Row: {
          available_units: number
          created_at: string
          date: string
          id: string
          min_stay: number | null
          price_override: number | null
          room_id: string
        }
        Insert: {
          available_units: number
          created_at?: string
          date: string
          id?: string
          min_stay?: number | null
          price_override?: number | null
          room_id: string
        }
        Update: {
          available_units?: number
          created_at?: string
          date?: string
          id?: string
          min_stay?: number | null
          price_override?: number | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[] | null
          base_price: number
          bed_configuration: Json | null
          cleaning_fee: number | null
          created_at: string
          description: string | null
          id: string
          images: Json | null
          max_guests: number
          name: string
          property_id: string
          quantity: number
          room_type: string
          size_sqm: number | null
          status: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          base_price: number
          bed_configuration?: Json | null
          cleaning_fee?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          max_guests?: number
          name: string
          property_id: string
          quantity?: number
          room_type: string
          size_sqm?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          base_price?: number
          bed_configuration?: Json | null
          cleaning_fee?: number | null
          created_at?: string
          description?: string | null
          id?: string
          images?: Json | null
          max_guests?: number
          name?: string
          property_id?: string
          quantity?: number
          room_type?: string
          size_sqm?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_locations: {
        Row: {
          address: string
          created_at: string
          icon: string | null
          id: string
          is_default: boolean | null
          label: string
          lat: number
          lng: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          lat: number
          lng: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          icon?: string | null
          id?: string
          is_default?: boolean | null
          label?: string
          lat?: number
          lng?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_routes: {
        Row: {
          created_at: string
          from_location: string
          id: string
          nickname: string | null
          to_location: string
          user_id: string
        }
        Insert: {
          created_at?: string
          from_location: string
          id?: string
          nickname?: string | null
          to_location: string
          user_id: string
        }
        Update: {
          created_at?: string
          from_location?: string
          id?: string
          nickname?: string | null
          to_location?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_routes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_payments: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          currency: string
          description: string | null
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          last_run: string | null
          next_run: string
          recipient_account_number: string | null
          recipient_name: string
          run_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          next_run: string
          recipient_account_number?: string | null
          recipient_name: string
          run_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          next_run?: string
          recipient_account_number?: string | null
          recipient_name?: string
          run_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_rides: {
        Row: {
          created_at: string
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          id: string
          notes: string | null
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          pricing_mode: string | null
          reminder_sent: boolean | null
          ride_request_id: string | null
          scheduled_time: string
          status: string | null
          updated_at: string
          user_id: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          dropoff_address: string
          dropoff_lat: number
          dropoff_lng: number
          id?: string
          notes?: string | null
          pickup_address: string
          pickup_lat: number
          pickup_lng: number
          pricing_mode?: string | null
          reminder_sent?: boolean | null
          ride_request_id?: string | null
          scheduled_time: string
          status?: string | null
          updated_at?: string
          user_id: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          dropoff_address?: string
          dropoff_lat?: number
          dropoff_lng?: number
          id?: string
          notes?: string | null
          pickup_address?: string
          pickup_lat?: number
          pickup_lng?: number
          pricing_mode?: string | null
          reminder_sent?: boolean | null
          ride_request_id?: string | null
          scheduled_time?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_rides_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "available_ride_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_rides_ride_request_id_fkey"
            columns: ["ride_request_id"]
            isOneToOne: false
            referencedRelation: "ride_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_pricing_rules: {
        Row: {
          adjustment: number
          created_at: string
          days_of_week: number[] | null
          end_date: string
          id: string
          is_active: boolean
          min_stay: number | null
          name: string
          price_multiplier: number
          property_id: string
          room_ids: string[] | null
          rule_type: string
          start_date: string
          updated_at: string
        }
        Insert: {
          adjustment?: number
          created_at?: string
          days_of_week?: number[] | null
          end_date: string
          id?: string
          is_active?: boolean
          min_stay?: number | null
          name: string
          price_multiplier?: number
          property_id: string
          room_ids?: string[] | null
          rule_type?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          adjustment?: number
          created_at?: string
          days_of_week?: number[] | null
          end_date?: string
          id?: string
          is_active?: boolean
          min_stay?: number | null
          name?: string
          price_multiplier?: number
          property_id?: string
          room_ids?: string[] | null
          rule_type?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_pricing_rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          booking_id: string | null
          bus_schedule_id: string
          created_at: string | null
          id: string
          seat_column: number
          seat_number: string
          seat_row: number
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          bus_schedule_id: string
          created_at?: string | null
          id?: string
          seat_column: number
          seat_number: string
          seat_row: number
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          bus_schedule_id?: string
          created_at?: string | null
          id?: string
          seat_column?: number
          seat_number?: string
          seat_row?: number
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seats_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seats_bus_schedule_id_fkey"
            columns: ["bus_schedule_id"]
            isOneToOne: false
            referencedRelation: "bus_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          context: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          recipient_phone: string
          reference_id: string | null
          sendai_message_id: string | null
          sender_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          recipient_phone: string
          reference_id?: string | null
          sendai_message_id?: string | null
          sender_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          recipient_phone?: string
          reference_id?: string | null
          sendai_message_id?: string | null
          sender_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sms_otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          phone: string
          purpose: string
          verified: boolean
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          phone: string
          purpose?: string
          verified?: boolean
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          phone?: string
          purpose?: string
          verified?: boolean
        }
        Relationships: []
      }
      split_bill_participants: {
        Row: {
          amount_owed: number
          amount_paid: number
          created_at: string
          id: string
          paid_at: string | null
          participant_account_number: string | null
          participant_name: string
          participant_user_id: string | null
          split_bill_id: string
          status: string
        }
        Insert: {
          amount_owed: number
          amount_paid?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          participant_account_number?: string | null
          participant_name: string
          participant_user_id?: string | null
          split_bill_id: string
          status?: string
        }
        Update: {
          amount_owed?: number
          amount_paid?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          participant_account_number?: string | null
          participant_name?: string
          participant_user_id?: string | null
          split_bill_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "split_bill_participants_split_bill_id_fkey"
            columns: ["split_bill_id"]
            isOneToOne: false
            referencedRelation: "split_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      split_bills: {
        Row: {
          category: string | null
          created_at: string
          creator_user_id: string
          currency: string
          description: string | null
          id: string
          status: string
          title: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          creator_user_id: string
          currency?: string
          description?: string | null
          id?: string
          status?: string
          title: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          creator_user_id?: string
          currency?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      split_payment_contributions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paid_at: string | null
          participant_email: string
          participant_name: string | null
          payment_link: string | null
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          split_request_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          participant_email: string
          participant_name?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          split_request_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paid_at?: string | null
          participant_email?: string
          participant_name?: string | null
          payment_link?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          split_request_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_payment_contributions_split_request_id_fkey"
            columns: ["split_request_id"]
            isOneToOne: false
            referencedRelation: "split_payment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      split_payment_requests: {
        Row: {
          amount_per_person: number
          booking_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          num_participants: number
          organizer_email: string
          organizer_user_id: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          amount_per_person: number
          booking_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          num_participants: number
          organizer_email: string
          organizer_user_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          amount_per_person?: number
          booking_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          num_participants?: number
          organizer_email?: string
          organizer_user_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "split_payment_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsored_telegram_ads: {
        Row: {
          body: string
          budget_remaining: number | null
          cost_per_send: number | null
          created_at: string | null
          cta_url: string | null
          end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          merchant_profile_id: string | null
          start_date: string | null
          target_roles: string[] | null
          title: string
          total_sends: number | null
          video_url: string | null
        }
        Insert: {
          body: string
          budget_remaining?: number | null
          cost_per_send?: number | null
          created_at?: string | null
          cta_url?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          merchant_profile_id?: string | null
          start_date?: string | null
          target_roles?: string[] | null
          title: string
          total_sends?: number | null
          video_url?: string | null
        }
        Update: {
          body?: string
          budget_remaining?: number | null
          cost_per_send?: number | null
          created_at?: string | null
          cta_url?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          merchant_profile_id?: string | null
          start_date?: string | null
          target_roles?: string[] | null
          title?: string
          total_sends?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsored_telegram_ads_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_bookings: {
        Row: {
          booking_id: string
          check_in_date: string
          check_out_date: string
          created_at: string
          guest_details: Json | null
          id: string
          num_guests: number
          num_rooms: number
          property_id: string
          room_id: string
          special_requests: string | null
        }
        Insert: {
          booking_id: string
          check_in_date: string
          check_out_date: string
          created_at?: string
          guest_details?: Json | null
          id?: string
          num_guests?: number
          num_rooms?: number
          property_id: string
          room_id: string
          special_requests?: string | null
        }
        Update: {
          booking_id?: string
          check_in_date?: string
          check_out_date?: string
          created_at?: string
          guest_details?: Json | null
          id?: string
          num_guests?: number
          num_rooms?: number
          property_id?: string
          room_id?: string
          special_requests?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stay_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stay_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          sender_id: string
          sender_type: string
          stay_booking_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          sender_id: string
          sender_type: string
          stay_booking_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          sender_id?: string
          sender_type?: string
          stay_booking_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stay_messages_stay_booking_id_fkey"
            columns: ["stay_booking_id"]
            isOneToOne: false
            referencedRelation: "stay_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      stay_special_requests: {
        Row: {
          additional_charge: number | null
          created_at: string
          id: string
          notes: string | null
          request_type: string
          requested_time: string | null
          responded_at: string | null
          response_notes: string | null
          status: string
          stay_booking_id: string
          updated_at: string
        }
        Insert: {
          additional_charge?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          request_type: string
          requested_time?: string | null
          responded_at?: string | null
          response_notes?: string | null
          status?: string
          stay_booking_id: string
          updated_at?: string
        }
        Update: {
          additional_charge?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          request_type?: string
          requested_time?: string | null
          responded_at?: string | null
          response_notes?: string | null
          status?: string
          stay_booking_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stay_special_requests_stay_booking_id_fkey"
            columns: ["stay_booking_id"]
            isOneToOne: false
            referencedRelation: "stay_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          merchant_profile_id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          merchant_profile_id: string
          priority: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          merchant_profile_id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      surge_zones: {
        Row: {
          active_drivers: number | null
          active_requests: number | null
          center_lat: number
          center_lng: number
          current_multiplier: number | null
          id: string
          radius_km: number
          updated_at: string
          zone_name: string
        }
        Insert: {
          active_drivers?: number | null
          active_requests?: number | null
          center_lat: number
          center_lng: number
          current_multiplier?: number | null
          id?: string
          radius_km?: number
          updated_at?: string
          zone_name: string
        }
        Update: {
          active_drivers?: number | null
          active_requests?: number | null
          center_lat?: number
          center_lng?: number
          current_multiplier?: number | null
          id?: string
          radius_km?: number
          updated_at?: string
          zone_name?: string
        }
        Relationships: []
      }
      telegram_bot_state: {
        Row: {
          id: number
          update_offset: number
          updated_at: string
        }
        Insert: {
          id: number
          update_offset?: number
          updated_at?: string
        }
        Update: {
          id?: number
          update_offset?: number
          updated_at?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          chat_id: number
          created_at: string
          processed: boolean
          raw_update: Json
          text: string | null
          update_id: number
        }
        Insert: {
          chat_id: number
          created_at?: string
          processed?: boolean
          raw_update: Json
          text?: string | null
          update_id: number
        }
        Update: {
          chat_id?: number
          created_at?: string
          processed?: boolean
          raw_update?: Json
          text?: string | null
          update_id?: number
        }
        Relationships: []
      }
      telegram_promo_log: {
        Row: {
          chat_id: number
          created_at: string
          id: string
          promo_title: string | null
          role_targeted: string | null
          sent_date: string
          slot: string
          user_id: string | null
        }
        Insert: {
          chat_id: number
          created_at?: string
          id?: string
          promo_title?: string | null
          role_targeted?: string | null
          sent_date: string
          slot: string
          user_id?: string | null
        }
        Update: {
          chat_id?: number
          created_at?: string
          id?: string
          promo_title?: string | null
          role_targeted?: string | null
          sent_date?: string
          slot?: string
          user_id?: string | null
        }
        Relationships: []
      }
      telegram_sessions: {
        Row: {
          chat_id: number
          context: Json
          created_at: string
          expires_at: string
          id: string
          session_type: string
          updated_at: string
        }
        Insert: {
          chat_id: number
          context?: Json
          created_at?: string
          expires_at?: string
          id?: string
          session_type?: string
          updated_at?: string
        }
        Update: {
          chat_id?: number
          context?: Json
          created_at?: string
          expires_at?: string
          id?: string
          session_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_user_links: {
        Row: {
          created_at: string
          id: string
          link_code: string | null
          link_code_expires_at: string | null
          notification_preferences: Json
          status: string
          telegram_chat_id: number
          telegram_username: string | null
          updated_at: string
          user_id: string
          user_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_code?: string | null
          link_code_expires_at?: string | null
          notification_preferences?: Json
          status?: string
          telegram_chat_id: number
          telegram_username?: string | null
          updated_at?: string
          user_id: string
          user_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          link_code?: string | null
          link_code_expires_at?: string | null
          notification_preferences?: Json
          status?: string
          telegram_chat_id?: number
          telegram_username?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_admin_response: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_admin_response?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_admin_response?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_shares: {
        Row: {
          accessed_count: number | null
          booking_id: string | null
          created_at: string | null
          expires_at: string
          id: string
          share_token: string
          share_type: string
          updated_at: string | null
        }
        Insert: {
          accessed_count?: number | null
          booking_id?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          share_token: string
          share_type: string
          updated_at?: string | null
        }
        Update: {
          accessed_count?: number | null
          booking_id?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          share_token?: string
          share_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_shares_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          agent_commission_deducted: boolean | null
          agent_payment_method: string | null
          agent_remittance_amount: number | null
          amount: number
          booked_by_agent_id: string | null
          booking_id: string
          created_at: string
          id: string
          merchant_amount: number
          merchant_profile_id: string
          payment_metadata: Json | null
          payment_method: string
          payment_proof_url: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          platform_fee_amount: number
          platform_fee_percentage: number
          service_fee_amount: number | null
          transaction_reference: string | null
          updated_at: string
          user_total_charged: number | null
        }
        Insert: {
          agent_commission_deducted?: boolean | null
          agent_payment_method?: string | null
          agent_remittance_amount?: number | null
          amount: number
          booked_by_agent_id?: string | null
          booking_id: string
          created_at?: string
          id?: string
          merchant_amount: number
          merchant_profile_id: string
          payment_metadata?: Json | null
          payment_method: string
          payment_proof_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_fee_amount: number
          platform_fee_percentage: number
          service_fee_amount?: number | null
          transaction_reference?: string | null
          updated_at?: string
          user_total_charged?: number | null
        }
        Update: {
          agent_commission_deducted?: boolean | null
          agent_payment_method?: string | null
          agent_remittance_amount?: number | null
          amount?: number
          booked_by_agent_id?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          merchant_amount?: number
          merchant_profile_id?: string
          payment_metadata?: Json | null
          payment_method?: string
          payment_proof_url?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          platform_fee_amount?: number
          platform_fee_percentage?: number
          service_fee_amount?: number | null
          transaction_reference?: string | null
          updated_at?: string
          user_total_charged?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booked_by_agent_id_fkey"
            columns: ["booked_by_agent_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_bookings: {
        Row: {
          booking_id: string
          created_at: string
          driver_assigned: string | null
          dropoff_location: string
          flight_number: string | null
          id: string
          meet_and_greet: boolean | null
          num_luggage: number | null
          num_passengers: number
          pickup_datetime: string
          pickup_location: string
          special_requirements: string | null
          transfer_service_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          driver_assigned?: string | null
          dropoff_location: string
          flight_number?: string | null
          id?: string
          meet_and_greet?: boolean | null
          num_luggage?: number | null
          num_passengers?: number
          pickup_datetime: string
          pickup_location: string
          special_requirements?: string | null
          transfer_service_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          driver_assigned?: string | null
          dropoff_location?: string
          flight_number?: string | null
          id?: string
          meet_and_greet?: boolean | null
          num_luggage?: number | null
          num_passengers?: number
          pickup_datetime?: string
          pickup_location?: string
          special_requirements?: string | null
          transfer_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_bookings_transfer_service_id_fkey"
            columns: ["transfer_service_id"]
            isOneToOne: false
            referencedRelation: "transfer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_pricing: {
        Row: {
          created_at: string
          fixed_price: number | null
          from_zone_id: string | null
          id: string
          to_zone_id: string | null
          transfer_service_id: string
        }
        Insert: {
          created_at?: string
          fixed_price?: number | null
          from_zone_id?: string | null
          id?: string
          to_zone_id?: string | null
          transfer_service_id: string
        }
        Update: {
          created_at?: string
          fixed_price?: number | null
          from_zone_id?: string | null
          id?: string
          to_zone_id?: string | null
          transfer_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_pricing_from_zone_id_fkey"
            columns: ["from_zone_id"]
            isOneToOne: false
            referencedRelation: "transfer_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_pricing_to_zone_id_fkey"
            columns: ["to_zone_id"]
            isOneToOne: false
            referencedRelation: "transfer_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_pricing_transfer_service_id_fkey"
            columns: ["transfer_service_id"]
            isOneToOne: false
            referencedRelation: "transfer_services"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_requests: {
        Row: {
          assigned_driver_id: string | null
          assigned_vehicle_id: string | null
          booking_type: string
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          currency: string | null
          distance_km: number | null
          driver_assigned_at: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_location: string
          dropoff_time: string | null
          duration_minutes: number | null
          flight_number: string | null
          flight_status: string | null
          id: string
          meet_and_greet: boolean | null
          merchant_profile_id: string | null
          num_luggage: number | null
          num_passengers: number
          passenger_email: string | null
          passenger_name: string | null
          passenger_phone: string | null
          payment_method: string | null
          payment_status: string | null
          pickup_datetime: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location: string
          pickup_time: string | null
          price_final: number | null
          price_quoted: number | null
          scheduled_datetime: string | null
          service_type: string
          special_requirements: string | null
          status: string
          terminal: string | null
          updated_at: string
          user_id: string | null
          vehicle_category: string
        }
        Insert: {
          assigned_driver_id?: string | null
          assigned_vehicle_id?: string | null
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string | null
          distance_km?: number | null
          driver_assigned_at?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location: string
          dropoff_time?: string | null
          duration_minutes?: number | null
          flight_number?: string | null
          flight_status?: string | null
          id?: string
          meet_and_greet?: boolean | null
          merchant_profile_id?: string | null
          num_luggage?: number | null
          num_passengers?: number
          passenger_email?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_datetime?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location: string
          pickup_time?: string | null
          price_final?: number | null
          price_quoted?: number | null
          scheduled_datetime?: string | null
          service_type?: string
          special_requirements?: string | null
          status?: string
          terminal?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_category?: string
        }
        Update: {
          assigned_driver_id?: string | null
          assigned_vehicle_id?: string | null
          booking_type?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          currency?: string | null
          distance_km?: number | null
          driver_assigned_at?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location?: string
          dropoff_time?: string | null
          duration_minutes?: number | null
          flight_number?: string | null
          flight_status?: string | null
          id?: string
          meet_and_greet?: boolean | null
          merchant_profile_id?: string | null
          num_luggage?: number | null
          num_passengers?: number
          passenger_email?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_datetime?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string
          pickup_time?: string | null
          price_final?: number | null
          price_quoted?: number | null
          scheduled_datetime?: string | null
          service_type?: string
          special_requirements?: string | null
          status?: string
          terminal?: string | null
          updated_at?: string
          user_id?: string | null
          vehicle_category?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_requests_assigned_driver_id_fkey"
            columns: ["assigned_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_services: {
        Row: {
          amenities: string[] | null
          base_price: number
          created_at: string
          id: string
          images: Json | null
          max_luggage: number | null
          max_passengers: number
          merchant_profile_id: string
          name: string
          price_per_km: number | null
          service_areas: Json | null
          service_type: string
          status: string
          updated_at: string
          vehicle_type: string
        }
        Insert: {
          amenities?: string[] | null
          base_price: number
          created_at?: string
          id?: string
          images?: Json | null
          max_luggage?: number | null
          max_passengers?: number
          merchant_profile_id: string
          name: string
          price_per_km?: number | null
          service_areas?: Json | null
          service_type: string
          status?: string
          updated_at?: string
          vehicle_type: string
        }
        Update: {
          amenities?: string[] | null
          base_price?: number
          created_at?: string
          id?: string
          images?: Json | null
          max_luggage?: number | null
          max_passengers?: number
          merchant_profile_id?: string
          name?: string
          price_per_km?: number | null
          service_areas?: Json | null
          service_type?: string
          status?: string
          updated_at?: string
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_services_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_vehicles: {
        Row: {
          amenities: string[] | null
          color: string | null
          created_at: string
          current_location_lat: number | null
          current_location_lng: number | null
          driver_id: string | null
          id: string
          is_available: boolean | null
          license_plate: string
          make: string
          max_luggage: number | null
          max_passengers: number
          merchant_profile_id: string
          model: string
          photos: string[] | null
          status: string
          updated_at: string
          vehicle_category: string
          year: number | null
        }
        Insert: {
          amenities?: string[] | null
          color?: string | null
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          driver_id?: string | null
          id?: string
          is_available?: boolean | null
          license_plate: string
          make: string
          max_luggage?: number | null
          max_passengers?: number
          merchant_profile_id: string
          model: string
          photos?: string[] | null
          status?: string
          updated_at?: string
          vehicle_category: string
          year?: number | null
        }
        Update: {
          amenities?: string[] | null
          color?: string | null
          created_at?: string
          current_location_lat?: number | null
          current_location_lng?: number | null
          driver_id?: string | null
          id?: string
          is_available?: boolean | null
          license_plate?: string
          make?: string
          max_luggage?: number | null
          max_passengers?: number
          merchant_profile_id?: string
          model?: string
          photos?: string[] | null
          status?: string
          updated_at?: string
          vehicle_category?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_vehicles_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_zone_pricing: {
        Row: {
          coach_price: number | null
          created_at: string
          currency: string | null
          economy_sedan_price: number | null
          from_zone_name: string
          from_zone_type: string | null
          id: string
          is_active: boolean | null
          limousine_price: number | null
          luxury_sedan_price: number | null
          luxury_suv_price: number | null
          merchant_profile_id: string
          minibus_price: number | null
          sedan_price: number | null
          suv_price: number | null
          to_zone_name: string
          to_zone_type: string | null
          updated_at: string
          van_price: number | null
        }
        Insert: {
          coach_price?: number | null
          created_at?: string
          currency?: string | null
          economy_sedan_price?: number | null
          from_zone_name: string
          from_zone_type?: string | null
          id?: string
          is_active?: boolean | null
          limousine_price?: number | null
          luxury_sedan_price?: number | null
          luxury_suv_price?: number | null
          merchant_profile_id: string
          minibus_price?: number | null
          sedan_price?: number | null
          suv_price?: number | null
          to_zone_name: string
          to_zone_type?: string | null
          updated_at?: string
          van_price?: number | null
        }
        Update: {
          coach_price?: number | null
          created_at?: string
          currency?: string | null
          economy_sedan_price?: number | null
          from_zone_name?: string
          from_zone_type?: string | null
          id?: string
          is_active?: boolean | null
          limousine_price?: number | null
          luxury_sedan_price?: number | null
          luxury_suv_price?: number | null
          merchant_profile_id?: string
          minibus_price?: number | null
          sedan_price?: number | null
          suv_price?: number | null
          to_zone_name?: string
          to_zone_type?: string | null
          updated_at?: string
          van_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transfer_zone_pricing_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transfer_zones: {
        Row: {
          coordinates: Json | null
          created_at: string
          id: string
          merchant_profile_id: string
          zone_name: string
          zone_type: string
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string
          id?: string
          merchant_profile_id: string
          zone_name: string
          zone_type: string
        }
        Update: {
          coordinates?: Json | null
          created_at?: string
          id?: string
          merchant_profile_id?: string
          zone_name?: string
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_zones_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          item_id: string
          item_snapshot: Json
          quantity: number
          total_price: number
          unit_price: number
          updated_at: string
          vertical: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          item_id: string
          item_snapshot?: Json
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
          vertical: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_snapshot?: Json
          quantity?: number
          total_price?: number
          unit_price?: number
          updated_at?: string
          vertical?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "trip_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_carts: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_kyc_documents: {
        Row: {
          document_label: string
          document_type: string
          document_url: string
          entity_id: string | null
          entity_type: string
          expires_at: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          document_label: string
          document_type: string
          document_url: string
          entity_id?: string | null
          entity_type: string
          expires_at?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          document_label?: string
          document_type?: string
          document_url?: string
          entity_id?: string | null
          entity_type?: string
          expires_at?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_kyc_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          action_url: string | null
          attachment_url: string | null
          category: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          attachment_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          attachment_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_saved_payment_methods: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          is_default: boolean | null
          masked_reference: string | null
          metadata: Json | null
          payment_type: string
          provider: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_default?: boolean | null
          masked_reference?: string | null
          metadata?: Json | null
          payment_type: string
          provider?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_default?: boolean | null
          masked_reference?: string | null
          metadata?: Json | null
          payment_type?: string
          provider?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_vouchers: {
        Row: {
          applicable_verticals: string[]
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_discount_amount: number | null
          min_order_amount: number
          source: string
          source_reference_id: string | null
          status: string
          updated_at: string
          used_at: string | null
          used_on_booking_id: string | null
          user_id: string
        }
        Insert: {
          applicable_verticals?: string[]
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount_amount?: number | null
          min_order_amount?: number
          source?: string
          source_reference_id?: string | null
          status?: string
          updated_at?: string
          used_at?: string | null
          used_on_booking_id?: string | null
          user_id: string
        }
        Update: {
          applicable_verticals?: string[]
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount_amount?: number | null
          min_order_amount?: number
          source?: string
          source_reference_id?: string | null
          status?: string
          updated_at?: string
          used_at?: string | null
          used_on_booking_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_vouchers_used_on_booking_id_fkey"
            columns: ["used_on_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_reference: string | null
          transaction_type: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_reference?: string | null
          transaction_type: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          booking_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_reference?: string | null
          transaction_type?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallet_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          auto_topup_amount: number | null
          auto_topup_enabled: boolean | null
          auto_topup_threshold: number | null
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          lifetime_earned: number | null
          lifetime_spent: number | null
          rewards_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_topup_amount?: number | null
          auto_topup_enabled?: boolean | null
          auto_topup_threshold?: number | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          lifetime_earned?: number | null
          lifetime_spent?: number | null
          rewards_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_topup_amount?: number | null
          auto_topup_enabled?: boolean | null
          auto_topup_threshold?: number | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          lifetime_earned?: number | null
          lifetime_spent?: number | null
          rewards_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vault_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          transaction_type: string
          user_id: string
          vault_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type: string
          user_id: string
          vault_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vault_transactions_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      vaults: {
        Row: {
          color: string | null
          created_at: string
          currency: string
          current_amount: number
          icon: string | null
          id: string
          is_locked: boolean
          name: string
          round_up_enabled: boolean
          target_amount: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          icon?: string | null
          id?: string
          is_locked?: boolean
          name: string
          round_up_enabled?: boolean
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          currency?: string
          current_amount?: number
          icon?: string | null
          id?: string
          is_locked?: boolean
          name?: string
          round_up_enabled?: boolean
          target_amount?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicle_availability: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_available: boolean
          price_override: number | null
          start_date: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_available?: boolean
          price_override?: number | null
          start_date: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_available?: boolean
          price_override?: number | null
          start_date?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_availability_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          daily_rate: number
          deposit_amount: number | null
          doors: number
          extra_mileage_rate: number | null
          features: string[] | null
          fuel_type: string
          id: string
          images: Json | null
          luggage_capacity: number | null
          make: string
          merchant_profile_id: string
          mileage_limit: number | null
          min_driver_age: number | null
          model: string
          monthly_rate: number | null
          name: string
          pickup_locations: Json | null
          seats: number
          status: string
          transmission: string
          updated_at: string
          vehicle_type: string
          weekly_rate: number | null
          year: number | null
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          daily_rate: number
          deposit_amount?: number | null
          doors?: number
          extra_mileage_rate?: number | null
          features?: string[] | null
          fuel_type: string
          id?: string
          images?: Json | null
          luggage_capacity?: number | null
          make: string
          merchant_profile_id: string
          mileage_limit?: number | null
          min_driver_age?: number | null
          model: string
          monthly_rate?: number | null
          name: string
          pickup_locations?: Json | null
          seats?: number
          status?: string
          transmission: string
          updated_at?: string
          vehicle_type: string
          weekly_rate?: number | null
          year?: number | null
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          daily_rate?: number
          deposit_amount?: number | null
          doors?: number
          extra_mileage_rate?: number | null
          features?: string[] | null
          fuel_type?: string
          id?: string
          images?: Json | null
          luggage_capacity?: number | null
          make?: string
          merchant_profile_id?: string
          mileage_limit?: number | null
          min_driver_age?: number | null
          model?: string
          monthly_rate?: number | null
          name?: string
          pickup_locations?: Json | null
          seats?: number
          status?: string
          transmission?: string
          updated_at?: string
          vehicle_type?: string
          weekly_rate?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_blocked_dates: {
        Row: {
          created_at: string
          end_datetime: string
          id: string
          is_recurring: boolean | null
          reason: string
          recurrence_day_of_week: number | null
          recurrence_pattern: string | null
          start_datetime: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          end_datetime: string
          id?: string
          is_recurring?: boolean | null
          reason?: string
          recurrence_day_of_week?: number | null
          recurrence_pattern?: string | null
          start_datetime: string
          venue_id: string
        }
        Update: {
          created_at?: string
          end_datetime?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string
          recurrence_day_of_week?: number | null
          recurrence_pattern?: string | null
          start_datetime?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_blocked_dates_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_bookings: {
        Row: {
          booking_id: string
          catering_selection: Json | null
          created_at: string
          end_datetime: string
          equipment_selection: Json | null
          event_name: string | null
          event_type: string
          expected_guests: number | null
          id: string
          setup_requirements: string | null
          start_datetime: string
          venue_id: string
        }
        Insert: {
          booking_id: string
          catering_selection?: Json | null
          created_at?: string
          end_datetime: string
          equipment_selection?: Json | null
          event_name?: string | null
          event_type: string
          expected_guests?: number | null
          id?: string
          setup_requirements?: string | null
          start_datetime: string
          venue_id: string
        }
        Update: {
          booking_id?: string
          catering_selection?: Json | null
          created_at?: string
          end_datetime?: string
          equipment_selection?: Json | null
          event_name?: string | null
          event_type?: string
          expected_guests?: number | null
          id?: string
          setup_requirements?: string | null
          start_datetime?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_quotes: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          end_time: string
          event_date: string
          event_type: string
          expected_guests: number
          expires_at: string | null
          id: string
          message: string | null
          notes: string | null
          payment_link_code: string | null
          quoted_price: number | null
          responded_at: string | null
          start_time: string
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          end_time: string
          event_date: string
          event_type: string
          expected_guests: number
          expires_at?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          payment_link_code?: string | null
          quoted_price?: number | null
          responded_at?: string | null
          start_time: string
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          end_time?: string
          event_date?: string
          event_type?: string
          expected_guests?: number
          expires_at?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          payment_link_code?: string | null
          quoted_price?: number | null
          responded_at?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_quotes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_quotes_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_reviews: {
        Row: {
          booking_id: string | null
          comment: string
          created_at: string
          id: string
          merchant_response: string | null
          rating: number
          responded_at: string | null
          service_rating: number | null
          title: string
          updated_at: string
          user_id: string | null
          value_rating: number | null
          venue_id: string
          venue_rating: number | null
        }
        Insert: {
          booking_id?: string | null
          comment: string
          created_at?: string
          id?: string
          merchant_response?: string | null
          rating: number
          responded_at?: string | null
          service_rating?: number | null
          title: string
          updated_at?: string
          user_id?: string | null
          value_rating?: number | null
          venue_id: string
          venue_rating?: number | null
        }
        Update: {
          booking_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          merchant_response?: string | null
          rating?: number
          responded_at?: string | null
          service_rating?: number | null
          title?: string
          updated_at?: string
          user_id?: string | null
          value_rating?: number | null
          venue_id?: string
          venue_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string
          amenities: string[] | null
          capacity_banquet: number | null
          capacity_seated: number | null
          capacity_standing: number | null
          capacity_theater: number | null
          catering_options: Json | null
          city: string
          country: string
          created_at: string
          created_by_admin_id: string | null
          description: string | null
          equipment_available: Json | null
          full_day_rate: number | null
          half_day_rate: number | null
          hourly_rate: number | null
          id: string
          images: Json | null
          latitude: number | null
          longitude: number | null
          merchant_profile_id: string
          min_hours: number | null
          name: string
          size_sqm: number | null
          status: string
          updated_at: string
          venue_type: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          capacity_banquet?: number | null
          capacity_seated?: number | null
          capacity_standing?: number | null
          capacity_theater?: number | null
          catering_options?: Json | null
          city: string
          country: string
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          equipment_available?: Json | null
          full_day_rate?: number | null
          half_day_rate?: number | null
          hourly_rate?: number | null
          id?: string
          images?: Json | null
          latitude?: number | null
          longitude?: number | null
          merchant_profile_id: string
          min_hours?: number | null
          name: string
          size_sqm?: number | null
          status?: string
          updated_at?: string
          venue_type: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          capacity_banquet?: number | null
          capacity_seated?: number | null
          capacity_standing?: number | null
          capacity_theater?: number | null
          catering_options?: Json | null
          city?: string
          country?: string
          created_at?: string
          created_by_admin_id?: string | null
          description?: string | null
          equipment_available?: Json | null
          full_day_rate?: number | null
          half_day_rate?: number | null
          hourly_rate?: number | null
          id?: string
          images?: Json | null
          latitude?: number | null
          longitude?: number | null
          merchant_profile_id?: string
          min_hours?: number | null
          name?: string
          size_sqm?: number | null
          status?: string
          updated_at?: string
          venue_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_cards: {
        Row: {
          card_name: string
          card_number_encrypted: string
          card_type: string
          created_at: string
          currency: string
          cvv_encrypted: string
          expiry_month: number
          expiry_year: number
          id: string
          is_active: boolean
          is_frozen: boolean
          last4: string
          spending_limit: number | null
          spent_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_name?: string
          card_number_encrypted: string
          card_type?: string
          created_at?: string
          currency?: string
          cvv_encrypted: string
          expiry_month: number
          expiry_year: number
          id?: string
          is_active?: boolean
          is_frozen?: boolean
          last4: string
          spending_limit?: number | null
          spent_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_name?: string
          card_number_encrypted?: string
          card_type?: string
          created_at?: string
          currency?: string
          cvv_encrypted?: string
          expiry_month?: number
          expiry_year?: number
          id?: string
          is_active?: boolean
          is_frozen?: boolean
          last4?: string
          spending_limit?: number | null
          spent_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_pockets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_primary: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency: string
          id?: string
          is_primary?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_primary?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workspace_availability: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          is_available: boolean
          price_override: number | null
          start_time: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          price_override?: number | null
          start_time?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          price_override?: number | null
          start_time?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_availability_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_blocked_dates: {
        Row: {
          created_at: string
          end_datetime: string
          id: string
          is_recurring: boolean | null
          reason: string | null
          recurrence_day_of_week: number | null
          recurrence_pattern: string | null
          start_datetime: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          end_datetime: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          recurrence_day_of_week?: number | null
          recurrence_pattern?: string | null
          start_datetime: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          end_datetime?: string
          id?: string
          is_recurring?: boolean | null
          reason?: string | null
          recurrence_day_of_week?: number | null
          recurrence_pattern?: string | null
          start_datetime?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_blocked_dates_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_bookings: {
        Row: {
          booking_id: string
          booking_type: string
          catering_requested: Json | null
          created_at: string
          end_datetime: string
          equipment_requested: Json | null
          id: string
          num_attendees: number | null
          start_datetime: string
          workspace_id: string
        }
        Insert: {
          booking_id: string
          booking_type: string
          catering_requested?: Json | null
          created_at?: string
          end_datetime: string
          equipment_requested?: Json | null
          id?: string
          num_attendees?: number | null
          start_datetime: string
          workspace_id: string
        }
        Update: {
          booking_id?: string
          booking_type?: string
          catering_requested?: Json | null
          created_at?: string
          end_datetime?: string
          equipment_requested?: Json | null
          id?: string
          num_attendees?: number | null
          start_datetime?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_bookings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_bookings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_reviews: {
        Row: {
          booking_id: string | null
          comment: string
          created_at: string
          id: string
          merchant_response: string | null
          rating: number
          responded_at: string | null
          service_rating: number | null
          space_rating: number | null
          title: string
          updated_at: string
          user_id: string
          value_rating: number | null
          workspace_id: string
        }
        Insert: {
          booking_id?: string | null
          comment: string
          created_at?: string
          id?: string
          merchant_response?: string | null
          rating: number
          responded_at?: string | null
          service_rating?: number | null
          space_rating?: number | null
          title: string
          updated_at?: string
          user_id: string
          value_rating?: number | null
          workspace_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          merchant_response?: string | null
          rating?: number
          responded_at?: string | null
          service_rating?: number | null
          space_rating?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          value_rating?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          address: string
          amenities: string[] | null
          capacity: number
          city: string
          country: string
          created_at: string
          created_by_admin_id: string | null
          daily_rate: number | null
          description: string | null
          hourly_rate: number | null
          id: string
          images: Json | null
          latitude: number | null
          longitude: number | null
          merchant_profile_id: string
          monthly_rate: number | null
          name: string
          operating_hours: Json | null
          status: string
          updated_at: string
          weekly_rate: number | null
          workspace_type: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          capacity?: number
          city: string
          country: string
          created_at?: string
          created_by_admin_id?: string | null
          daily_rate?: number | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          images?: Json | null
          latitude?: number | null
          longitude?: number | null
          merchant_profile_id: string
          monthly_rate?: number | null
          name: string
          operating_hours?: Json | null
          status?: string
          updated_at?: string
          weekly_rate?: number | null
          workspace_type: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          capacity?: number
          city?: string
          country?: string
          created_at?: string
          created_by_admin_id?: string | null
          daily_rate?: number | null
          description?: string | null
          hourly_rate?: number | null
          id?: string
          images?: Json | null
          latitude?: number | null
          longitude?: number | null
          merchant_profile_id?: string
          monthly_rate?: number | null
          name?: string
          operating_hours?: Json | null
          status?: string
          updated_at?: string
          weekly_rate?: number | null
          workspace_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_merchant_profile_id_fkey"
            columns: ["merchant_profile_id"]
            isOneToOne: false
            referencedRelation: "merchant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      available_ride_requests: {
        Row: {
          created_at: string | null
          currency: string | null
          dropoff_address: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          estimated_distance_km: number | null
          estimated_duration_mins: number | null
          expires_at: string | null
          final_price: number | null
          id: string | null
          matched_driver_id: string | null
          passenger_id: string | null
          passenger_name: string | null
          passenger_offered_price: number | null
          passenger_phone: string | null
          pickup_address: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pricing_mode: string | null
          recipient_name: string | null
          recipient_phone: string | null
          route_polyline: string | null
          status: string | null
          surge_multiplier: number | null
          system_estimated_price: number | null
          updated_at: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          estimated_distance_km?: number | null
          estimated_duration_mins?: number | null
          expires_at?: string | null
          final_price?: number | null
          id?: string | null
          matched_driver_id?: string | null
          passenger_id?: string | null
          passenger_name?: never
          passenger_offered_price?: number | null
          passenger_phone?: never
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pricing_mode?: string | null
          recipient_name?: never
          recipient_phone?: never
          route_polyline?: string | null
          status?: string | null
          surge_multiplier?: number | null
          system_estimated_price?: number | null
          updated_at?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          dropoff_address?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          estimated_distance_km?: number | null
          estimated_duration_mins?: number | null
          expires_at?: string | null
          final_price?: number | null
          id?: string | null
          matched_driver_id?: string | null
          passenger_id?: string | null
          passenger_name?: never
          passenger_offered_price?: number | null
          passenger_phone?: never
          pickup_address?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pricing_mode?: string | null
          recipient_name?: never
          recipient_phone?: never
          route_polyline?: string | null
          status?: string | null
          surge_multiplier?: number | null
          system_estimated_price?: number | null
          updated_at?: string | null
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_matched_driver_id_fkey"
            columns: ["matched_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_promo_code: {
        Args: {
          p_booking_id: string
          p_discount: number
          p_promo_code_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      calculate_profile_completion: {
        Args: { profile_row: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: number
      }
      check_driver_can_go_online: { Args: { p_user_id: string }; Returns: Json }
      cleanup_failed_login_attempts: { Args: never; Returns: undefined }
      create_escrow_hold: {
        Args: {
          p_amount: number
          p_booking_id: string
          p_merchant_profile_id: string
          p_platform_fee_percentage?: number
          p_service_date?: string
        }
        Returns: string
      }
      deduct_agent_float: {
        Args: {
          p_agent_profile_id: string
          p_amount: number
          p_bill_payment_id?: string
          p_currency: string
          p_description?: string
        }
        Returns: Json
      }
      deduct_driver_commission: {
        Args: {
          p_amount: number
          p_description?: string
          p_reference: string
          p_wallet_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_reference: string | null
          transaction_type: string
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      deduct_sponsored_ad_budget: {
        Args: { ad_id: string }
        Returns: undefined
      }
      deduct_user_wallet: {
        Args: {
          p_amount: number
          p_booking_id?: string
          p_description?: string
          p_wallet_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_reference: string | null
          transaction_type: string
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      generate_agent_referral_code: { Args: never; Returns: string }
      generate_booking_link_code: { Args: never; Returns: string }
      generate_booking_reference: { Args: never; Returns: string }
      generate_gift_card_code: { Args: never; Returns: string }
      generate_receipt_number: { Args: never; Returns: string }
      generate_remittance_reference: { Args: never; Returns: string }
      generate_voucher_code: { Args: never; Returns: string }
      get_merchant_operators: {
        Args: { _user_id: string }
        Returns: {
          operator_name: string
        }[]
      }
      get_merchant_pending_payout: {
        Args: { p_merchant_profile_id: string }
        Returns: number
      }
      get_or_create_float_account: {
        Args: { p_agent_profile_id: string }
        Returns: string
      }
      get_or_create_user_wallet: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_platform_analytics: {
        Args: never
        Returns: {
          active_merchants: number
          bookings_30d: number
          new_users_30d: number
          pending_merchants: number
          revenue_30d: number
          total_bookings: number
          total_revenue: number
          total_users: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_active_driver: { Args: { _user_id: string }; Returns: boolean }
      is_merchant: {
        Args: {
          _role: Database["public"]["Enums"]["merchant_role"]
          _user_id: string
        }
        Returns: boolean
      }
      load_agent_float: {
        Args: {
          p_admin_id: string
          p_agent_profile_id: string
          p_amount: number
          p_currency: string
          p_description?: string
        }
        Returns: Json
      }
      log_admin_service_action: {
        Args: {
          p_action_reason?: string
          p_action_type: string
          p_admin_id: string
          p_merchant_profile_id: string
          p_new_data?: Json
          p_previous_data?: Json
          p_service_id: string
          p_service_type: string
        }
        Returns: string
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notify_expiring_vouchers: { Args: never; Returns: number }
      pay_ride_with_wallet: {
        Args: { p_ride_id: string; p_user_id: string }
        Returns: Json
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      redeem_gift_card: {
        Args: {
          p_amount: number
          p_booking_id?: string
          p_code: string
          p_user_id: string
        }
        Returns: Json
      }
      redeem_gift_card_to_wallet: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      redeem_reward_points: {
        Args: {
          p_applicable_verticals?: string[]
          p_discount_type?: string
          p_discount_value?: number
          p_points_to_redeem: number
          p_reward_name: string
          p_user_id: string
        }
        Returns: Json
      }
      release_escrow_hold: {
        Args: { p_escrow_id: string; p_release_notes?: string }
        Returns: boolean
      }
      respond_to_venue_review: {
        Args: { p_response: string; p_review_id: string }
        Returns: boolean
      }
      respond_to_workspace_review: {
        Args: { p_response: string; p_review_id: string }
        Returns: boolean
      }
      topup_user_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_payment_reference: string
          p_wallet_id: string
        }
        Returns: {
          amount: number
          balance_after: number
          balance_before: number
          booking_id: string | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          payment_reference: string | null
          transaction_type: string
          wallet_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_wallet_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transfer_between_wallets: {
        Args: {
          p_amount: number
          p_description?: string
          p_recipient_account_number: string
          p_sender_wallet_id: string
        }
        Returns: Json
      }
      validate_promo_code: {
        Args: {
          p_code: string
          p_order_amount: number
          p_user_id: string
          p_vertical: string
        }
        Returns: Json
      }
    }
    Enums: {
      account_status: "active" | "suspended" | "warning"
      app_role: "admin" | "user" | "merchant" | "driver"
      bill_payment_status: "pending" | "paid" | "overdue"
      escrow_status: "pending" | "released" | "refunded" | "disputed"
      fund_collection_model: "platform_first" | "merchant_collects" | "escrow"
      merchant_role:
        | "bus_operator"
        | "event_organizer"
        | "admin"
        | "travel_agent"
        | "booking_agent"
        | "property_owner"
        | "car_rental_company"
        | "transfer_provider"
        | "workspace_provider"
        | "experience_host"
        | "airline_partner"
        | "venue_owner"
      payment_method_type:
        | "cash"
        | "bank_transfer"
        | "mobile_money"
        | "payment_gateway"
      payment_status:
        | "pending"
        | "completed"
        | "failed"
        | "refunded"
        | "pending_verification"
      payout_frequency: "daily" | "weekly" | "biweekly" | "monthly"
      payout_status: "pending" | "processing" | "completed" | "failed"
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
      account_status: ["active", "suspended", "warning"],
      app_role: ["admin", "user", "merchant", "driver"],
      bill_payment_status: ["pending", "paid", "overdue"],
      escrow_status: ["pending", "released", "refunded", "disputed"],
      fund_collection_model: ["platform_first", "merchant_collects", "escrow"],
      merchant_role: [
        "bus_operator",
        "event_organizer",
        "admin",
        "travel_agent",
        "booking_agent",
        "property_owner",
        "car_rental_company",
        "transfer_provider",
        "workspace_provider",
        "experience_host",
        "airline_partner",
        "venue_owner",
      ],
      payment_method_type: [
        "cash",
        "bank_transfer",
        "mobile_money",
        "payment_gateway",
      ],
      payment_status: [
        "pending",
        "completed",
        "failed",
        "refunded",
        "pending_verification",
      ],
      payout_frequency: ["daily", "weekly", "biweekly", "monthly"],
      payout_status: ["pending", "processing", "completed", "failed"],
    },
  },
} as const
