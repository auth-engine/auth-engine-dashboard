"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Plus, Smartphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { getApiErrorMessage } from "@/lib/errors";
import {
    EmailConfigForm,
    EmailConfigListResponse,
    SmsConfigForm,
    SmsConfigListResponse,
} from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";
import { ConfirmDialog } from "@/components/confirm-dialog";

const PROVIDER_LABELS: Record<string, string> = {
    sendgrid: "SendGrid",
    ses: "AWS SES",
    twilio: "Twilio",
    android_gateway: "Android Gateway",
};

function providerLabel(value: string) {
    return PROVIDER_LABELS[value] ?? value;
}

function ConfigRow({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value}</span>
        </div>
    );
}

function EmailSection({
    activeTenantId,
    data,
    isLoading,
}: {
    activeTenantId: string;
    data?: EmailConfigListResponse;
    isLoading: boolean;
}) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [form, setForm] = useState<EmailConfigForm>({
        provider: "ses",
        from_email: "",
        api_key: "",
        set_active: true,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ["tenantEmailConfig", activeTenantId] });

    const createMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(`/tenants/${activeTenantId}/email-config`, form);
        },
        onSuccess: () => {
            toast.success("Email configuration added");
            setOpen(false);
            setForm({ provider: "ses", from_email: "", api_key: "", set_active: true });
            invalidate();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to add email config"));
        },
    });

    const activateMutation = useMutation({
        mutationFn: async (configId: string) => {
            await apiClient.put(`/tenants/${activeTenantId}/email-config/${configId}`, {
                set_active: true,
            });
        },
        onSuccess: () => {
            toast.success("Active email configuration updated");
            invalidate();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to activate configuration"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (configId: string) => {
            await apiClient.delete(`/tenants/${activeTenantId}/email-config/${configId}`);
        },
        onSuccess: () => {
            toast.success("Email configuration removed");
            invalidate();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to delete configuration"));
        },
    });

    const providers = data?.available_providers ?? ["sendgrid", "ses"];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Mail className="h-5 w-5 text-primary" />
                            Email
                        </CardTitle>
                        <CardDescription>
                            Magic links, password resets, and invitations.
                        </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {data?.using_platform_default ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Using platform default:{" "}
                                <strong>{providerLabel(data.platform_provider ?? "")}</strong>
                                {" · "}
                                {data.platform_from_email}
                            </div>
                        ) : null}
                        {data?.items.length ? (
                            data.items.map((item) => (
                                <div key={item.id} className="rounded-lg border p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-medium">
                                            {providerLabel(item.provider)}
                                        </div>
                                        <Badge variant={item.is_active ? "default" : "secondary"}>
                                            {item.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <ConfigRow label="From" value={item.from_email} />
                                    <ConfigRow label="Credentials" value={item.credential_hint} />
                                    <div className="flex flex-wrap gap-2">
                                        {!item.is_active ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={activateMutation.isPending}
                                                onClick={() => activateMutation.mutate(item.id)}
                                            >
                                                Set active
                                            </Button>
                                        ) : null}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive hover:text-destructive"
                                            disabled={deleteMutation.isPending}
                                            onClick={() => setDeleteTargetId(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !data?.using_platform_default && (
                                <p className="text-sm text-muted-foreground">
                                    No configurations yet.
                                </p>
                            )
                        )}
                    </>
                )}
            </CardContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add email configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.provider}
                                onChange={(e) =>
                                    setForm({ ...form, provider: e.target.value })
                                }
                            >
                                {providers.map((provider) => (
                                    <option key={provider} value={provider}>
                                        {providerLabel(provider)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>From email</Label>
                            <Input
                                type="email"
                                value={form.from_email}
                                onChange={(e) =>
                                    setForm({ ...form, from_email: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>API key</Label>
                            <Input
                                type="password"
                                value={form.api_key}
                                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => createMutation.mutate()}
                            disabled={createMutation.isPending || !form.from_email || !form.api_key}
                        >
                            {createMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTargetId}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                title="Delete this configuration?"
                description="This action cannot be undone."
                confirmLabel="Delete"
                loading={deleteMutation.isPending}
                onConfirm={() => {
                    if (deleteTargetId) {
                        deleteMutation.mutate(deleteTargetId);
                        setDeleteTargetId(null);
                    }
                }}
            />
        </Card>
    );
}

function SmsSection({
    activeTenantId,
    data,
    isLoading,
}: {
    activeTenantId: string;
    data?: SmsConfigListResponse;
    isLoading: boolean;
}) {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [form, setForm] = useState<SmsConfigForm>({
        provider: "android_gateway",
        from_number: "gateway",
        api_key: "",
        account_sid: "",
        set_active: true,
    });

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: ["tenantSmsConfig", activeTenantId] });

    const createMutation = useMutation({
        mutationFn: async () => {
            await apiClient.post(`/tenants/${activeTenantId}/sms-config`, {
                ...form,
                account_sid: form.account_sid || null,
            });
        },
        onSuccess: () => {
            toast.success("SMS configuration added");
            setOpen(false);
            setForm({
                provider: "android_gateway",
                from_number: "gateway",
                api_key: "",
                account_sid: "",
                set_active: true,
            });
            invalidate();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to add SMS config"));
        },
    });

    const activateMutation = useMutation({
        mutationFn: async (configId: string) => {
            await apiClient.put(`/tenants/${activeTenantId}/sms-config/${configId}`, {
                set_active: true,
            });
        },
        onSuccess: () => {
            toast.success("Active SMS configuration updated");
            invalidate();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to activate configuration"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (configId: string) => {
            await apiClient.delete(`/tenants/${activeTenantId}/sms-config/${configId}`);
        },
        onSuccess: () => {
            toast.success("SMS configuration removed");
            invalidate();
        },
        onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error, "Failed to delete configuration"));
        },
    });

    const providers = data?.available_providers ?? ["twilio", "android_gateway"];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Smartphone className="h-5 w-5 text-primary" />
                            SMS
                        </CardTitle>
                        <CardDescription>SMS OTP and phone verification.</CardDescription>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {data?.using_platform_default ? (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                Using platform default:{" "}
                                <strong>{providerLabel(data.platform_provider ?? "")}</strong>
                                {" · "}
                                {data.platform_from_number}
                            </div>
                        ) : null}
                        {data?.items.length ? (
                            data.items.map((item) => (
                                <div key={item.id} className="rounded-lg border p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="font-medium">
                                            {providerLabel(item.provider)}
                                        </div>
                                        <Badge variant={item.is_active ? "default" : "secondary"}>
                                            {item.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <ConfigRow label="From" value={item.from_number} />
                                    {item.account_sid ? (
                                        <ConfigRow
                                            label="Gateway / account"
                                            value={item.account_sid}
                                        />
                                    ) : null}
                                    <ConfigRow label="Credentials" value={item.credential_hint} />
                                    <div className="flex flex-wrap gap-2">
                                        {!item.is_active ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={activateMutation.isPending}
                                                onClick={() => activateMutation.mutate(item.id)}
                                            >
                                                Set active
                                            </Button>
                                        ) : null}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-destructive hover:text-destructive"
                                            disabled={deleteMutation.isPending}
                                            onClick={() => setDeleteTargetId(item.id)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !data?.using_platform_default && (
                                <p className="text-sm text-muted-foreground">
                                    No configurations yet.
                                </p>
                            )
                        )}
                    </>
                )}
            </CardContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add SMS configuration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Provider</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={form.provider}
                                onChange={(e) =>
                                    setForm({ ...form, provider: e.target.value })
                                }
                            >
                                {providers.map((provider) => (
                                    <option key={provider} value={provider}>
                                        {providerLabel(provider)}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label>From number / sender id</Label>
                            <Input
                                value={form.from_number}
                                onChange={(e) =>
                                    setForm({ ...form, from_number: e.target.value })
                                }
                            />
                        </div>
                        {form.provider === "android_gateway" ? (
                            <div className="space-y-2">
                                <Label>Gateway URL</Label>
                                <Input
                                    value={form.account_sid}
                                    onChange={(e) =>
                                        setForm({ ...form, account_sid: e.target.value })
                                    }
                                    placeholder="https://api.sms-gate.app/3rdparty/v1"
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Twilio account SID</Label>
                                <Input
                                    value={form.account_sid}
                                    onChange={(e) =>
                                        setForm({ ...form, account_sid: e.target.value })
                                    }
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>API key / auth token</Label>
                            <Input
                                type="password"
                                value={form.api_key}
                                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => createMutation.mutate()}
                            disabled={createMutation.isPending || !form.from_number || !form.api_key}
                        >
                            {createMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleteTargetId}
                onOpenChange={(open) => !open && setDeleteTargetId(null)}
                title="Delete this configuration?"
                description="This action cannot be undone."
                confirmLabel="Delete"
                loading={deleteMutation.isPending}
                onConfirm={() => {
                    if (deleteTargetId) {
                        deleteMutation.mutate(deleteTargetId);
                        setDeleteTargetId(null);
                    }
                }}
            />
        </Card>
    );
}

export default function TenantCommunicationsPage() {
    const { activeTenantId } = useAuthStore();

    const { data: emailData, isLoading: isLoadingEmail } = useQuery({
        queryKey: ["tenantEmailConfig", activeTenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<EmailConfigListResponse>(
                `/tenants/${activeTenantId}/email-config`
            );
            return data;
        },
        enabled: !!activeTenantId,
    });

    const { data: smsData, isLoading: isLoadingSms } = useQuery({
        queryKey: ["tenantSmsConfig", activeTenantId],
        queryFn: async () => {
            const { data } = await apiClient.get<SmsConfigListResponse>(
                `/tenants/${activeTenantId}/sms-config`
            );
            return data;
        },
        enabled: !!activeTenantId,
    });

    if (!activeTenantId) {
        return <div className="p-8 text-center text-muted-foreground">Select an organization.</div>;
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
                <p className="text-muted-foreground mt-1">
                    Add multiple email and SMS providers. Only the active configuration is used.
                </p>
            </div>

            <EmailSection
                activeTenantId={activeTenantId}
                data={emailData}
                isLoading={isLoadingEmail}
            />
            <SmsSection activeTenantId={activeTenantId} data={smsData} isLoading={isLoadingSms} />
        </div>
    );
}
