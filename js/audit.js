// =====================================================
// AUDIT LOGGING MODULE
// Records all critical actions for BR-B4-10
// =====================================================

const AuditLogger = {
    // Log an action to the audit_logs table
    async log(action, tableName, recordId, oldValues = null, newValues = null) {
        if (!supabaseClient) {
            console.warn('Supabase not configured - audit log:', { action, tableName, recordId });
            return { success: false, error: 'Supabase not configured' };
        }

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            
            const logEntry = {
                user_id: user?.id || null,
                action: action,
                table_name: tableName,
                record_id: recordId,
                old_values: oldValues,
                new_values: newValues,
                ip_address: await this.getClientIP(),
                user_agent: navigator.userAgent
            };

            const { data, error } = await supabaseClient
                .from('audit_logs')
                .insert(logEntry)
                .select();

            if (error) {
                console.error('Audit log error:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            console.error('Audit log exception:', err);
            return { success: false, error: err.message };
        }
    },

    // Get client IP (best effort)
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    },

    // Log reservation submission (TC-B4-01)
    async logReservationSubmitted(reservationId, facilityId, startTime, endTime) {
        return this.log(
            'reservation_submitted',
            'reservations',
            reservationId,
            null,
            { facility_id: facilityId, start_time: startTime, end_time: endTime, status: 'pending' }
        );
    },

    // Log reservation approval (TC-B4-03)
    async logReservationApproved(reservationId) {
        return this.log(
            'reservation_approved',
            'reservations',
            reservationId,
            { status: 'pending' },
            { status: 'approved' }
        );
    },

    // Log reservation rejection (TC-B4-04)
    async logReservationRejected(reservationId, reason) {
        return this.log(
            'reservation_rejected',
            'reservations',
            reservationId,
            { status: 'pending' },
            { status: 'rejected', rejection_reason: reason }
        );
    },

    // Log reservation cancellation
    async logReservationCancelled(reservationId) {
        return this.log(
            'reservation_cancelled',
            'reservations',
            reservationId,
            null,
            { status: 'cancelled' }
        );
    },

    // Log status change (generic)
    async logStatusChange(reservationId, oldStatus, newStatus) {
        return this.log(
            'status_change',
            'reservations',
            reservationId,
            { status: oldStatus },
            { status: newStatus }
        );
    },

    // Log facility update
    async logFacilityUpdate(facilityId, oldValues, newValues) {
        return this.log(
            'facility_updated',
            'facilities',
            facilityId,
            oldValues,
            newValues
        );
    },

    // Log facility creation
    async logFacilityCreated(facilityId, facilityData) {
        return this.log(
            'facility_created',
            'facilities',
            facilityId,
            null,
            facilityData
        );
    },

    // Log facility deletion
    async logFacilityDeleted(facilityId, facilityData) {
        return this.log(
            'facility_deleted',
            'facilities',
            facilityId,
            facilityData,
            null
        );
    },

    // Log user login
    async logLogin(userId) {
        return this.log(
            'user_login',
            'users',
            userId,
            null,
            { login_time: new Date().toISOString() }
        );
    },

    // Fetch audit logs (admin only)
    async fetchLogs(filters = {}) {
        if (!supabaseClient) return { data: [], error: 'Supabase not configured' };

        let query = supabaseClient
            .from('audit_logs')
            .select(`
                *,
                users:user_id (full_name, email, role)
            `)
            .order('created_at', { ascending: false });

        if (filters.table_name) {
            query = query.eq('table_name', filters.table_name);
        }
        if (filters.action) {
            query = query.eq('action', filters.action);
        }
        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        } else {
            query = query.limit(100);
        }

        return query;
    }
};
