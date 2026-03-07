"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
    ArrowLeft,
    Loader2,
    Mail,
    ShieldCheck,
    ShieldAlert,
    Smartphone,
    Calendar,
    Clock,
    Shield,
    Trash2,
    UserX,
    UserCheck,
    Plus,
    X
} from "lucide-react";

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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import Link from "next/link";

export default function PlatformUserDetailPage() {
    const { userId } = useParams<{ userId: string }>();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isAssignRoleOpen, setIsAssignRoleOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState("");

    // Fetch user details
    const { data: user, isLoading } = useQuery({
        queryKey: ["platformUser", userId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/platform/users/${userId}`);
            return data;
        },
        enabled: !!userId,
    });

    // Fetch available platform roles
    const { data: roles } = useQuery({
        queryKey: ["globalRoles"],
        queryFn: async () => {
            const { data } = await apiClient.get("/platform/roles");
            return data;
        },
    });

    // Update user status
    const updateStatusMutation = useMutation({
        mutationFn: async (status: string) => {
            await apiClient.patch(`/platform/users/${userId}`, { status });
        },
        onSuccess: () => {
            toast.success("User status updated");
            queryClient.invalidateQueries({ queryKey: ["platformUser", userId] });
            queryClient.invalidateQueries({ queryKey: ["allUsers"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to update user status");
        },
    });

    // Delete user
    const deleteMutation = useMutation({
        mutationFn: async () => {
            await apiClient.delete(`/platform/users/${userId}`);
        },
        onSuccess: () => {
            toast.success("User deleted successfully");
            router.push("/platform/users");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to delete user");
        },
    });

    // Assign role
    const assignRoleMutation = useMutation({
        mutationFn: async (roleName: string) => {
            await apiClient.post(`/platform/users/${userId}/roles`, { role_name: roleName });
        },
        onSuccess: () => {
            toast.success("Role assigned successfully");
            setIsAssignRoleOpen(false);
            setSelectedRole("");
            queryClient.invalidateQueries({ queryKey: ["platformUser", userId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to assign role");
        },
    });

    // Remove role
    const removeRoleMutation = useMutation({
        mutationFn: async (roleName: string) => {
            await apiClient.delete(`/platform/users/${userId}/roles/${roleName}`);
        },
        onSuccess: () => {
            toast.success("Role removed");
            queryClient.invalidateQueries({ queryKey: ["platformUser", userId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to remove role");
        },
    });

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">User not found.</p>
                <Button variant="outline" className="mt-4" asChild>
                    <Link href="/platform/users">Back to Users</Link>
                </Button>
            </div>
        );
    }

    const statusOptions = ["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING_VERIFICATION"];

    // Get user's platform roles
    const userPlatformRoles = user.roles?.filter((r: any) => r.role?.scope === "PLATFORM") || [];
    const assignedRoleNames = userPlatformRoles.map((r: any) => r.role?.name);
    const availableRoles = roles?.filter((r: any) => !assignedRoleNames.includes(r.name)) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/platform/users">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-background shadow-lg">
                            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                                {user.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {user.first_name || user.last_name
                                    ? `${user.first_name || ""} ${user.last_name || ""}`
                                    : user.email}
                            </h1>
                            <p className="text-sm text-muted-foreground font-mono">{user.email}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <UserCheck className="mr-2 h-4 w-4" />
                                Change Status
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {statusOptions.map((status) => (
                                <DropdownMenuItem
                                    key={status}
                                    onClick={() => updateStatusMutation.mutate(status)}
                                    className="cursor-pointer"
                                    disabled={user.status === status}
                                >
                                    <Badge
                                        variant={status === "ACTIVE" ? "default" : "secondary"}
                                        className="text-[10px] mr-2"
                                    >
                                        {status}
                                    </Badge>
                                    {user.status === status && <span className="text-xs text-muted-foreground ml-2">(current)</span>}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete User Account</DialogTitle>
                                <DialogDescription>
                                    This action is irreversible. All data associated with <strong>{user.email}</strong> will be permanently removed.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate()}
                                    disabled={deleteMutation.isPending}
                                >
                                    {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Delete permanently
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* User Profile */}
                <Card className="lg:col-span-2 shadow-sm border-muted overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-primary" />
                            User Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account ID</span>
                                <p className="text-sm font-mono bg-muted px-2 py-1 rounded truncate">{user.id}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</span>
                                <p className="text-sm font-medium">{user.username || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                                <div>
                                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"}>
                                        {user.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">MFA</span>
                                <div>
                                    {user.mfa_enabled ? (
                                        <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                                            <ShieldCheck className="h-3 w-3 mr-1" /> Enabled
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-muted-foreground border-muted">
                                            Disabled
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</span>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{user.email}</p>
                                    {user.is_email_verified ? (
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                            Verified
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                                            Unverified
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</span>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">{user.phone_number || "Not provided"}</p>
                                    {user.phone_number && (
                                        user.is_phone_verified ? (
                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                                Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px]">
                                                Unverified
                                            </Badge>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Login</span>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "Never"}
                                </div>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Authentication Strategies
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {user.auth_strategies?.map((s: string) => (
                                    <Badge key={s} variant="secondary" className="px-3 py-1 bg-primary/5 text-primary border-primary/10">
                                        {s.replace("_", " ").toUpperCase()}
                                    </Badge>
                                ))}
                                {(!user.auth_strategies || user.auth_strategies.length === 0) && (
                                    <p className="text-sm text-muted-foreground italic">No auth strategies recorded.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Platform Roles Card */}
                <Card className="shadow-sm border-muted overflow-hidden h-fit">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Platform Roles
                            </CardTitle>
                            <Dialog open={isAssignRoleOpen} onOpenChange={setIsAssignRoleOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs">
                                        <Plus className="mr-1 h-3 w-3" /> Assign
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Assign Platform Role</DialogTitle>
                                        <DialogDescription>
                                            Select a role to assign to {user.email}.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3 py-4">
                                        {availableRoles.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4">
                                                All available roles are already assigned.
                                            </p>
                                        ) : (
                                            <div className="space-y-2">
                                                {availableRoles.map((role: any) => (
                                                    <button
                                                        key={role.id}
                                                        onClick={() => setSelectedRole(role.name)}
                                                        className={`w-full text-left p-3 rounded-xl border transition-all ${selectedRole === role.name
                                                                ? "border-primary bg-primary/5"
                                                                : "border-muted hover:border-primary/30"
                                                            }`}
                                                    >
                                                        <p className="text-sm font-semibold">{role.name}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {role.description || "No description"}
                                                        </p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            onClick={() => assignRoleMutation.mutate(selectedRole)}
                                            disabled={!selectedRole || assignRoleMutation.isPending}
                                        >
                                            {assignRoleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Assign Role
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        {userPlatformRoles.length === 0 ? (
                            <p className="text-sm text-muted-foreground italic text-center py-6">No platform roles assigned.</p>
                        ) : (
                            userPlatformRoles.map((ra: any, idx: number) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-3 rounded-xl border border-muted bg-muted/10 group hover:border-primary/20 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-primary/10">
                                            <Shield className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{ra.role.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{ra.role.description}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                        onClick={() => {
                                            if (confirm(`Remove role "${ra.role.name}" from this user?`)) {
                                                removeRoleMutation.mutate(ra.role.name);
                                            }
                                        }}
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* All Roles (including tenant) */}
                {user.roles && user.roles.filter((r: any) => r.role?.scope !== "PLATFORM").length > 0 && (
                    <Card className="lg:col-span-3 shadow-sm border-muted overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-4">
                            <CardTitle>Tenant Roles</CardTitle>
                            <CardDescription>Roles assigned within specific organizations</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="divide-y divide-muted/50">
                                {user.roles
                                    .filter((r: any) => r.role?.scope !== "PLATFORM")
                                    .map((ra: any, idx: number) => (
                                        <div key={idx} className="py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm font-medium">{ra.role.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{ra.role.description}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-mono">
                                                Tenant: {ra.tenant_id?.slice(0, 8)}...
                                            </Badge>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
