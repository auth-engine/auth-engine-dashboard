export interface UserResponse {
    id: string;
    email: string;
    username?: string;
    phone_number?: string | null;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    is_email_verified: boolean;
    is_phone_verified: boolean;
    mfa_enabled: boolean;
    auth_strategies: string[];
    created_at: string;
    last_login_at?: string | null;
    roles: Array<{
        role: {
            id: string;
            name: string;
            description: string;
            scope: string;
            level: number;
            created_at: string;
            permissions: Array<{
                id: string;
                name: string;
                description?: string;
            }>;
            permission_ids: string[];
        };
        tenant_id: string;
    }>;
}

export interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user?: UserResponse;
}

export interface TenantResponse {
    id: string;
    name: string;
    description?: string;
    type: string;
    owner_id: string;
}
export interface OAuthLoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    is_new_user: boolean;
    provider: "google" | "github" | "microsoft" | "authengine";
}

export interface MFAChallengeResponse {
    mfa_pending_token: string;
    message: string;
}

export interface ServiceKeyResponse {
    id: string;
    key_prefix: string;
    description?: string;
    created_at: string;
    last_used_at?: string | null;
    raw_key?: string; // Only present once on creation
}

export interface AuditLogEntry {
    id: string;
    action: string;
    actor_id: string;
    resource_type?: string;
    tenant_id?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    details?: Record<string, unknown>;
}

export interface ContactLead {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    job_title?: string;
    company: string;
    company_size?: string;
    country?: string;
    mau?: string;
    interest?: string;
    message?: string;
    consent: boolean;
    created_at: string;
    source?: string;
    ip_address?: string;
    user_agent?: string;
}

export interface Permission {
    id: string;
    name: string;
    description?: string;
}

export interface Role {
    id: string;
    name: string;
    description: string;
    scope: string;
    level: number;
    created_at: string;
    permissions: Permission[];
    permission_ids: string[];
}

export interface TenantAuthConfig {
    allowed_methods: string[];
    mfa_required: boolean;
    session_ttl_seconds: number;
    allowed_domains: string[];
    oidc_client_id?: string;
}

export interface EmailConfig {
    provider: string;
    from_email: string;
    api_key?: string;
    credential_hint?: string;
    is_active: boolean;
    platform_provider?: string;
    platform_from_email?: string;
}

export interface EmailConfigForm {
    provider: string;
    from_email: string;
    api_key: string;
    is_active: boolean;
}

export interface SmsConfigForm {
    provider: string;
    from_number: string;
    api_key: string;
    is_active: boolean;
}

export interface OAuthProvider {
    id: string;
    name: string;
    enabled: boolean;
    client_id?: string;
    client_secret?: string;
}

export interface SocialProviderConfig {
    provider: string;
    client_id: string;
    client_secret: string;
    is_enabled: boolean;
}

export interface SmsConfigResponse {
    provider: string;
    from_number: string;
    api_key?: string;
    credential_hint?: string;
    is_active: boolean;
    platform_provider?: string;
    platform_from_number?: string;
}

export interface LinkedOAuthAccount {
    provider: string;
    provider_user_id: string;
    email?: string;
    linked_at: string;
}
