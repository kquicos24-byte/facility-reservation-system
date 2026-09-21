// =====================================================
// MAIN APPLICATION MODULE
// Handles all UI and business logic
// =====================================================

// Escape user-controlled values before rendering into innerHTML (XSS guard)
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const App = {
    currentSection: 'dashboard',
    facilities: [],
    reservations: [],
    users: [],

    // =====================================================
    // NAVIGATION
    // =====================================================
    buildNavigation() {
        const menu = document.getElementById('nav-menu');
        const role = Auth.getRole();
        
        const menuItems = [
            { id: 'dashboard', label: 'Dashboard', icon: '&#9632;', roles: ['administrator', 'facility_staff', 'requester'] },
            { id: 'facilities', label: 'Facilities', icon: '&#9632;', roles: ['administrator', 'facility_staff', 'requester'] },
            { id: 'reservations', label: 'All Reservations', icon: '&#9632;', roles: ['administrator', 'facility_staff'] },
            { id: 'new-reservation', label: 'New Reservation', icon: '&#9632;', roles: ['requester'] },
            { id: 'my-reservations', label: 'My Reservations', icon: '&#9632;', roles: ['requester'] },
            { id: 'approvals', label: 'Approval Queue', icon: '&#9632;', roles: ['administrator'] },
            { id: 'services', label: 'Service Requests', icon: '&#9632;', roles: ['administrator', 'facility_staff'] },
            { id: 'users', label: 'User Management', icon: '&#9632;', roles: ['administrator'] },
            { id: 'audit', label: 'Audit Logs', icon: '&#9632;', roles: ['administrator'] }
        ];

        menu.innerHTML = menuItems
            .filter(item => item.roles.includes(role))
            .map(item => `
                <li>
                    <a href="#" data-section="${item.id}" class="${item.id === 'dashboard' ? 'active' : ''}">
                        <span>${item.icon}</span> ${item.label}
                    </a>
                </li>
            `).join('');

        // Add click handlers
        menu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.navigateTo(section);
            });
        });
    },

    navigateTo(section) {
        // Update active menu item
        document.querySelectorAll('#nav-menu a').forEach(a => a.classList.remove('active'));
        document.querySelector(`#nav-menu a[data-section="${section}"]`)?.classList.add('active');

        // Show section
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${section}`)?.classList.add('active');

        this.currentSection = section;

        // Load section data
        switch(section) {
            case 'dashboard': this.loadDashboard(); break;
            case 'facilities': this.loadFacilities(); break;
            case 'reservations': this.loadReservations(); break;
            case 'my-reservations': this.loadMyReservations(); break;
            case 'approvals': this.loadApprovals(); break;
            case 'services': this.loadServices(); break;
            case 'users': this.loadUsers(); break;
            case 'audit': this.loadAuditLogs(); break;
            case 'new-reservation': this.loadReservationForm(); break;
        }
    },

    // =====================================================
    // DASHBOARD
    // =====================================================
    async loadDashboard() {
        const role = Auth.getRole();
        const statsDiv = document.getElementById('dashboard-stats');
        const contentDiv = document.getElementById('dashboard-content');

        // Fetch stats based on role
        let stats = {};
        
        if (role === 'administrator') {
            stats = await this.getAdminStats();
        } else if (role === 'facility_staff') {
            stats = await this.getStaffStats();
        } else {
            stats = await this.getRequesterStats();
        }

        statsDiv.innerHTML = Object.entries(stats).map(([key, val]) => `
            <div class="stat-card ${val.color || ''}">
                <h3>${val.label}</h3>
                <div class="stat-value">${val.value}</div>
            </div>
        `).join('');

        // Load recent activity
        contentDiv.innerHTML = '<h3>Recent Activity</h3>';
        const { data: recentLogs } = await AuditLogger.fetchLogs({ limit: 10 });
        
        if (recentLogs && recentLogs.length > 0) {
            const tableHtml = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Table</th>
                                <th>User</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentLogs.map(log => `
                                <tr>
                                    <td><span class="status-badge status-${log.action.includes('approved') ? 'approved' : log.action.includes('rejected') ? 'rejected' : 'pending'}">${log.action.replace(/_/g, ' ')}</span></td>
                                    <td>${log.table_name}</td>
<td>${escapeHtml(log.users?.full_name) || 'System'}</td>
                                    <td>${new Date(log.created_at).toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            contentDiv.innerHTML += tableHtml;
        }
    },

    async getAdminStats() {
        const [facilities, reservations, pending] = await Promise.all([
            supabaseClient.from('facilities').select('id', { count: 'exact', head: true }),
            supabaseClient.from('reservations').select('id', { count: 'exact', head: true }),
            supabaseClient.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'pending')
        ]);

        return {
            facilities: { label: 'Total Facilities', value: facilities.count || 0, color: 'primary' },
            reservations: { label: 'Total Reservations', value: reservations.count || 0, color: 'info' },
            pending: { label: 'Pending Approvals', value: pending.count || 0, color: 'warning' }
        };
    },

    async getStaffStats() {
        const [active, inUse, services] = await Promise.all([
            supabaseClient.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
            supabaseClient.from('reservations').select('id', { count: 'exact', head: true }).eq('status', 'in_use'),
            supabaseClient.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'open')
        ]);

        return {
            scheduled: { label: 'Scheduled Today', value: active.count || 0, color: 'primary' },
            inUse: { label: 'Currently In Use', value: inUse.count || 0, color: 'info' },
            services: { label: 'Open Service Requests', value: services.count || 0, color: 'warning' }
        };
    },

    async getRequesterStats() {
        const userId = Auth.currentUser?.id;
        const [pending, approved, total] = await Promise.all([
            supabaseClient.from('reservations').select('id', { count: 'exact', head: true }).eq('requester_id', userId).eq('status', 'pending'),
            supabaseClient.from('reservations').select('id', { count: 'exact', head: true }).eq('requester_id', userId).eq('status', 'approved'),
            supabaseClient.from('reservations').select('id', { count: 'exact', head: true }).eq('requester_id', userId)
        ]);

        return {
            pending: { label: 'Pending', value: pending.count || 0, color: 'warning' },
            approved: { label: 'Approved', value: approved.count || 0, color: 'success' },
            total: { label: 'My Reservations', value: total.count || 0, color: 'primary' }
        };
    },

    // =====================================================
    // FACILITIES
    // =====================================================
    async loadFacilities() {
        const role = Auth.getRole();
        const toolbar = document.getElementById('facilities-toolbar');
        
        // Show add button for admins
        if (role === 'administrator') {
            toolbar.innerHTML = `
                <button class="btn btn-primary" onclick="App.showFacilityModal()">
                    + Add Facility
                </button>
            `;
        } else {
            toolbar.innerHTML = '';
        }

        // Fetch facilities
        let query = supabaseClient.from('facilities').select('*').order('name');
        
        // Non-admins only see active facilities
        if (role !== 'administrator') {
            query = query.eq('status', 'active');
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error loading facilities:', error);
            return;
        }

        this.facilities = data;
        this.renderFacilities(data);
    },

    renderFacilities(facilities) {
        const container = document.getElementById('facilities-list');
        const role = Auth.getRole();

        container.innerHTML = facilities.map(f => `
            <div class="card">
                <div class="card-header">
                    <h4>${escapeHtml(f.name)}</h4>
                    <span class="status-badge status-${f.status}">${f.status}</span>
                </div>
                <div class="card-body">
                    <p>${escapeHtml(f.description) || 'No description'}</p>
                    <p><strong>Location:</strong> ${escapeHtml(f.location) || 'N/A'}</p>
                    <p><strong>Capacity:</strong> ${f.capacity} persons</p>
                </div>
                <div class="card-footer">
                    ${role === 'requester' && f.status === 'active' ? 
                        `<button class="btn btn-primary btn-sm" onclick="App.reserveFacility('${f.id}')">Reserve</button>` : ''}
                    ${role === 'administrator' ? `
                        <button class="btn btn-secondary btn-sm" onclick="App.editFacility('${f.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="App.deleteFacility('${f.id}')">Delete</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    showFacilityModal(facility = null) {
        const modal = document.getElementById('facility-modal');
        const title = document.getElementById('facility-modal-title');
        
        if (facility) {
            title.textContent = 'Edit Facility';
            document.getElementById('facility-id').value = facility.id;
            document.getElementById('facility-name').value = facility.name;
            document.getElementById('facility-description').value = facility.description || '';
            document.getElementById('facility-location').value = facility.location || '';
            document.getElementById('facility-capacity').value = facility.capacity;
            document.getElementById('facility-status').value = facility.status;
        } else {
            title.textContent = 'Add Facility';
            document.getElementById('facility-form').reset();
            document.getElementById('facility-id').value = '';
        }
        
        modal.classList.remove('hidden');
    },

    async editFacility(id) {
        const facility = this.facilities.find(f => f.id === id);
        if (facility) this.showFacilityModal(facility);
    },

    async deleteFacility(id) {
        if (!confirm('Are you sure you want to delete this facility?')) return;

        const facility = this.facilities.find(f => f.id === id);
        
        const { error } = await supabaseClient.from('facilities').delete().eq('id', id);
        
        if (error) {
            this.showToast('Error deleting facility: ' + error.message, 'error');
            return;
        }

        await AuditLogger.logFacilityDeleted(id, facility);
        this.showToast('Facility deleted successfully', 'success');
        this.loadFacilities();
    },

    reserveFacility(facilityId) {
        document.getElementById('res-facility').value = facilityId;
        this.navigateTo('new-reservation');
    },

    // =====================================================
    // RESERVATIONS
    // =====================================================
    async loadReservations() {
        const { data, error } = await supabaseClient
            .from('reservations')
            .select(`
                *,
                facilities:facility_id (name, location),
                requester:requester_id (full_name, email)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading reservations:', error);
            return;
        }

        this.reservations = data;
        this.renderReservationsTable(data, 'reservations-list');
    },

    async loadMyReservations() {
        const userId = Auth.currentUser?.id;
        const { data, error } = await supabaseClient
            .from('reservations')
            .select(`
                *,
                facilities:facility_id (name, location)
            `)
            .eq('requester_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading reservations:', error);
            return;
        }

        this.renderReservationsTable(data, 'my-reservations-list', true);
    },

    renderReservationsTable(reservations, containerId, isMyReservations = false) {
        const container = document.getElementById(containerId);
        const role = Auth.getRole();

        if (!reservations || reservations.length === 0) {
            container.innerHTML = '<div class="card"><p>No reservations found.</p></div>';
            return;
        }

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Facility</th>
                            <th>Title</th>
                            <th>Requester</th>
                            <th>Start</th>
                            <th>End</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reservations.map(r => `
                            <tr>
                                <td>${escapeHtml(r.facilities?.name) || 'N/A'}</td>
                                <td>${escapeHtml(r.title)}</td>
                                <td>${escapeHtml(r.requester?.full_name) || 'N/A'}</td>
                                <td>${new Date(r.start_time).toLocaleString()}</td>
                                <td>${new Date(r.end_time).toLocaleString()}</td>
                                <td><span class="status-badge status-${r.status}">${r.status}</span></td>
                                <td>
                                    <button class="btn btn-secondary btn-sm" onclick="App.viewReservation('${r.id}')">View</button>
                                    ${isMyReservations && r.status === 'pending' ? 
                                        `<button class="btn btn-danger btn-sm" onclick="App.cancelReservation('${r.id}')">Cancel</button>` : ''}
                                    ${role === 'administrator' && r.status === 'pending' ? `
                                        <button class="btn btn-success btn-sm" onclick="App.approveReservation('${r.id}')">Approve</button>
                                        <button class="btn btn-danger btn-sm" onclick="App.rejectReservation('${r.id}')">Reject</button>
                                    ` : ''}
                                    ${role === 'facility_staff' && r.status === 'scheduled' ? 
                                        `<button class="btn btn-primary btn-sm" onclick="App.markInUse('${r.id}')">Mark In Use</button>` : ''}
                                    ${role === 'facility_staff' && r.status === 'in_use' ? 
                                        `<button class="btn btn-success btn-sm" onclick="App.completeReservation('${r.id}')">Complete</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    async viewReservation(id) {
        const { data: reservation, error } = await supabaseClient
            .from('reservations')
            .select(`
                *,
                facilities:facility_id (name, location, capacity),
                requester:requester_id (full_name, email),
                approver:approved_by (full_name)
            `)
            .eq('id', id)
            .single();

        if (error) {
            this.showToast('Error loading reservation', 'error');
            return;
        }

        const modal = document.getElementById('reservation-modal');
        const detail = document.getElementById('reservation-detail');
        const actions = document.getElementById('reservation-actions');

        // Build workflow visualization
        const statuses = ['pending', 'approved', 'scheduled', 'in_use', 'completed'];
        const currentIdx = statuses.indexOf(reservation.status);

        detail.innerHTML = `
            <div class="workflow">
                ${statuses.map((s, i) => `
                    <span class="workflow-step ${i <= currentIdx ? 'active' : ''}">${s}</span>
                    ${i < statuses.length - 1 ? '<span class="workflow-arrow">&rarr;</span>' : ''}
                `).join('')}
            </div>
            <hr style="margin: 1rem 0; border-color: var(--border);">
            <p><strong>Facility:</strong> ${escapeHtml(reservation.facilities?.name)}</p>
            <p><strong>Location:</strong> ${escapeHtml(reservation.facilities?.location)}</p>
            <p><strong>Capacity:</strong> ${reservation.facilities?.capacity} persons</p>
            <p><strong>Title:</strong> ${escapeHtml(reservation.title)}</p>
            <p><strong>Description:</strong> ${escapeHtml(reservation.description) || 'N/A'}</p>
            <p><strong>Requester:</strong> ${escapeHtml(reservation.requester?.full_name)}</p>
            <p><strong>Start:</strong> ${new Date(reservation.start_time).toLocaleString()}</p>
            <p><strong>End:</strong> ${new Date(reservation.end_time).toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${reservation.status}">${reservation.status}</span></p>
            ${reservation.approved_by && reservation.status !== 'rejected' ? `<p><strong>Approved by:</strong> ${escapeHtml(reservation.approver?.full_name)}</p>` : ''}
            ${reservation.status === 'rejected' && reservation.approved_by ? `<p><strong>Rejected by:</strong> ${escapeHtml(reservation.approver?.full_name)}</p>` : ''}
            ${reservation.rejection_reason ? `<p><strong>Rejection reason:</strong> ${escapeHtml(reservation.rejection_reason)}</p>` : ''}
        `;

        actions.innerHTML = '';
        modal.classList.remove('hidden');
    },

    // =====================================================
    // NEW RESERVATION
    // =====================================================
    async loadReservationForm() {
        const select = document.getElementById('res-facility');
        const { data } = await supabaseClient.from('facilities').select('id, name').eq('status', 'active').order('name');
        
        select.innerHTML = '<option value="">Select a facility</option>' +
            (data || []).map(f => `<option value="${f.id}">${escapeHtml(f.name)}</option>`).join('');

        // Set min date to now
        const now = new Date().toISOString().slice(0, 16);
        document.getElementById('res-start').min = now;
        document.getElementById('res-end').min = now;
    },

    // =====================================================
    // APPROVAL WORKFLOW
    // =====================================================
    async approveReservation(id) {
        if (!confirm('Approve this reservation?')) return;

        // Check for conflicts (BR-B4-03)
        const reservation = this.reservations.find(r => r.id === id);
        
        const { data: conflicts } = await supabaseClient
            .from('reservations')
            .select('id')
            .eq('facility_id', reservation.facility_id)
            .in('status', ['approved', 'scheduled', 'in_use'])
            .neq('id', id)
            .lt('start_time', reservation.end_time)
            .gt('end_time', reservation.start_time);

        if (conflicts && conflicts.length > 0) {
            this.showToast('Cannot approve: Overlapping schedule detected (BR-B4-03)', 'error');
            return;
        }

        // Update status -> scheduled (approval reserves the slot, BR-B4-06)
        const { error } = await supabaseClient
            .from('reservations')
            .update({
                status: 'scheduled',
                approved_by: Auth.currentUser.id,
                approved_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            this.showToast('Error approving reservation: ' + error.message, 'error');
            return;
        }

        this.showToast('Reservation approved and scheduled', 'success');
        this.loadReservations();
    },

    async rejectReservation(id) {
        const reason = prompt('Enter rejection reason:');
        if (reason === null) return;

        const { error } = await supabaseClient
            .from('reservations')
            .update({
                status: 'rejected',
                rejection_reason: reason || 'No reason provided',
                approved_by: Auth.currentUser.id,
                approved_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            this.showToast('Error rejecting reservation: ' + error.message, 'error');
            return;
        }

        this.showToast('Reservation rejected', 'success');
        this.loadReservations();
    },

    async loadApprovals() {
        const { data, error } = await supabaseClient
            .from('reservations')
            .select(`
                *,
                facilities:facility_id (name, location),
                requester:requester_id (full_name, email)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading approvals:', error);
            return;
        }

        this.reservations = data;
        this.renderReservationsTable(data, 'approvals-list');
    },

    async cancelReservation(id) {
        if (!confirm('Cancel this reservation?')) return;

        const { error } = await supabaseClient
            .from('reservations')
            .update({ status: 'cancelled' })
            .eq('id', id)
            .eq('requester_id', Auth.currentUser.id)
            .eq('status', 'pending'); // BR-B4-09: Only pending can be cancelled

        if (error) {
            this.showToast('Error cancelling reservation: ' + error.message, 'error');
            return;
        }

        this.showToast('Reservation cancelled', 'success');
        this.loadMyReservations();
    },

    async markInUse(id) {
        const { error } = await supabaseClient
            .from('reservations')
            .update({ status: 'in_use' })
            .eq('id', id);

        if (error) {
            this.showToast('Error updating status: ' + error.message, 'error');
            return;
        }

        this.showToast('Reservation marked as In Use', 'success');
        this.loadReservations();
    },

    async completeReservation(id) {
        const { error } = await supabaseClient
            .from('reservations')
            .update({ status: 'completed' })
            .eq('id', id);

        if (error) {
            this.showToast('Error completing reservation: ' + error.message, 'error');
            return;
        }

        this.showToast('Reservation completed', 'success');
        this.loadReservations();
    },

    // =====================================================
    // SERVICE REQUESTS
    // =====================================================
    async loadServices() {
        const { data, error } = await supabaseClient
            .from('service_requests')
            .select(`
                *,
                facilities:facility_id (name),
                creator:created_by (full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading services:', error);
            return;
        }

        this.renderServices(data);
    },

    renderServices(services) {
        const container = document.getElementById('services-list');
        const role = Auth.getRole();

        container.innerHTML = `
            ${role === 'facility_staff' ? `
                <button class="btn btn-primary" onclick="App.showServiceModal()" style="margin-bottom: 1rem;">
                    + New Service Request
                </button>
            ` : ''}
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Facility</th>
                            <th>Title</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Created By</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${services.map(s => `
                            <tr>
                                <td>${escapeHtml(s.facilities?.name) || 'N/A'}</td>
                                <td>${escapeHtml(s.title)}</td>
                                <td><span class="status-badge status-${s.priority === 'urgent' ? 'rejected' : s.priority === 'high' ? 'pending' : 'scheduled'}">${s.priority}</span></td>
                                <td><span class="status-badge status-${s.status}">${s.status}</span></td>
                                <td>${escapeHtml(s.creator?.full_name) || 'N/A'}</td>
                                <td>${new Date(s.created_at).toLocaleString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // =====================================================
    // USERS
    // =====================================================
    async loadUsers() {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .order('full_name');

        if (error) {
            console.error('Error loading users:', error);
            return;
        }

        this.users = data;
        this.renderUsers(data);
    },

    renderUsers(users) {
        const container = document.getElementById('users-list');

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${escapeHtml(u.full_name)}</td>
                                <td>${escapeHtml(u.email)}</td>
                                <td><span class="role-badge role-${u.role}">${APP_CONFIG.roles[u.role]?.label || u.role}</span></td>
                                <td><span class="status-badge status-${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
                                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // =====================================================
    // AUDIT LOGS
    // =====================================================
    async loadAuditLogs() {
        const filtersDiv = document.getElementById('audit-filters');
        filtersDiv.innerHTML = `
            <div class="filters">
                <select id="audit-table-filter" onchange="App.filterAuditLogs()">
                    <option value="">All Tables</option>
                    <option value="reservations">Reservations</option>
                    <option value="facilities">Facilities</option>
                    <option value="users">Users</option>
                </select>
                <select id="audit-action-filter" onchange="App.filterAuditLogs()">
                    <option value="">All Actions</option>
                    <option value="reservation_submitted">Reservation Submitted</option>
                    <option value="reservation_approved">Reservation Approved</option>
                    <option value="reservation_rejected">Reservation Rejected</option>
                    <option value="reservation_cancelled">Reservation Cancelled</option>
                    <option value="status_change">Status Change</option>
                    <option value="facility_created">Facility Created</option>
                    <option value="facility_updated">Facility Updated</option>
                    <option value="facility_deleted">Facility Deleted</option>
                </select>
            </div>
        `;

        await this.filterAuditLogs();
    },

    async filterAuditLogs() {
        const tableFilter = document.getElementById('audit-table-filter')?.value;
        const actionFilter = document.getElementById('audit-action-filter')?.value;

        const filters = {};
        if (tableFilter) filters.table_name = tableFilter;
        if (actionFilter) filters.action = actionFilter;

        const { data, error } = await AuditLogger.fetchLogs(filters);

        if (error) {
            console.error('Error loading audit logs:', error);
            return;
        }

        this.renderAuditLogs(data);
    },

    renderAuditLogs(logs) {
        const container = document.getElementById('audit-list');

        container.innerHTML = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>Table</th>
                            <th>User</th>
                            <th>Record ID</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => `
                            <tr>
                                <td>${new Date(log.created_at).toLocaleString()}</td>
                                <td><span class="status-badge status-${log.action.includes('approved') ? 'approved' : log.action.includes('rejected') ? 'rejected' : 'pending'}">${log.action.replace(/_/g, ' ')}</span></td>
                                <td>${log.table_name}</td>
                                <td>${escapeHtml(log.users?.full_name) || 'System'}</td>
                                <td><small>${log.record_id?.substring(0, 8) || 'N/A'}</small></td>
                                <td><small>${log.old_values ? escapeHtml(JSON.stringify(log.old_values)).substring(0, 50) : ''} ${log.new_values ? escapeHtml(JSON.stringify(log.new_values)).substring(0, 50) : ''}</small></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    // =====================================================
    // FORM SUBMISSIONS
    // =====================================================
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 3000);
    }
};

// =====================================================
// FORM EVENT LISTENERS
// =====================================================

// Facility form
document.getElementById('facility-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('facility-id').value;
    const facilityData = {
        name: document.getElementById('facility-name').value,
        description: document.getElementById('facility-description').value,
        location: document.getElementById('facility-location').value,
        capacity: parseInt(document.getElementById('facility-capacity').value),
        status: document.getElementById('facility-status').value
    };

    let error;

    if (id) {
        // Update
        const { error: updateError } = await supabaseClient
            .from('facilities')
            .update(facilityData)
            .eq('id', id);
        error = updateError;
        
        if (!error) {
            await AuditLogger.logFacilityUpdate(id, {}, facilityData);
            App.showToast('Facility updated', 'success');
        }
    } else {
        // Create
        facilityData.created_by = Auth.currentUser.id;
        const { data, error: insertError } = await supabaseClient
            .from('facilities')
            .insert(facilityData)
            .select();
        error = insertError;
        
        if (!error && data) {
            await AuditLogger.logFacilityCreated(data[0].id, facilityData);
            App.showToast('Facility created', 'success');
        }
    }

    if (error) {
        App.showToast('Error: ' + error.message, 'error');
        return;
    }

    document.getElementById('facility-modal').classList.add('hidden');
    App.loadFacilities();
});

// Reservation form
document.getElementById('reservation-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const facilityId = document.getElementById('res-facility').value;
    const startTime = document.getElementById('res-start').value;
    const endTime = document.getElementById('res-end').value;

    // BR-B4-02: Start must precede end
    if (new Date(startTime) >= new Date(endTime)) {
        App.showToast('Start time must be before end time (BR-B4-02)', 'error');
        return;
    }

    // Check for conflicts (BR-B4-03)
    const { data: conflicts } = await supabaseClient
        .from('reservations')
        .select('id')
        .eq('facility_id', facilityId)
        .in('status', ['approved', 'scheduled', 'in_use'])
        .lt('start_time', endTime)
        .gt('end_time', startTime);

    if (conflicts && conflicts.length > 0) {
        App.showToast('Overlapping approved schedule detected (BR-B4-03)', 'error');
        return;
    }

    const reservationData = {
        facility_id: facilityId,
        requester_id: Auth.currentUser.id,
        title: document.getElementById('res-title').value,
        description: document.getElementById('res-description').value,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        status: 'pending'
    };

    const { data, error } = await supabaseClient
        .from('reservations')
        .insert(reservationData)
        .select();

    if (error) {
        App.showToast('Error: ' + error.message, 'error');
        return;
    }

    App.showToast('Reservation submitted successfully', 'success');
    document.getElementById('reservation-form').reset();
    App.navigateTo('my-reservations');
});

// Modal close handlers
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.closest('.modal').classList.add('hidden');
    });
});

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});
