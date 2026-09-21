// =====================================================
// AUTHENTICATION MODULE
// Handles login, logout, and session management
// =====================================================

const Auth = {
    currentUser: null,
    currentProfile: null,

    // Initialize auth state listener
    async init() {
        if (!supabaseClient) {
            console.warn('Supabase not configured');
            return;
        }

        // Check existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            await this.handleSession(session);
        }

        // Listen for auth changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                await this.handleSession(session);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.currentProfile = null;
                this.showLogin();
            }
        });
    },

    // Handle session after login
    async handleSession(session) {
        this.currentUser = session.user;
        
        // Fetch user profile with role
        const { data: profile, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
            alert('An error occurred while loading your profile. Please contact an administrator.');
            await this.logout();
            return;
        }

        if (!profile) {
            // User is authenticated in Supabase but has no profile row yet.
            // Auto-create one (falls back to requester role, then retries).
            const created = await this.createProfile(session.user);
            if (!created) {
                await this.logout();
            }
            return;
        }

        this.currentProfile = profile;
        
        // Check if user is active
        if (!profile.is_active) {
            alert('Your account has been deactivated. Please contact an administrator.');
            await this.logout();
            return;
        }

        // Log the login
        await AuditLogger.logLogin(session.user.id);

        // Show app
        this.showApp();
    },

    // Create user profile (for new users). Returns true on success.
    async createProfile(user, role = 'requester') {
        const { error } = await supabaseClient
            .from('users')
            .insert({
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email.split('@')[0],
                role: role
            });

        if (error) {
            console.error('Error creating profile:', error);
            alert('Your account has no user profile and I could not create one automatically. Please run the "AUTO-LINK USER PROFILES" SQL in the Supabase dashboard or contact an administrator.');
            return false;
        }

        // Re-fetch profile
        await this.handleSession({ user });
        return true;
    },

    // Login with email/password
    async login(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw error;
        }

        return data;
    },

    // Logout
    async logout() {
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
        }
        this.currentUser = null;
        this.currentProfile = null;
        this.showLogin();
    },

    // Get current user's role
    getRole() {
        return this.currentProfile?.role || null;
    },

    // Check if user has a specific permission
    hasPermission(permission) {
        if (!this.currentProfile) return false;
        const roleConfig = APP_CONFIG.roles[this.currentProfile.role];
        return roleConfig?.permissions.includes(permission) || false;
    },

    // Check if user has any of the given roles
    hasRole(...roles) {
        return roles.includes(this.currentProfile?.role);
    },

    // Show login page
    showLogin() {
        document.getElementById('login-page').classList.add('active');
        document.getElementById('app-container').classList.add('hidden');
    },

    // Show main app
    showApp() {
        document.getElementById('login-page').classList.remove('active');
        document.getElementById('app-container').classList.remove('hidden');
        
        // Update user info in sidebar
        document.getElementById('user-name').textContent = this.currentProfile.full_name;
        const roleBadge = document.getElementById('user-role');
        roleBadge.textContent = APP_CONFIG.roles[this.currentProfile.role]?.label;
        roleBadge.className = `role-badge role-${this.currentProfile.role}`;

        // Build navigation
        App.buildNavigation();
        App.loadDashboard();
    }
};

// =====================================================
// LOGIN FORM HANDLER
// =====================================================
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    
    errorDiv.textContent = '';
    
    try {
        await Auth.login(email, password);
    } catch (error) {
        errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
    }
});

// Logout button
document.getElementById('logout-btn').addEventListener('click', () => {
    Auth.logout();
});

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});
