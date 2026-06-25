"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { SocialProviderConfig } from "@/lib/types";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import {
    Globe,
    Trash2,
    ShieldCheck,
    Loader2,
    ExternalLink,
    Github,
    Chrome,
    MoreVertical,
    PlusCircle,
    AlertTriangle,
    Pencil
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface TenantSocialProvider extends SocialProviderConfig {
    id: string;
    redirect_uri?: string;
    oidc_discovery_url?: string;
    client_secret_prefix?: string;
    is_active?: boolean;
}

interface SocialProviderCreateForm {
    provider: string;
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    oidc_discovery_url: string;
}

interface SocialProviderUpdateForm {
    client_id: string;
    client_secret?: string;
    redirect_uri: string;
    oidc_discovery_url: string;
}

const PROVIDER_ICONS: Record<string, LucideIcon> = {
    google: Chrome,
    github: Github,
    oidc: Globe,
};

export default function TenantSocialPage() {
    const queryClient = useQueryClient();
    const { activeTenantId, activeTenant, isReady, isLoading: isLoadingTenant } = useActiveTenant();
    const [isAdding, setIsAdding] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingProvider, setEditingProvider] = useState<TenantSocialProvider | null>(null);
    const [deleteProviderTarget, setDeleteProviderTarget] = useState<string | null>(null);

    const [newProvider, setNewProvider] = useState<SocialProviderCreateForm>({
        provider: "google",
        client_id: "",
        client_secret: "",
        redirect_uri: "",
        oidc_discovery_url: ""
    });

    const [editForm, setEditForm] = useState<SocialProviderUpdateForm>({
        client_id: "",
        client_secret: "",
        redirect_uri: "",
        oidc_discovery_url: ""
    });

    const { data: providers, isLoading } = useQuery<TenantSocialProvider[]>({
        queryKey: ["tenantSocialProviders", activeTenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<TenantSocialProvider[]>(`/tenants/${activeTenantId}/social-providers`);
            return data;
        },
        enabled: isReady,
    });

    const createMutation = useMutation({
        mutationFn: async (payload: SocialProviderCreateForm) => {
            await apiClient.post(`/tenants/${activeTenantId}/social-providers`, payload);
        },
        onSuccess: () => {
            toast.success("Social provider added");
            setIsAdding(false);
            setNewProvider({ provider: "google", client_id: "", client_secret: "", redirect_uri: "", oidc_discovery_url: "" });
            queryClient.invalidateQueries({ queryKey: ["tenantSocialProviders", activeTenantId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to add social provider"));
        }
    });

    // 3. Update Provider (PUT)
    const updateMutation = useMutation({
        mutationFn: async ({ provider, payload }: { provider: string; payload: SocialProviderUpdateForm }) => {
            await apiClient.put(`/tenants/${activeTenantId}/social-providers/${provider}`, payload);
        },
        onSuccess: () => {
            toast.success("Social provider updated");
            setIsEditing(false);
            setEditingProvider(null);
            queryClient.invalidateQueries({ queryKey: ["tenantSocialProviders", activeTenantId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to update social provider"));
        }
    });

    // 4. Delete Provider
    const deleteMutation = useMutation({
        mutationFn: async (provider: string) => {
            await apiClient.delete(`/tenants/${activeTenantId}/social-providers/${provider}`);
        },
        onSuccess: () => {
            toast.success("Social provider removed");
            queryClient.invalidateQueries({ queryKey: ["tenantSocialProviders", activeTenantId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to remove social provider"));
        }
    });

    // 5. Toggle Provider
    const toggleMutation = useMutation({
        mutationFn: async ({ provider, is_active }: { provider: string, is_active: boolean }) => {
            await apiClient.patch(`/tenants/${activeTenantId}/social-providers/${provider}/toggle`, { is_active });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tenantSocialProviders", activeTenantId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to toggle provider"));
        }
    });

    const openEditDialog = (p: TenantSocialProvider) => {
        setEditingProvider(p);
        setEditForm({
            client_id: p.client_id || "",
            client_secret: "",
            redirect_uri: p.redirect_uri || "",
            oidc_discovery_url: p.oidc_discovery_url || ""
        });
        setIsEditing(true);
    };

    if (isLoadingTenant) {
        return (
            <div className="p-20 flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isReady) return <div className="p-8 text-center">Select an organization.</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Social Login (BYO-ID)</h1>
                    <p className="text-muted-foreground mt-1">
                        {activeTenant?.type === "PLATFORM"
                            ? "Configure social login providers used on the public login page."
                            : "Configure custom OAuth/OIDC providers for your organization members."}
                    </p>
                </div>

                {/* Add Provider Dialog */}
                <Dialog open={isAdding} onOpenChange={setIsAdding}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl shadow-lg shadow-primary/20">
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Provider
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add Social Identity Provider</DialogTitle>
                            <DialogDescription>
                                Configure own credentials for Google, GitHub, or any OIDC provider.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Provider</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={newProvider.provider}
                                    onChange={(e) => setNewProvider({ ...newProvider, provider: e.target.value })}
                                >
                                    <option value="google">Google</option>
                                    <option value="github">GitHub</option>
                                    <option value="authengine">AuthEngine Provider(our)</option>
                                </select>
                            </div>

                            {newProvider.provider === "authengine" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">AuthEngine Base URL</label>
                                    <Input
                                        placeholder="https://api.authengine.org"
                                        value={newProvider.oidc_discovery_url}
                                        onChange={(e) => setNewProvider({ ...newProvider, oidc_discovery_url: e.target.value })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        API root URL of the remote AuthEngine instance. A discovery URL ending in
                                        /.well-known/openid-configuration is also accepted.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Client ID</label>
                                <Input
                                    placeholder="Enter your Client ID"
                                    value={newProvider.client_id}
                                    onChange={(e) => setNewProvider({ ...newProvider, client_id: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Client Secret</label>
                                <Input
                                    type="password"
                                    placeholder="Enter your Client Secret"
                                    value={newProvider.client_secret}
                                    onChange={(e) => setNewProvider({ ...newProvider, client_secret: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Redirect URI</label>
                                <Input
                                    placeholder="https://app.authengine.org/oauth/authengine/callback"
                                    value={newProvider.redirect_uri}
                                    onChange={(e) => setNewProvider({ ...newProvider, redirect_uri: e.target.value })}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    This must match exactly the URI registered in your provider&apos;s console.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={() => createMutation.mutate(newProvider)}
                                disabled={createMutation.isPending || !newProvider.client_id}
                                className="w-full sm:w-auto"
                            >
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Provider
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Provider Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            Edit {editingProvider?.provider ? editingProvider.provider.charAt(0).toUpperCase() + editingProvider.provider.slice(1) : ""} Provider
                        </DialogTitle>
                        <DialogDescription>
                            Update the credentials and configuration for this social provider.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        {editingProvider?.provider === "authengine" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">AuthEngine Base URL</label>
                                <Input
                                    placeholder="https://api.authengine.org"
                                    value={editForm.oidc_discovery_url}
                                    onChange={(e) => setEditForm({ ...editForm, oidc_discovery_url: e.target.value })}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    API root URL of the remote AuthEngine instance. A discovery URL ending in
                                    /.well-known/openid-configuration is also accepted.
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Client ID</label>
                            <Input
                                placeholder="Enter your Client ID"
                                value={editForm.client_id}
                                onChange={(e) => setEditForm({ ...editForm, client_id: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Client Secret</label>
                            <Input
                                type="password"
                                placeholder="Leave blank to keep current secret"
                                value={editForm.client_secret}
                                onChange={(e) => setEditForm({ ...editForm, client_secret: e.target.value })}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Leave blank to keep the existing secret unchanged.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Redirect URI</label>
                            <Input
                                placeholder="https://app.authengine.org/oauth/authengine/callback"
                                value={editForm.redirect_uri}
                                onChange={(e) => setEditForm({ ...editForm, redirect_uri: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button
                            onClick={() => {
                                if (editingProvider) {
                                    const { client_secret, ...rest } = editForm;
                                    const payload: SocialProviderUpdateForm = client_secret
                                        ? { ...rest, client_secret }
                                        : rest;
                                    updateMutation.mutate({ provider: editingProvider.provider, payload });
                                }
                            }}
                            disabled={updateMutation.isPending || !editForm.client_id}
                        >
                            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : providers?.length === 0 ? (
                    <Card className="border-dashed py-20 text-center bg-muted/20">
                        <CardContent className="space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                <ShieldCheck className="h-6 w-6 text-muted-foreground opacity-40" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">No custom providers configured</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                                    Users will use the platform&apos;s default social login credentials unless you configure your own here.
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => setIsAdding(true)}>
                                Configure First Provider
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {providers?.map((p) => {
                            const Icon = PROVIDER_ICONS[p.provider] || Globe;
                            return (
                                <Card key={p.id} className="shadow-sm border-muted hover:border-primary/20 transition-all overflow-hidden group">
                                    <CardHeader className="p-4 sm:p-6 sm:flex-row items-center justify-between space-y-0 bg-muted/10">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-white border rounded-2xl shadow-sm text-foreground">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <CardTitle className="capitalize">{p.provider}</CardTitle>
                                                <CardDescription className="font-mono text-[10px] uppercase tracking-widest mt-0.5">
                                                    ID: {p.id.slice(0, 8)}...
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-4 sm:mt-0">
                                            <div className="flex items-center gap-2 mr-4">
                                                <span className="text-xs text-muted-foreground">{p.is_active ? "Active" : "Disabled"}</span>
                                                <Switch
                                                    checked={p.is_active}
                                                    onCheckedChange={(val) => toggleMutation.mutate({ provider: p.provider, is_active: val })}
                                                />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() => openEditDialog(p)}
                                                    >
                                                        <Pencil className="h-4 w-4 mr-2" /> Edit Configuration
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive cursor-pointer"
                                                        onClick={() => setDeleteProviderTarget(p.provider)}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 sm:p-6 grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Client ID</p>
                                            <p className="text-xs font-mono bg-muted p-2 rounded truncate" title={p.client_id}>
                                                {p.client_id}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Client Secret</p>
                                            <p className="text-xs font-mono bg-muted p-2 rounded">
                                                {p.client_secret_prefix}
                                            </p>
                                        </div>
                                        <div className="sm:col-span-2 space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Redirect URI</p>
                                            <p className="text-xs font-mono bg-muted p-2 rounded flex items-center justify-between">
                                                <span className="truncate mr-2">{p.redirect_uri}</span>
                                                <ExternalLink className="h-3 w-3 shrink-0" />
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Security Warning</p>
                    <p className="text-xs text-muted-foreground">
                        Ensure your redirect URIs are secured and match your provider&apos;s console exactly.
                        AuthEngine encrypts your Client IDs and Secrets at rest using platform-level keys.
                    </p>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleteProviderTarget}
                onOpenChange={(open) => !open && setDeleteProviderTarget(null)}
                title="Remove social provider?"
                description={
                    deleteProviderTarget
                        ? `The custom ${deleteProviderTarget} configuration will be deleted.`
                        : undefined
                }
                confirmLabel="Remove"
                loading={deleteMutation.isPending}
                onConfirm={() => {
                    if (deleteProviderTarget) {
                        deleteMutation.mutate(deleteProviderTarget);
                        setDeleteProviderTarget(null);
                    }
                }}
            />
        </div>
    );
}
