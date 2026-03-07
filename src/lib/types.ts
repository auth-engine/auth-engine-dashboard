export interface UserResponse {
    id: string;
    email: string;
    username?: string;
    phone_number?: string | null;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
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
    details?: Record<string, any>;
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
