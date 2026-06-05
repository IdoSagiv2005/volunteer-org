export type Database = {
  public: {
    Tables: {
      branches: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string }
      }
      managers: {
        Row: { id: string; user_id: string; name: string; phone: string | null; email: string; branch_id: string | null; is_super_admin: boolean; created_at: string }
        Insert: { id?: string; user_id: string; name: string; phone?: string; email: string; branch_id?: string; is_super_admin?: boolean }
        Update: { name?: string; phone?: string; email?: string; branch_id?: string; is_super_admin?: boolean }
      }
      families: {
        Row: { family_id: string; full_name: string; national_id: string; address: string | null; phone: string | null; member_count: number | null; disability_type: string | null; branch_id: string; created_at: string }
        Insert: { family_id?: string; full_name: string; national_id: string; address?: string; phone?: string; member_count?: number; disability_type?: string; branch_id: string }
        Update: { full_name?: string; national_id?: string; address?: string; phone?: string; member_count?: number; disability_type?: string }
      }
      volunteers: {
        Row: { volunteer_id: string; name: string; phone: string | null; address: string | null; national_id: string; branch_id: string; created_at: string }
        Insert: { volunteer_id?: string; name: string; phone?: string; address?: string; national_id: string; branch_id: string }
        Update: { name?: string; phone?: string; address?: string; national_id?: string }
      }
      deliveries: {
        Row: { address_id: string; address: string; door_photo_url: string | null; family_id: string | null; branch_id: string; created_at: string }
        Insert: { address_id?: string; address: string; door_photo_url?: string; family_id?: string; branch_id: string }
        Update: { address?: string; door_photo_url?: string; family_id?: string }
      }
      activity_types: {
        Row: { type_id: string; type_name: string; created_at: string }
        Insert: { type_id?: string; type_name: string }
        Update: { type_name?: string }
      }
      activities: {
        Row: { activity_id: string; type_id: string | null; date: string; branch_id: string; status: 'upcoming' | 'completed'; created_at: string }
        Insert: { activity_id?: string; type_id?: string | null; date: string; branch_id: string; status?: 'upcoming' | 'completed' }
        Update: { type_id?: string | null; date?: string; status?: 'upcoming' | 'completed' }
      }
      activity_volunteers: {
        Row: { activity_id: string; volunteer_id: string }
        Insert: { activity_id: string; volunteer_id: string }
        Update: never
      }
    }
  }
}
