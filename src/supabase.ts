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
      journals: {
        Row: {
          answer: string | null
          created_at: string
          draft: boolean | null
          image_url: string | null
          location: string | null
          private: boolean | null
          user_email: string | null
          uuid: string
          vertical: boolean | null
        }
        Insert: {
          answer?: string | null
          created_at?: string
          draft?: boolean | null
          image_url?: string | null
          location?: string | null
          private?: boolean | null
          user_email?: string | null
          uuid?: string
          vertical?: boolean | null
        }
        Update: {
          answer?: string | null
          created_at?: string
          draft?: boolean | null
          image_url?: string | null
          location?: string | null
          private?: boolean | null
          user_email?: string | null
          uuid?: string
          vertical?: boolean | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          dueDate: string | null
          eventName: string | null
          eventTimeEnd: string | null
          eventTimeStart: string | null
          tag: string | null
          user_id: string | null
          uuid: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dueDate?: string | null
          eventName?: string | null
          eventTimeEnd?: string | null
          eventTimeStart?: string | null
          tag?: string | null
          user_id?: string | null
          uuid?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dueDate?: string | null
          eventName?: string | null
          eventTimeEnd?: string | null
          eventTimeStart?: string | null
          tag?: string | null
          user_id?: string | null
          uuid?: string
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
