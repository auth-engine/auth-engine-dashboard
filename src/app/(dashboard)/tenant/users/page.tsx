"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import { Role, TenantResponse, UserResponse } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { useActiveTenant } from "@/hooks/use-active-tenant";
import {
    UserPlus,
    Trash2,
    MoreVertical,
    Loader2,
    Search,
} from "lucide-react";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

const selectClassName =
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function TenantUsersPage() {
    const queryClient = useQueryClient();
    const { activeTenantId, user } = useAuthStore();
    const { tenants: myTenants } = useActiveTenant();
    const [inviteTenantId, setInviteTenantId] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRoleId, setInviteRoleId] = useState("");
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [removeTarget, setRemoveTarget] = useState<{ id: string; email: string } | null>(null);

    const hasPlatformScope =
        user?.roles?.some((r) => r.role.scope === "PLATFORM") ?? false;

    const { data: platformTenants = [] } = useQuery<TenantResponse[]>({
        queryKey: ["platformTenants"],
        queryFn: async () => {
            const { data } = await apiClient.get<TenantResponse[]>("/platform/tenants");
            return data;
        },
        enabled: hasPlatformScope,
    });

    const inviteTenants = useMemo(
        () => (hasPlatformScope ? platformTenants : myTenants),
        [hasPlatformScope, platformTenants, myTenants]
    );

    const { data: inviteTenantRoles = [], isLoading: isLoadingInviteRoles } = useQuery<Role[]>({
        queryKey: ["inviteTenantRoles", inviteTenantId, hasPlatformScope],
        queryFn: async () => {
            const url = hasPlatformScope
                ? `/platform/tenants/${inviteTenantId}/roles`
                : `/tenants/${inviteTenantId}/roles`;
            const { data } = await apiClient.get<Role[]>(url);
            return data;
        },
        enabled: !!inviteTenantId,
    });

    const defaultInviteRoleId = useMemo(() => {
        if (inviteTenantRoles.length === 0) return "";
        return (
            inviteTenantRoles.find((r) => r.name === "TENANT_USER")?.id ??
            inviteTenantRoles[0]?.id ??
            ""
        );
    }, [inviteTenantRoles]);

    const resolvedInviteRoleId = inviteRoleId || defaultInviteRoleId;

    const resetInviteForm = () => {
        setInviteEmail("");
        setInviteRoleId("");
        setInviteTenantId(activeTenantId ?? "");
    };

    const handleInviteOpenChange = (open: boolean) => {
        setIsInviteOpen(open);
        if (open) {
            const defaultTenant =
                inviteTenants.find((t) => t.id === activeTenantId)?.id ??
                inviteTenants[0]?.id ??
                "";
            setInviteTenantId(defaultTenant);
            setInviteEmail("");
            setInviteRoleId("");
        } else {
            resetInviteForm();
        }
    };

    // 1. Fetch Users
    const { data: users, isLoading } = useQuery<UserResponse[]>({
        queryKey: ["tenantUsers", activeTenantId],
        queryFn: async () => {
            if (!activeTenantId) return [];
            const { data } = await apiClient.get<UserResponse[]>(`/tenants/${activeTenantId}/users`);
            return data;
        },
        enabled: !!activeTenantId,
    });

    // 2. Invite User
    const inviteMutation = useMutation({
        mutationFn: async () => {
            const selectedRole = inviteTenantRoles.find((r) => r.id === resolvedInviteRoleId);
            await apiClient.post(`/tenants/${inviteTenantId}/users`, {
                email: inviteEmail.trim(),
                role_id: resolvedInviteRoleId || undefined,
                role_name: selectedRole?.name ?? "TENANT_USER",
            });
        },
        onSuccess: () => {
            const tenantName =
                inviteTenants.find((t) => t.id === inviteTenantId)?.name ?? "organization";
            toast.success(`Invite sent to ${inviteEmail.trim()} for ${tenantName}`);
            setIsInviteOpen(false);
            resetInviteForm();
            queryClient.invalidateQueries({ queryKey: ["tenantUsers", inviteTenantId] });
            if (inviteTenantId !== activeTenantId) {
                queryClient.invalidateQueries({ queryKey: ["tenantUsers", activeTenantId] });
            }
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to send invitation"));
        },
    });

    const canSendInvite =
        !!inviteTenantId &&
        !!resolvedInviteRoleId &&
        inviteEmail.includes("@") &&
        !inviteMutation.isPending;

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        const query = searchTerm.trim().toLowerCase();
        if (!query) return users;
        return users.filter(
            (u) =>
                u.email.toLowerCase().includes(query) ||
                u.id.toLowerCase().includes(query) ||
                u.username?.toLowerCase().includes(query)
        );
    }, [users, searchTerm]);

    // 3. Remove User
    const removeMutation = useMutation({
        mutationFn: async (userId: string) => {
            await apiClient.delete(`/tenants/${activeTenantId}/users/${userId}`);
        },
        onSuccess: () => {
            toast.success("User removed from organization");
            queryClient.invalidateQueries({ queryKey: ["tenantUsers", activeTenantId] });
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to remove user"));
        },
    });

    if (!activeTenantId) {
        return <div className="p-8 text-center text-muted-foreground">Please select an organization first.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Members who have access to this organization.
                    </p>
                </div>

                <Dialog open={isInviteOpen} onOpenChange={handleInviteOpenChange}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl shadow-lg shadow-primary/20">
                            <UserPlus className="mr-2 h-4 w-4" /> Invite User
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Invite a team member</DialogTitle>
                            <DialogDescription>
                                Choose an organization and role, then enter their email. They will
                                receive an email with instructions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="invite-tenant">Organization</Label>
                                <select
                                    id="invite-tenant"
                                    className={selectClassName}
                                    value={inviteTenantId}
                                    onChange={(e) => {
                                        setInviteTenantId(e.target.value);
                                        setInviteRoleId("");
                                    }}
                                >
                                    <option value="">Select organization...</option>
                                    {inviteTenants.map((tenant) => (
                                        <option key={tenant.id} value={tenant.id}>
                                            {tenant.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-role">Role</Label>
                                <select
                                    id="invite-role"
                                    className={selectClassName}
                                    value={inviteRoleId || defaultInviteRoleId}
                                    onChange={(e) => setInviteRoleId(e.target.value)}
                                    disabled={!inviteTenantId || isLoadingInviteRoles}
                                >
                                    <option value="">
                                        {!inviteTenantId
                                            ? "Select an organization first"
                                            : isLoadingInviteRoles
                                              ? "Loading roles..."
                                              : inviteTenantRoles.length === 0
                                                ? "No roles available"
                                                : "Select role..."}
                                    </option>
                                    {inviteTenantRoles.map((role) => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                            {role.description ? ` — ${role.description}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-email">Email address</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    disabled={!inviteTenantId || !resolvedInviteRoleId}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={() => inviteMutation.mutate()}
                                disabled={!canSendInvite}
                                className="w-full sm:w-auto"
                            >
                                {inviteMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users by email..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Card className="shadow-sm overflow-hidden border-muted">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date Added</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{user.email}</span>
                                                <span className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">{user.id}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"} className="text-[10px] h-5">
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem className="cursor-pointer">View profile</DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer">Edit permissions</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive cursor-pointer"
                                                    onClick={() =>
                                                        setRemoveTarget({
                                                            id: user.id,
                                                            email: user.email,
                                                        })
                                                    }
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Remove User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        {users?.length
                                            ? "No users match your search."
                                            : "No users found in this organization."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <ConfirmDialog
                open={!!removeTarget}
                onOpenChange={(open) => !open && setRemoveTarget(null)}
                title="Remove user from organization?"
                description={
                    removeTarget
                        ? `${removeTarget.email} will lose access to this organization.`
                        : undefined
                }
                confirmLabel="Remove"
                loading={removeMutation.isPending}
                onConfirm={() => {
                    if (removeTarget) {
                        removeMutation.mutate(removeTarget.id);
                        setRemoveTarget(null);
                    }
                }}
            />
        </div>
    );
}
