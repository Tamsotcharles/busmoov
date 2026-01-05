export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automations: {
        Row: {
          action_type: string
          action_value: string | null
          created_at: string | null
          delay_max: number | null
          delay_min: number | null
          id: string
          is_active: boolean | null
          name: string
          trigger_type: string
          trigger_value: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          action_value?: string | null
          created_at?: string | null
          delay_max?: number | null
          delay_min?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_type: string
          trigger_value?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          action_value?: string | null
          created_at?: string | null
          delay_max?: number | null
          delay_min?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_type?: string
          trigger_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      capacites_vehicules: {
        Row: {
          code: string
          coefficient: number
          created_at: string | null
          disponible_partout: boolean | null
          id: string
          label: string
          places_max: number
          places_min: number
          regions_disponibles: string[] | null
          updated_at: string | null
        }
        Insert: {
          code: string
          coefficient?: number
          created_at?: string | null
          disponible_partout?: boolean | null
          id?: string
          label: string
          places_max: number
          places_min: number
          regions_disponibles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          coefficient?: number
          created_at?: string | null
          disponible_partout?: boolean | null
          id?: string
          label?: string
          places_max?: number
          places_min?: number
          regions_disponibles?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cgv: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          published_at: string | null
          title: string
          updated_at: string | null
          version: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          published_at?: string | null
          title: string
          updated_at?: string | null
          version: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      cgv_acceptations: {
        Row: {
          accepted_at: string | null
          cgv_id: string | null
          cgv_version: string | null
          client_email: string | null
          client_ip: string | null
          client_name: string | null
          dossier_id: string | null
          id: string
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string | null
          cgv_id?: string | null
          cgv_version?: string | null
          client_email?: string | null
          client_ip?: string | null
          client_name?: string | null
          dossier_id?: string | null
          id?: string
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string | null
          cgv_id?: string | null
          cgv_version?: string | null
          client_email?: string | null
          client_ip?: string | null
          client_name?: string | null
          dossier_id?: string | null
          id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cgv_acceptations_cgv_id_fkey"
            columns: ["cgv_id"]
            isOneToOne: false
            referencedRelation: "cgv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cgv_acceptations_dossier_id_fkey"
            columns: ["dossier_id"]
            isOneToOne: false
            referencedRelation: "dossiers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_zip: string | null
          company: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_zip?: string | null
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_zip?: string | null
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      coefficients_vehicules: {
        Row: {
          code: string
          coefficient: number
          created_at: string | null
          id: string
          label: string
        }
        Insert: {
          code: string
          coefficient: number
          created_at?: string | null
          id?: string
          label: string
        }
        Update: {
          code?: string
          coefficient?: number
          created_at?: string | null
          id?: string
          label?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          bank_name: string | null
          bic: string | null
          city: string | null
          code_ape: string | null
          country: string | null
          created_at: string | null
          email: string | null
          iban: string | null
          id: string
          legal_name: string
          logo_url: string | null
          name: string
          phone: string | null
          rcs: string | null
          siret: string | null
          tva_intracom: string | null
          updated_at: string | null
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          bank_name?: string | null
          bic?: string | null
          city?: string | null
          code_ape?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          legal_name?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          rcs?: string | null
          siret?: string | null
          tva_intracom?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          bank_name?: string | null
          bic?: string | null
          city?: string | null
          code_ape?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          iban?: string | null
          id?: string
          legal_name?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          rcs?: string | null
          siret?: string | null
          tva_intracom?: string | null
          updated_at?: string | null
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      contrats: {
        Row: {
          acompte_amount: number | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_zip: string | null
          client_email: string | null
          client_ip: string | null
          client_name: string | null
          created_at: string | null
          devis_id: string | null
          dossier_id: string | null
          id: string
          price_ttc: number
          reference: string
          signed_at: string | null
          signed_by_admin: boolean | null
          signed_by_client: boolean | null
          solde_amount: number | null
          status: string | null
          cancelled_at: string | null
          cancelled_reason: string | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          acompte_amount?: number | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_zip?: string | null
          client_email?: string | null
          client_ip?: string | null
          client_name?: string | null
          created_at?: string | null
          devis_id?: string | null
          dossier_id?: string | null
          id?: string
          price_ttc: number
          reference?: string
          signed_at?: string | null
          signed_by_admin?: boolean | null
          signed_by_client?: boolean | null
          solde_amount?: number | null
          status?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          acompte_amount?: number | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_zip?: string | null
          client_email?: string | null
          client_ip?: string | null
          client_name?: string | null
          created_at?: string | null
          devis_id?: string | null
          dossier_id?: string | null
          id?: string
          price_ttc?: number
          reference?: string
          signed_at?: string | null
          signed_by_admin?: boolean | null
          signed_by_client?: boolean | null
          solde_amount?: number | null
          status?: string | null
          cancelled_at?: string | null
          cancelled_reason?: string | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      demandes: {
        Row: {
          accessibility: boolean | null
          arrival_address: string | null
          arrival_city: string
          client_email: string
          client_id: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          departure_address: string | null
          departure_city: string
          departure_date: string
          departure_time: string | null
          id: string
          luggage_type: string | null
          passengers: string
          reference: string
          return_arrival_address: string | null
          return_date: string | null
          return_departure_address: string | null
          return_time: string | null
          source: string | null
          special_requests: string | null
          status: string | null
          trip_mode: string | null
          trip_type: string | null
          updated_at: string | null
          vehicle_type: string | null
          voyage_type: string | null
          wc: boolean | null
          wifi: boolean | null
          nombre_cars: number | null
          nombre_chauffeurs: number | null
        }
        Insert: {
          accessibility?: boolean | null
          arrival_address?: string | null
          arrival_city: string
          client_email: string
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          departure_address?: string | null
          departure_city: string
          departure_date: string
          departure_time?: string | null
          id?: string
          luggage_type?: string | null
          passengers: string
          reference?: string
          return_arrival_address?: string | null
          return_date?: string | null
          return_departure_address?: string | null
          return_time?: string | null
          source?: string | null
          special_requests?: string | null
          status?: string | null
          trip_mode?: string | null
          trip_type?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          voyage_type?: string | null
          wc?: boolean | null
          wifi?: boolean | null
          nombre_cars?: number | null
          nombre_chauffeurs?: number | null
        }
        Update: {
          accessibility?: boolean | null
          arrival_address?: string | null
          arrival_city?: string
          client_email?: string
          client_id?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          departure_address?: string | null
          departure_city?: string
          departure_date?: string
          departure_time?: string | null
          id?: string
          luggage_type?: string | null
          passengers?: string
          reference?: string
          return_arrival_address?: string | null
          return_date?: string | null
          return_departure_address?: string | null
          return_time?: string | null
          source?: string | null
          special_requests?: string | null
          status?: string | null
          trip_mode?: string | null
          trip_type?: string | null
          updated_at?: string | null
          vehicle_type?: string | null
          voyage_type?: string | null
          wc?: boolean | null
          wifi?: boolean | null
          nombre_cars?: number | null
          nombre_chauffeurs?: number | null
        }
        Relationships: []
      }
      demandes_fournisseurs: {
        Row: {
          created_at: string | null
          devis_id: string | null
          dossier_id: string | null
          expires_at: string | null
          id: string
          marge: number | null
          marge_percent: number | null
          note_fournisseur: string | null
          note_interne: string | null
          prix_propose: number | null
          responded_at: string | null
          sent_at: string | null
          status: string | null
          transporteur_id: string | null
          updated_at: string | null
          validation_token: string | null
          bpa_received_at: string | null
        }
        Insert: {
          created_at?: string | null
          devis_id?: string | null
          dossier_id?: string | null
          expires_at?: string | null
          id?: string
          marge?: number | null
          marge_percent?: number | null
          note_fournisseur?: string | null
          note_interne?: string | null
          prix_propose?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          transporteur_id?: string | null
          updated_at?: string | null
          validation_token?: string | null
          bpa_received_at?: string | null
        }
        Update: {
          created_at?: string | null
          devis_id?: string | null
          dossier_id?: string | null
          expires_at?: string | null
          id?: string
          marge?: number | null
          marge_percent?: number | null
          note_fournisseur?: string | null
          note_interne?: string | null
          prix_propose?: number | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string | null
          transporteur_id?: string | null
          updated_at?: string | null
          validation_token?: string | null
          bpa_received_at?: string | null
        }
        Relationships: []
      }
      emails: {
        Row: {
          id: string
          to: string | null
          subject: string | null
          body: string | null
          template: string | null
          dossier_id: string | null
          status: string | null
          created_at: string | null
          sent_at: string | null
        }
        Insert: {
          id?: string
          to?: string | null
          subject?: string | null
          body?: string | null
          template?: string | null
          dossier_id?: string | null
          status?: string | null
          created_at?: string | null
          sent_at?: string | null
        }
        Update: {
          id?: string
          to?: string | null
          subject?: string | null
          body?: string | null
          template?: string | null
          dossier_id?: string | null
          status?: string | null
          created_at?: string | null
          sent_at?: string | null
        }
        Relationships: []
      }
      devis: {
        Row: {
          accepted_at: string | null
          auto_workflow_id: string | null
          client_notes: string | null
          created_at: string | null
          demande_id: string | null
          dossier_id: string | null
          id: string
          is_auto_generated: boolean | null
          km: string | null
          notes: string | null
          options: string | null
          price_achat_ht: number | null
          price_achat_ttc: number | null
          price_ht: number
          price_ttc: number
          reference: string
          scheduled_send_at: string | null
          sent_at: string | null
          status: string | null
          transporteur_id: string | null
          tva_rate: number | null
          updated_at: string | null
          validity_days: number | null
          vehicle_type: string | null
          workflow_step: number | null
          nombre_cars: number | null
          nombre_chauffeurs: number | null
          // Nouveaux champs étendus
          service_type: string | null
          duree_jours: number | null
          amplitude: string | null
          pax_aller: number | null
          pax_retour: number | null
          luggage_type: string | null
          options_details: Json | null
          etapes: Json | null
          detail_mad: string | null
          retour_different: boolean | null
          retour_departure: string | null
          retour_arrival: string | null
          retour_km: string | null
          remise_percent: number | null
          remise_montant: number | null
          majoration_percent: number | null
          majoration_montant: number | null
          prix_base_ht: number | null
          promo_expires_at: string | null
          promo_original_price: number | null
        }
        Insert: {
          accepted_at?: string | null
          auto_workflow_id?: string | null
          client_notes?: string | null
          created_at?: string | null
          demande_id?: string | null
          dossier_id?: string | null
          id?: string
          is_auto_generated?: boolean | null
          km?: string | null
          notes?: string | null
          options?: string | null
          price_achat_ht?: number | null
          price_achat_ttc?: number | null
          price_ht: number
          price_ttc: number
          reference?: string
          scheduled_send_at?: string | null
          sent_at?: string | null
          status?: string | null
          transporteur_id?: string | null
          tva_rate?: number | null
          updated_at?: string | null
          validity_days?: number | null
          vehicle_type?: string | null
          workflow_step?: number | null
          nombre_cars?: number | null
          nombre_chauffeurs?: number | null
          // Nouveaux champs étendus
          service_type?: string | null
          duree_jours?: number | null
          amplitude?: string | null
          pax_aller?: number | null
          pax_retour?: number | null
          luggage_type?: string | null
          options_details?: Json | null
          etapes?: Json | null
          detail_mad?: string | null
          retour_different?: boolean | null
          retour_departure?: string | null
          retour_arrival?: string | null
          retour_km?: string | null
          remise_percent?: number | null
          remise_montant?: number | null
          majoration_percent?: number | null
          majoration_montant?: number | null
          prix_base_ht?: number | null
          promo_expires_at?: string | null
          promo_original_price?: number | null
        }
        Update: {
          accepted_at?: string | null
          auto_workflow_id?: string | null
          client_notes?: string | null
          created_at?: string | null
          demande_id?: string | null
          dossier_id?: string | null
          id?: string
          is_auto_generated?: boolean | null
          km?: string | null
          notes?: string | null
          options?: string | null
          price_achat_ht?: number | null
          price_achat_ttc?: number | null
          price_ht?: number
          price_ttc?: number
          reference?: string
          scheduled_send_at?: string | null
          sent_at?: string | null
          status?: string | null
          transporteur_id?: string | null
          tva_rate?: number | null
          updated_at?: string | null
          validity_days?: number | null
          vehicle_type?: string | null
          workflow_step?: number | null
          nombre_cars?: number | null
          nombre_chauffeurs?: number | null
          // Nouveaux champs étendus
          service_type?: string | null
          duree_jours?: number | null
          amplitude?: string | null
          pax_aller?: number | null
          pax_retour?: number | null
          luggage_type?: string | null
          options_details?: Json | null
          etapes?: Json | null
          detail_mad?: string | null
          retour_different?: boolean | null
          retour_departure?: string | null
          retour_arrival?: string | null
          retour_km?: string | null
          remise_percent?: number | null
          remise_montant?: number | null
          majoration_percent?: number | null
          majoration_montant?: number | null
          prix_base_ht?: number | null
          promo_expires_at?: string | null
          promo_original_price?: number | null
        }
        Relationships: []
      }
      disponibilite_vehicules_regions: {
        Row: {
          created_at: string | null
          id: string
          is_available: boolean | null
          region_code: string
          vehicule_code: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          region_code: string
          vehicule_code: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_available?: boolean | null
          region_code?: string
          vehicule_code?: string
        }
        Relationships: []
      }
      dossiers: {
        Row: {
          accessibility: boolean | null
          arrival: string
          arrival_address: string | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_zip: string | null
          chauffeur_name: string | null
          chauffeur_phone: string | null
          chauffeur_vehicle: string | null
          client_company: string | null
          client_email: string
          client_id: string | null
          client_name: string
          client_phone: string | null
          contract_signed_at: string | null
          created_at: string | null
          demande_id: string | null
          departure: string
          departure_address: string | null
          departure_date: string
          departure_time: string | null
          fournisseur_paid: boolean | null
          fournisseur_paid_at: string | null
          id: string
          luggage_type: string | null
          notes: string | null
          passengers: number
          price_achat: number | null
          price_ht: number | null
          price_ttc: number | null
          reference: string
          return_arrival_address: string | null
          return_date: string | null
          return_departure_address: string | null
          return_time: string | null
          signer_name: string | null
          special_requests: string | null
          status: string | null
          tags: string[] | null
          transporteur_id: string | null
          trip_mode: string | null
          tva_rate: number | null
          updated_at: string | null
          vehicle_type: string | null
          voyage_type: string | null
          wc: boolean | null
          wifi: boolean | null
          nombre_cars: number | null
          nombre_chauffeurs: number | null
          facture_fournisseur_recue: boolean | null
          facture_fournisseur_recue_at: string | null
          facture_fournisseur_reference: string | null
          requires_manual_review: boolean | null
          manual_review_reason: string | null
        }
        Insert: {
          accessibility?: boolean | null
          arrival: string
          arrival_address?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_zip?: string | null
          chauffeur_name?: string | null
          chauffeur_phone?: string | null
          chauffeur_vehicle?: string | null
          client_company?: string | null
          client_email: string
          client_id?: string | null
          client_name: string
          client_phone?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          demande_id?: string | null
          departure: string
          departure_address?: string | null
          departure_date: string
          departure_time?: string | null
          fournisseur_paid?: boolean | null
          fournisseur_paid_at?: string | null
          id?: string
          luggage_type?: string | null
          notes?: string | null
          passengers: number
          price_achat?: number | null
          price_ht?: number | null
          price_ttc?: number | null
          reference?: string
          return_arrival_address?: string | null
          return_date?: string | null
          return_departure_address?: string | null
          return_time?: string | null
          signer_name?: string | null
          special_requests?: string | null
          status?: string | null
          tags?: string[] | null
          transporteur_id?: string | null
          trip_mode?: string | null
          tva_rate?: number | null
          updated_at?: string | null
          vehicle_type?: string | null
          voyage_type?: string | null
          wc?: boolean | null
          wifi?: boolean | null
          nombre_cars?: number | null
          nombre_chauffeurs?: number | null
          facture_fournisseur_recue?: boolean | null
          facture_fournisseur_recue_at?: string | null
          facture_fournisseur_reference?: string | null
          requires_manual_review?: boolean | null
          manual_review_reason?: string | null
        }
        Update: {
          accessibility?: boolean | null
          arrival?: string
          arrival_address?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_zip?: string | null
          chauffeur_name?: string | null
          chauffeur_phone?: string | null
          chauffeur_vehicle?: string | null
          client_company?: string | null
          client_email?: string
          client_id?: string | null
          client_name?: string
          client_phone?: string | null
          contract_signed_at?: string | null
          created_at?: string | null
          demande_id?: string | null
          departure?: string
          departure_address?: string | null
          departure_date?: string
          departure_time?: string | null
          fournisseur_paid?: boolean | null
          fournisseur_paid_at?: string | null
          id?: string
          luggage_type?: string | null
          notes?: string | null
          passengers?: number
          price_achat?: number | null
          price_ht?: number | null
          price_ttc?: number | null
          reference?: string
          return_arrival_address?: string | null
          return_date?: string | null
          return_departure_address?: string | null
          return_time?: string | null
          signer_name?: string | null
          special_requests?: string | null
          status?: string | null
          tags?: string[] | null
          transporteur_id?: string | null
          trip_mode?: string | null
          tva_rate?: number | null
          updated_at?: string | null
          vehicle_type?: string | null
          voyage_type?: string | null
          wc?: boolean | null
          wifi?: boolean | null
          nombre_cars?: number | null
          nombre_chauffeurs?: number | null
          facture_fournisseur_recue?: boolean | null
          facture_fournisseur_recue_at?: string | null
          facture_fournisseur_reference?: string | null
          requires_manual_review?: boolean | null
          manual_review_reason?: string | null
        }
        Relationships: []
      }
      dossiers_auto_devis: {
        Row: {
          created_at: string | null
          current_step: number | null
          devis_generes: Json | null
          dossier_id: string
          id: string
          is_active: boolean | null
          next_devis_at: string | null
          paused_at: string | null
          prix_reference: number | null
          started_at: string | null
          type_trajet: string | null
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_step?: number | null
          devis_generes?: Json | null
          dossier_id: string
          id?: string
          is_active?: boolean | null
          next_devis_at?: string | null
          paused_at?: string | null
          prix_reference?: number | null
          started_at?: string | null
          type_trajet?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_step?: number | null
          devis_generes?: Json | null
          dossier_id?: string
          id?: string
          is_active?: boolean | null
          next_devis_at?: string | null
          paused_at?: string | null
          prix_reference?: number | null
          started_at?: string | null
          type_trajet?: string | null
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          content: string | null
          created_at: string | null
          id: string
          key: string
          name: string
          subject: string
          type: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          content?: string | null
          created_at?: string | null
          id?: string
          key: string
          name: string
          subject: string
          type?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          content?: string | null
          created_at?: string | null
          id?: string
          key?: string
          name?: string
          subject?: string
          type?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      factures: {
        Row: {
          amount_ht: number
          amount_ttc: number
          amount_tva: number
          contrat_id: string | null
          created_at: string | null
          dossier_id: string | null
          id: string
          paid_at: string | null
          reference: string
          status: string | null
          tva_rate: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount_ht: number
          amount_ttc: number
          amount_tva: number
          contrat_id?: string | null
          created_at?: string | null
          dossier_id?: string | null
          id?: string
          paid_at?: string | null
          reference?: string
          status?: string | null
          tva_rate?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          amount_tva?: number
          contrat_id?: string | null
          created_at?: string | null
          dossier_id?: string | null
          id?: string
          paid_at?: string | null
          reference?: string
          status?: string | null
          tva_rate?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      majorations_regions: {
        Row: {
          created_at: string | null
          description: string | null
          grande_capacite_dispo: boolean | null
          id: string
          is_active: boolean | null
          majoration_percent: number
          region_code: string
          region_nom: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          grande_capacite_dispo?: boolean | null
          id?: string
          is_active?: boolean | null
          majoration_percent?: number
          region_code: string
          region_nom: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          grande_capacite_dispo?: boolean | null
          id?: string
          is_active?: boolean | null
          majoration_percent?: number
          region_code?: string
          region_nom?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          devis_id: string | null
          dossier_id: string | null
          id: string
          read_by_admin: boolean | null
          read_by_client: boolean | null
          read_by_fournisseur: boolean | null
          sender: string
          transporteur_id: string | null
          demande_fournisseur_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          devis_id?: string | null
          dossier_id?: string | null
          id?: string
          read_by_admin?: boolean | null
          read_by_client?: boolean | null
          read_by_fournisseur?: boolean | null
          sender: string
          transporteur_id?: string | null
          demande_fournisseur_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          devis_id?: string | null
          dossier_id?: string | null
          id?: string
          read_by_admin?: boolean | null
          read_by_client?: boolean | null
          read_by_fournisseur?: boolean | null
          sender?: string
          transporteur_id?: string | null
          demande_fournisseur_id?: string | null
        }
        Relationships: []
      }
      paiements: {
        Row: {
          amount: number
          contrat_id: string | null
          created_at: string | null
          dossier_id: string | null
          id: string
          notes: string | null
          payment_date: string
          reference: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          contrat_id?: string | null
          created_at?: string | null
          dossier_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          reference?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          contrat_id?: string | null
          created_at?: string | null
          dossier_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          reference?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      paiements_fournisseurs: {
        Row: {
          id: string
          dossier_id: string | null
          transporteur_id: string | null
          amount: number
          payment_date: string
          type: string
          reference: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          dossier_id?: string | null
          transporteur_id?: string | null
          amount: number
          payment_date?: string
          type?: string
          reference?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          dossier_id?: string | null
          transporteur_id?: string | null
          amount?: number
          payment_date?: string
          type?: string
          reference?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rappels: {
        Row: {
          id: string
          dossier_id: string | null
          user_id: string | null
          title: string
          description: string | null
          reminder_date: string
          reminder_time: string | null
          is_done: boolean
          priority: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          dossier_id?: string | null
          user_id?: string | null
          title: string
          description?: string | null
          reminder_date: string
          reminder_time?: string | null
          is_done?: boolean
          priority?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          dossier_id?: string | null
          user_id?: string | null
          title?: string
          description?: string | null
          reminder_date?: string
          reminder_time?: string | null
          is_done?: boolean
          priority?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tarifs_aller_simple: {
        Row: {
          created_at: string | null
          id: string
          km_max: number
          km_min: number
          prix_public: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          km_max: number
          km_min: number
          prix_public: number
        }
        Update: {
          created_at?: string | null
          id?: string
          km_max?: number
          km_min?: number
          prix_public?: number
        }
        Relationships: []
      }
      tarifs_ar_1j: {
        Row: {
          created_at: string | null
          id: string
          km_max: number
          km_min: number
          prix_10h: number | null
          prix_12h: number | null
          prix_8h: number | null
          prix_9h_coupure: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          km_max: number
          km_min: number
          prix_10h?: number | null
          prix_12h?: number | null
          prix_8h?: number | null
          prix_9h_coupure?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          km_max?: number
          km_min?: number
          prix_10h?: number | null
          prix_12h?: number | null
          prix_8h?: number | null
          prix_9h_coupure?: number | null
        }
        Relationships: []
      }
      tarifs_ar_mad: {
        Row: {
          created_at: string | null
          id: string
          km_max: number
          km_min: number
          prix_2j: number | null
          prix_3j: number | null
          prix_4j: number | null
          prix_5j: number | null
          prix_6j: number | null
          supplement_jour: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          km_max: number
          km_min: number
          prix_2j?: number | null
          prix_3j?: number | null
          prix_4j?: number | null
          prix_5j?: number | null
          prix_6j?: number | null
          supplement_jour?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          km_max?: number
          km_min?: number
          prix_2j?: number | null
          prix_3j?: number | null
          prix_4j?: number | null
          prix_5j?: number | null
          prix_6j?: number | null
          supplement_jour?: number | null
        }
        Relationships: []
      }
      tarifs_ar_sans_mad: {
        Row: {
          created_at: string | null
          id: string
          km_max: number
          km_min: number
          prix_2j: number | null
          prix_3j: number | null
          prix_4j: number | null
          prix_5j: number | null
          prix_6j: number | null
          supplement_jour: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          km_max: number
          km_min: number
          prix_2j?: number | null
          prix_3j?: number | null
          prix_4j?: number | null
          prix_5j?: number | null
          prix_6j?: number | null
          supplement_jour?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          km_max?: number
          km_min?: number
          prix_2j?: number | null
          prix_3j?: number | null
          prix_4j?: number | null
          prix_5j?: number | null
          prix_6j?: number | null
          supplement_jour?: number | null
        }
        Relationships: []
      }
      timeline: {
        Row: {
          content: string
          created_at: string | null
          dossier_id: string | null
          id: string
          type: string
        }
        Insert: {
          content: string
          created_at?: string | null
          dossier_id?: string | null
          id?: string
          type: string
        }
        Update: {
          content?: string
          created_at?: string | null
          dossier_id?: string | null
          id?: string
          type?: string
        }
        Relationships: []
      }
      transporteurs: {
        Row: {
          active: boolean | null
          astreinte_tel: string | null
          categories: string[] | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          number: string
          phone: string | null
          rating: number | null
          regions: string[] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          astreinte_tel?: string | null
          categories?: string[] | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          number: string
          phone?: string | null
          rating?: number | null
          regions?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          astreinte_tel?: string | null
          categories?: string[] | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          number?: string
          phone?: string | null
          rating?: number | null
          regions?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      voyage_infos: {
        Row: {
          aller_adresse_arrivee: string | null
          aller_adresse_depart: string | null
          aller_date: string | null
          aller_heure: string | null
          aller_passagers: number | null
          contact_email: string | null
          contact_nom: string | null
          contact_prenom: string | null
          contact_tel: string | null
          created_at: string | null
          dossier_id: string | null
          id: string
          retour_adresse_arrivee: string | null
          retour_adresse_depart: string | null
          retour_date: string | null
          retour_heure: string | null
          retour_passagers: number | null
          updated_at: string | null
          validated_at: string | null
          // Chauffeur aller
          chauffeur_aller_nom: string | null
          chauffeur_aller_tel: string | null
          chauffeur_aller_immatriculation: string | null
          // Chauffeur retour
          chauffeur_retour_nom: string | null
          chauffeur_retour_tel: string | null
          chauffeur_retour_immatriculation: string | null
          // Feuille de route
          feuille_route_type: string | null
          demande_chauffeur_envoyee_at: string | null
          chauffeur_info_recue_at: string | null
          feuille_route_generee_at: string | null
          feuille_route_envoyee_at: string | null
          // Astreinte
          astreinte_tel: string | null
          // Admin
          admin_validated_at: string | null
          sent_to_supplier_at: string | null
          admin_modified_at: string | null
          commentaires: string | null
        }
        Insert: {
          aller_adresse_arrivee?: string | null
          aller_adresse_depart?: string | null
          aller_date?: string | null
          aller_heure?: string | null
          aller_passagers?: number | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_prenom?: string | null
          contact_tel?: string | null
          created_at?: string | null
          dossier_id?: string | null
          id?: string
          retour_adresse_arrivee?: string | null
          retour_adresse_depart?: string | null
          retour_date?: string | null
          retour_heure?: string | null
          retour_passagers?: number | null
          updated_at?: string | null
          validated_at?: string | null
          // Chauffeur aller
          chauffeur_aller_nom?: string | null
          chauffeur_aller_tel?: string | null
          chauffeur_aller_immatriculation?: string | null
          // Chauffeur retour
          chauffeur_retour_nom?: string | null
          chauffeur_retour_tel?: string | null
          chauffeur_retour_immatriculation?: string | null
          // Feuille de route
          feuille_route_type?: string | null
          demande_chauffeur_envoyee_at?: string | null
          chauffeur_info_recue_at?: string | null
          feuille_route_generee_at?: string | null
          feuille_route_envoyee_at?: string | null
          // Astreinte
          astreinte_tel?: string | null
          // Admin
          admin_validated_at?: string | null
          sent_to_supplier_at?: string | null
          admin_modified_at?: string | null
          commentaires?: string | null
        }
        Update: {
          aller_adresse_arrivee?: string | null
          aller_adresse_depart?: string | null
          aller_date?: string | null
          aller_heure?: string | null
          aller_passagers?: number | null
          contact_email?: string | null
          contact_nom?: string | null
          contact_prenom?: string | null
          contact_tel?: string | null
          created_at?: string | null
          dossier_id?: string | null
          id?: string
          retour_adresse_arrivee?: string | null
          retour_adresse_depart?: string | null
          retour_date?: string | null
          retour_heure?: string | null
          retour_passagers?: number | null
          updated_at?: string | null
          validated_at?: string | null
          // Chauffeur aller
          chauffeur_aller_nom?: string | null
          chauffeur_aller_tel?: string | null
          chauffeur_aller_immatriculation?: string | null
          // Chauffeur retour
          chauffeur_retour_nom?: string | null
          chauffeur_retour_tel?: string | null
          chauffeur_retour_immatriculation?: string | null
          // Feuille de route
          feuille_route_type?: string | null
          demande_chauffeur_envoyee_at?: string | null
          chauffeur_info_recue_at?: string | null
          feuille_route_generee_at?: string | null
          feuille_route_envoyee_at?: string | null
          // Astreinte
          astreinte_tel?: string | null
          // Admin
          admin_validated_at?: string | null
          sent_to_supplier_at?: string | null
          admin_modified_at?: string | null
          commentaires?: string | null
        }
        Relationships: []
      }
      demandes_chauffeur: {
        Row: {
          id: string
          dossier_id: string | null
          transporteur_id: string | null
          type: string
          mode: string
          token: string
          status: string | null
          created_at: string | null
          sent_at: string | null
          received_at: string | null
          expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          dossier_id?: string | null
          transporteur_id?: string | null
          type: string
          mode?: string
          token: string
          status?: string | null
          created_at?: string | null
          sent_at?: string | null
          received_at?: string | null
          expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          dossier_id?: string | null
          transporteur_id?: string | null
          type?: string
          mode?: string
          token?: string
          status?: string | null
          created_at?: string | null
          sent_at?: string | null
          received_at?: string | null
          expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vehicules_trajet: {
        Row: {
          id: string
          dossier_id: string | null
          trajet_type: 'aller' | 'retour'
          immatriculation: string | null
          type_vehicule: string | null
          capacite: number | null
          ordre: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          dossier_id?: string | null
          trajet_type: 'aller' | 'retour'
          immatriculation?: string | null
          type_vehicule?: string | null
          capacite?: number | null
          ordre?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          dossier_id?: string | null
          trajet_type?: 'aller' | 'retour'
          immatriculation?: string | null
          type_vehicule?: string | null
          capacite?: number | null
          ordre?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chauffeurs_vehicule: {
        Row: {
          id: string
          vehicule_trajet_id: string | null
          nom: string
          tel: string | null
          role: string | null
          ordre: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          vehicule_trajet_id?: string | null
          nom: string
          tel?: string | null
          role?: string | null
          ordre?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          vehicule_trajet_id?: string | null
          nom?: string
          tel?: string | null
          role?: string | null
          ordre?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          value?: Json
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_devis_auto: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          steps: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          steps?: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          steps?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_rules: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_reference: {
        Args: { prefix: string; seq_name: string }
        Returns: string
      }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Transporteur = Tables<'transporteurs'>
export type Client = Tables<'clients'>
export type Demande = Tables<'demandes'>
export type Dossier = Tables<'dossiers'>
export type VoyageInfo = Tables<'voyage_infos'>
export type Devis = Tables<'devis'>
export type Contrat = Tables<'contrats'>
export type Facture = Tables<'factures'>
export type Message = Tables<'messages'>
export type Timeline = Tables<'timeline'>
export type EmailTemplate = Tables<'email_templates'>
export type Automation = Tables<'automations'>
export type AdminUser = Tables<'admin_users'>
export type Paiement = Tables<'paiements'>
export type CompanySettings = Tables<'company_settings'>
export type WorkflowRule = Tables<'workflow_rules'>
export type DemandeFournisseur = Tables<'demandes_fournisseurs'>

// New pricing tables
export type TarifAllerSimple = Tables<'tarifs_aller_simple'>
export type TarifAR1J = Tables<'tarifs_ar_1j'>
export type TarifARMAD = Tables<'tarifs_ar_mad'>
export type TarifARSansMAD = Tables<'tarifs_ar_sans_mad'>
export type CoefficientVehicule = Tables<'coefficients_vehicules'>
export type CapaciteVehicule = Tables<'capacites_vehicules'>
export type MajorationRegion = Tables<'majorations_regions'>
export type DisponibiliteVehiculeRegion = Tables<'disponibilite_vehicules_regions'>

// Workflow tables
export type WorkflowDevisAuto = Tables<'workflow_devis_auto'>
export type DossierAutoDevis = Tables<'dossiers_auto_devis'>

// Extended types with relations
export type DossierWithRelations = Dossier & {
  transporteur?: Transporteur | null
  devis?: Devis[]
  contrats?: Contrat[]
  paiements?: Paiement[]
  factures?: Facture[]
  messages?: Message[]
  voyage_info?: VoyageInfo | null
  demandes_fournisseurs?: DemandeFournisseurWithTransporteur[]
}

export type DevisWithRelations = Devis & {
  transporteur?: Transporteur | null
  demande?: Demande | null
  dossier?: Dossier | null
}

export type DevisWithTransporteur = Devis & {
  transporteur?: Transporteur | null
}

export type DemandeFournisseurWithTransporteur = DemandeFournisseur & {
  transporteur?: Transporteur | null
}

// Demandes chauffeur
export type DemandeChauffeur = Tables<'demandes_chauffeur'>

export type DemandeChauffeurWithRelations = DemandeChauffeur & {
  dossier?: Dossier | null
  transporteur?: Transporteur | null
}

// Types pour la feuille de route
export type FeuilleRouteType = 'aller' | 'retour' | 'aller_retour'
export type DemandeChauffeurStatus = 'pending' | 'received' | 'expired' | 'cancelled'
export type DemandeChauffeurMode = 'individuel' | 'groupe'

// Types pour multi-véhicules/chauffeurs
export type VehiculeTrajet = Tables<'vehicules_trajet'>
export type ChauffeurVehicule = Tables<'chauffeurs_vehicule'>

export type ChauffeurVehiculeWithRole = ChauffeurVehicule & {
  role: 'principal' | 'secondaire' | 'relais'
}

export type VehiculeTrajetWithChauffeurs = VehiculeTrajet & {
  chauffeurs: ChauffeurVehicule[]
}

export type TrajetType = 'aller' | 'retour'

// Types pour les devis étendus
export type DevisServiceType = 'aller_simple' | 'ar_1j' | 'ar_mad' | 'ar_sans_mad'
export type DevisAmplitude = '8h' | '10h' | '12h' | '9h_coupure'
export type DevisLuggageType = 'aucun' | 'leger' | 'moyen' | 'volumineux'
export type DevisOptionStatus = 'inclus' | 'non_inclus' | 'cache'

// Type compatible avec Json pour les options de devis
export type DevisOptionsDetails = {
  [key: string]: {
    status?: string
    montant?: number
    nuits?: number
  } | undefined
}

export type DevisEtape = {
  adresse: string
  km_supplementaire?: number
}
