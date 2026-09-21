// =====================================================
// SUPABASE CONFIGURATION
// Replace with your Supabase project credentials
// =====================================================

const SUPABASE_URL = 'https://xhqjixxxrvbaiapzznzf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cLF8KTswKs8wAYYn2Rjk2Q_eo-CbWDy';

// Initialize Supabase client
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// =====================================================
// APP CONFIGURATION
// =====================================================
const APP_CONFIG = {
    name: 'Facility Reservation System',
    version: '1.0.0',
    roles: {
        administrator: {
            label: 'Administrator',
            color: '#dc2626',
            permissions: [
                'manage_facilities',
                'manage_users',
                'approve_reservations',
                'reject_reservations',
                'view_all_reservations',
                'view_service_requests',
                'view_reports',
                'view_audit_logs',
                'delete_facilities'
            ]
        },
        facility_staff: {
            label: 'Facility Staff',
            color: '#0891b2',
            permissions: [
                'view_all_reservations',
                'confirm_facility_usage',
                'record_completion',
                'create_service_requests',
                'update_facility_condition',
                'view_facilities'
            ]
        },
        requester: {
            label: 'Requester',
            color: '#16a34a',
            permissions: [
                'view_facilities',
                'submit_reservation',
                'view_own_reservations',
                'cancel_own_pending',
                'view_history'
            ]
        }
    },
    reservationStatuses: ['pending', 'approved', 'rejected', 'scheduled', 'in_use', 'completed', 'cancelled']
};
