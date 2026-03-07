"use client"
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { format, parseISO, isValid } from "date-fns";
import {
    ShieldAlert,
    ShieldCheck,
    Mail,
    Smartphone,
    User as UserIcon,
    Calendar,
    Clock,
    Shield,
    Briefcase,
    Globe,
    Pencil,
    Settings,
    Link2,
    Lock,
    Send,
    Loader2,
    ExternalLink
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EditProfileForm } from "./edit-profile-form";
import { toast } from "sonner";
import { FaGoogle, FaGithub, FaMicrosoft } from "react-icons/fa";

const PROVIDER_ICONS: Record<string, any> = {
    google: FaGoogle,
    github: FaGithub,
    microsoft: FaMicrosoft,
};

const PROVIDER_COLORS: Record<string, string> = {
    google: "text-red-500",
    github: "text-foreground",
    microsoft: "text-blue-600",
};

export default function MeProfilePage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSetPasswordOpen, setIsSetPasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Linked OAuth Accounts
    const { data: linkedAccounts, isLoading: isLoadingAccounts } = useQuery({
        queryKey: ["linkedOAuthAccounts"],
        queryFn: async () => {
            const { data } = await apiClient.get("/auth/oauth/accounts");
            return data;
        },
        enabled: !!user,
    });

    // Check if user has password strategy
    const hasPassword = user?.auth_strategies?.includes("password") || user?.auth_strategies?.includes("local");

    // Set password mutation
    const setPasswordMutation = useMutation({
        mutationFn: async (password: string) => {
            await apiClient.post("/auth/set-password", { password });
        },
        onSuccess: () => {
            toast.success("Password set successfully!");
            setIsSetPasswordOpen(false);
            setNewPassword("");
            setConfirmPassword("");
            // Refresh user data
            queryClient.invalidateQueries({ queryKey: ["verifyUser"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to set password");
        },
    });

    // Resend verification email
    const resendVerificationMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post("/auth/request-token", { scope: "email_verification" });
        },
        onSuccess: () => {
            toast.success("Verification email sent! Check your inbox.");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to send verification email");
        },
    });

    if (!user) return null;

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return "Never";
        const date = parseISO(dateString);
        return isValid(date) ? format(date, "PPP p") : "Invalid Date";
    };

    const getInitials = () => {
        if (!user.first_name && !user.last_name) return user.username?.[0]?.toUpperCase() || "U";
        return `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase();
    };

    const handleLinkProvider = (provider: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        window.location.href = `${baseUrl}/auth/oauth/${provider}/link`;
    };

    const linkableProviders = ["google", "github", "microsoft"];
    const linkedProviderNames = linkedAccounts?.map((a: any) => a.provider) || [];
    const unlinkableProviders = linkableProviders.filter(p => !linkedProviderNames.includes(p));

    return (
        <div className="mx-auto max-w-5xl space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                    <AvatarImage src={user.avatar_url || ""} alt={user.username || "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {getInitials()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {user.first_name} {user.last_name}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        @{user.username} • Manage your identity and see your access across the platform.
                    </p>
                    <div className="mt-4 flex gap-3">
                        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Pencil className="h-4 w-4" />
                                    Edit Profile
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Edit Profile</DialogTitle>
                                    <DialogDescription>
                                        Update your personal information and profile settings.
                                    </DialogDescription>
                                </DialogHeader>
                                <EditProfileForm onSuccess={() => setIsEditOpen(false)} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Personal Information */}
                <Card className="lg:col-span-2 shadow-sm border-muted/50 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-primary" />
                            <CardTitle>Personal Information</CardTitle>
                        </div>
                        <CardDescription>
                            Your core identity details on the platform
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First Name</span>
                                <p className="text-base font-medium">{user.first_name || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last Name</span>
                                <p className="text-base font-medium">{user.last_name || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</span>
                                <p className="text-base font-medium text-primary font-mono">{user.username || "—"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account Status</span>
                                <div>
                                    <Badge variant={user.status === "ACTIVE" ? "default" : "secondary"} className="capitalize">
                                        {user.status.toLowerCase()}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <Separator className="opacity-50" />

                        <div className="grid sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</span>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-base font-medium">{user.email}</p>
                                    </div>
                                    {user.is_email_verified ? (
                                        <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 font-normal">
                                            <ShieldCheck className="h-3 w-3" /> Verified
                                        </Badge>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="w-fit bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1 font-normal">
                                                <ShieldAlert className="h-3 w-3" /> Action Required
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 text-xs text-primary"
                                                onClick={() => resendVerificationMutation.mutate()}
                                                disabled={resendVerificationMutation.isPending}
                                            >
                                                {resendVerificationMutation.isPending ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <Send className="h-3 w-3 mr-1" />
                                                )}
                                                Resend
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</span>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-base font-medium">{user.phone_number || "Not provided"}</p>
                                    </div>
                                    {user.phone_number && (
                                        user.is_phone_verified ? (
                                            <Badge variant="outline" className="w-fit bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1 font-normal">
                                                <ShieldCheck className="h-3 w-3" /> Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="w-fit bg-amber-500/10 text-amber-600 border-amber-500/20 flex items-center gap-1 font-normal">
                                                <ShieldAlert className="h-3 w-3" /> Unverified
                                            </Badge>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Account Metadata */}
                <Card className="shadow-sm border-muted/50 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">Account Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Member Since</p>
                                <p className="text-sm font-medium">{formatDate(user.created_at)}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="space-y-0.5">
                                <p className="text-xs font-medium text-muted-foreground uppercase">Last Activity</p>
                                <p className="text-sm font-medium">{formatDate(user.last_login_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security & Access */}
                <Card className="shadow-sm border-muted/50 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <CardTitle>Security & Access</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-muted/50">
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold">Two-Step Verification</p>
                                <p className="text-xs text-muted-foreground">Secure your account with MFA</p>
                            </div>
                            {user.mfa_enabled ? (
                                <Badge className="bg-emerald-500 hover:bg-emerald-600">Enabled</Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground border-muted">Disabled</Badge>
                            )}
                        </div>

                        {/* Set Password for OAuth users */}
                        {!hasPassword && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-semibold">Set Password</p>
                                    <p className="text-xs text-muted-foreground">Add a password to your account</p>
                                </div>
                                <Dialog open={isSetPasswordOpen} onOpenChange={setIsSetPasswordOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-7 text-xs">
                                            <Lock className="mr-1 h-3 w-3" /> Set Password
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Set Account Password</DialogTitle>
                                            <DialogDescription>
                                                Add a password to your account to enable email/password login alongside your social logins.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">New Password</label>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter a strong password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Confirm Password</label>
                                                <Input
                                                    type="password"
                                                    placeholder="Confirm your password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                onClick={() => setPasswordMutation.mutate(newPassword)}
                                                disabled={
                                                    setPasswordMutation.isPending ||
                                                    !newPassword ||
                                                    newPassword.length < 8 ||
                                                    newPassword !== confirmPassword
                                                }
                                            >
                                                {setPasswordMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Set Password
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}

                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Active Authentication Methods
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {user.auth_strategies.map((strategy) => (
                                    <Badge key={strategy} variant="secondary" className="px-3 py-1 bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 transition-colors">
                                        {strategy.replace("_", " ").toUpperCase()}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Linked OAuth Accounts */}
                <Card className="lg:col-span-2 shadow-sm border-muted/50 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Link2 className="h-5 w-5 text-primary" />
                                <CardTitle>Linked Accounts</CardTitle>
                            </div>
                        </div>
                        <CardDescription>
                            Social accounts linked to your identity for quick sign-in
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                        {isLoadingAccounts ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                                {/* Linked accounts list */}
                                {linkedAccounts && linkedAccounts.length > 0 ? (
                                    <div className="space-y-3">
                                        {linkedAccounts.map((account: any) => {
                                            const Icon = PROVIDER_ICONS[account.provider] || Globe;
                                            const colorClass = PROVIDER_COLORS[account.provider] || "text-muted-foreground";
                                            return (
                                                <div
                                                    key={account.provider}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-muted bg-muted/10"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-background border">
                                                            <Icon className={`h-5 w-5 ${colorClass}`} />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold capitalize">{account.provider}</p>
                                                            <p className="text-[10px] text-muted-foreground">{account.email || account.provider_user_id}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                                        Connected
                                                    </Badge>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic text-center py-4">
                                        No linked social accounts yet.
                                    </p>
                                )}

                                {/* Link new providers */}
                                {unlinkableProviders.length > 0 && (
                                    <div className="pt-2">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-3">Link another account</p>
                                        <div className="flex flex-wrap gap-2">
                                            {unlinkableProviders.map((provider) => {
                                                const Icon = PROVIDER_ICONS[provider] || Globe;
                                                const colorClass = PROVIDER_COLORS[provider] || "text-muted-foreground";
                                                return (
                                                    <Button
                                                        key={provider}
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2 capitalize"
                                                        onClick={() => handleLinkProvider(provider)}
                                                    >
                                                        <Icon className={`h-4 w-4 ${colorClass}`} />
                                                        Link {provider}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Roles & Tenants */}
                <Card className="lg:col-span-3 shadow-sm border-muted/50 overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" />
                                <CardTitle>Platform Roles & Access</CardTitle>
                            </div>
                        </div>
                        <CardDescription>
                            Your permissions and assigned roles across tenants
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 p-0">
                        <div className="divide-y divide-muted/50">
                            {user.roles && user.roles.length > 0 ? (
                                user.roles.map((roleAssignment, idx) => (
                                    <div key={idx} className="p-6 hover:bg-muted/10 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                                    <Shield className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg leading-none">{roleAssignment.role.name}</p>
                                                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                                                        {roleAssignment.role.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3 md:items-end">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-full">
                                                <Globe className="h-3.5 w-3.5" />
                                                <span className="font-medium">Tenant:</span>
                                                <span className="font-mono text-foreground tracking-tight">{roleAssignment.tenant_id}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs font-semibold">
                                                    Level {roleAssignment.role.level}
                                                </Badge>
                                                <Badge variant="outline" className="bg-muted border-muted-foreground/20 text-xs font-semibold">
                                                    {roleAssignment.role.scope} Scope
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-muted-foreground">
                                    <Briefcase className="h-10 w-10 mx-auto opacity-20 mb-4" />
                                    <p className="font-medium">No roles assigned yet.</p>
                                    <p className="text-sm opacity-70">Contact an administrator for access.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
