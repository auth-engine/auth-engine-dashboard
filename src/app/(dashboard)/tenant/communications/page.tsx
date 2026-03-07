"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
    Mail,
    Smartphone,
    Send,
    CheckCircle2,
    XCircle,
    Loader2,
    Save,
    Trash2,
    AlertCircle
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function TenantCommunicationsPage() {
    const queryClient = useQueryClient();
    const { activeTenantId } = useAuthStore();

    // ── Email State ──
    const [emailForm, setEmailForm] = useState<any>({
        provider: "smtp",
        from_email: "",
        api_key: "",
        is_active: true
    });
    const [testEmail, setTestEmail] = useState("");

    // ── SMS State ──
    const [smsForm, setSmsForm] = useState<any>({
        provider: "twilio",
        from_number: "",
        api_key: "",
        is_active: true
    });
    const [testPhone, setTestPhone] = useState("");

    // ── Email Queries ──
    const { data: emailConfig, isLoading: isLoadingEmail } = useQuery({
        queryKey: ["tenantEmailConfig", activeTenantId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/tenants/${activeTenantId}/email-config`);
            return data;
        },
        enabled: !!activeTenantId,
    });

    useEffect(() => {
        if (emailConfig && !emailConfig.platform_provider) {
            setEmailForm({
                provider: emailConfig.provider,
                from_email: emailConfig.from_email,
                api_key: "",
                is_active: emailConfig.is_active
            });
        }
    }, [emailConfig]);

    // ── SMS Queries ──
    const { data: smsConfig, isLoading: isLoadingSms } = useQuery({
        queryKey: ["tenantSmsConfig", activeTenantId],
        queryFn: async () => {
            const { data } = await apiClient.get(`/tenants/${activeTenantId}/sms-config`);
            return data;
        },
        enabled: !!activeTenantId,
    });

    useEffect(() => {
        if (smsConfig && !smsConfig.platform_provider) {
            setSmsForm({
                provider: smsConfig.provider,
                from_number: smsConfig.from_number,
                api_key: "",
                is_active: smsConfig.is_active
            });
        }
    }, [smsConfig]);

    // ── Email Mutations ──
    const saveEmailMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (emailConfig?.platform_provider) {
                await apiClient.post(`/tenants/${activeTenantId}/email-config`, payload);
            } else {
                await apiClient.put(`/tenants/${activeTenantId}/email-config`, payload);
            }
        },
        onSuccess: () => {
            toast.success("Email configuration saved");
            queryClient.invalidateQueries({ queryKey: ["tenantEmailConfig", activeTenantId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to save email config");
        }
    });

    const testEmailMutation = useMutation({
        mutationFn: async (toEmail: string) => {
            const { data } = await apiClient.post(`/tenants/${activeTenantId}/email-config/test`, { to_email: toEmail });
            return data;
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Test email sent successfully!");
            } else {
                toast.error(`Failed to send test email: ${data.error}`);
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Test email request failed");
        }
    });

    // ── SMS Mutations ──
    const saveSMSMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (smsConfig?.platform_provider) {
                await apiClient.post(`/tenants/${activeTenantId}/sms-config`, payload);
            } else {
                await apiClient.put(`/tenants/${activeTenantId}/sms-config`, payload);
            }
        },
        onSuccess: () => {
            toast.success("SMS configuration saved");
            queryClient.invalidateQueries({ queryKey: ["tenantSmsConfig", activeTenantId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to save SMS config");
        }
    });

    const deleteSMSMutation = useMutation({
        mutationFn: async () => {
            await apiClient.delete(`/tenants/${activeTenantId}/sms-config`);
        },
        onSuccess: () => {
            toast.success("SMS config removed, reverted to platform default");
            setSmsForm({ provider: "twilio", from_number: "", api_key: "", is_active: true });
            queryClient.invalidateQueries({ queryKey: ["tenantSmsConfig", activeTenantId] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to remove SMS config");
        }
    });

    const testSMSMutation = useMutation({
        mutationFn: async (toNumber: string) => {
            const { data } = await apiClient.post(`/tenants/${activeTenantId}/sms-config/test`, { to_number: toNumber });
            return data;
        },
        onSuccess: (data) => {
            if (data.success) {
                toast.success("Test SMS sent successfully!");
            } else {
                toast.error(`Failed to send test SMS: ${data.error}`);
            }
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Test SMS request failed");
        }
    });

    if (!activeTenantId) return <div className="p-8 text-center">Select an organization.</div>;

    const isUsingPlatformEmail = !!emailConfig?.platform_provider;
    const isUsingPlatformSMS = !!smsConfig?.platform_provider;

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
                <p className="text-muted-foreground mt-1">
                    Configure custom email and SMS providers for your organization&apos;s notifications.
                </p>
            </div>

            <div className="grid gap-8">
                {/* ─── Email Configuration ─── */}
                <Card className="shadow-sm border-muted overflow-hidden">
                    <CardHeader className="bg-primary/[0.02] border-b border-muted">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-primary" />
                                    Email Provider
                                </CardTitle>
                                <CardDescription>
                                    Emails are sent for magic links, password resets, and invitations.
                                </CardDescription>
                            </div>
                            {isUsingPlatformEmail ? (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Using Platform Default
                                </Badge>
                            ) : (
                                <Badge variant="default" className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Custom Config Active
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {isUsingPlatformEmail && (
                            <div className="p-4 bg-muted/40 rounded-xl border border-muted text-sm space-y-2">
                                <p className="font-semibold">Default Provider Active</p>
                                <p className="text-muted-foreground text-xs">
                                    Currently using <strong>{emailConfig.platform_provider}</strong> from <strong>{emailConfig.platform_from_email}</strong>.
                                    Configure your own provider below to use a custom &quot;From&quot; address and dedicated reputation.
                                </p>
                            </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Provider Type</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={emailForm.provider}
                                    onChange={(e) => setEmailForm({ ...emailForm, provider: e.target.value })}
                                >
                                    <option value="smtp">SMTP (Universal)</option>
                                    <option value="sendgrid">SendGrid</option>
                                    <option value="mailgun">Mailgun</option>
                                    <option value="aws_ses">AWS SES</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">From Email Address</label>
                                <Input
                                    placeholder="auth@yourdomain.com"
                                    value={emailForm.from_email}
                                    onChange={(e) => setEmailForm({ ...emailForm, from_email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Key or Credentials</label>
                            <Input
                                type="password"
                                placeholder={emailConfig?.credential_hint ? `Stored: ${emailConfig.credential_hint}` : "Paste your API key or SMTP string"}
                                value={emailForm.api_key}
                                onChange={(e) => setEmailForm({ ...emailForm, api_key: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold">Activate this configuration</p>
                                <p className="text-xs text-muted-foreground">When enabled, platform defaults will be ignored.</p>
                            </div>
                            <Switch
                                checked={emailForm.is_active}
                                onCheckedChange={(val) => setEmailForm({ ...emailForm, is_active: val })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 flex justify-between gap-4 p-4">
                        <div className="flex gap-2 flex-1">
                            <Input
                                placeholder="Test email recipient"
                                className="max-w-[200px] h-9 text-xs"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testEmailMutation.mutate(testEmail)}
                                disabled={testEmailMutation.isPending || !testEmail || isUsingPlatformEmail}
                            >
                                {testEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                Send Test
                            </Button>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => saveEmailMutation.mutate(emailForm)}
                            disabled={saveEmailMutation.isPending}
                        >
                            {saveEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save className="mr-2 h-4 w-4" /> Save Config
                        </Button>
                    </CardFooter>
                </Card>

                {/* ─── SMS Configuration ─── */}
                <Card className="shadow-sm border-muted overflow-hidden">
                    <CardHeader className="bg-primary/[0.02] border-b border-muted">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-primary" />
                                    SMS Gateway
                                </CardTitle>
                                <CardDescription>
                                    Set up Twilio or MessageBird for SMS-based MFA and notifications.
                                </CardDescription>
                            </div>
                            {isUsingPlatformSMS ? (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Using Platform Default
                                </Badge>
                            ) : smsConfig ? (
                                <Badge variant="default" className="flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Custom Config Active
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    Not Configured
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {isUsingPlatformSMS && (
                            <div className="p-4 bg-muted/40 rounded-xl border border-muted text-sm space-y-2">
                                <p className="font-semibold">Platform Default Active</p>
                                <p className="text-muted-foreground text-xs">
                                    Currently using <strong>{smsConfig.platform_provider}</strong> from <strong>{smsConfig.platform_from_number}</strong>.
                                    Configure your own provider below to use a custom sender number.
                                </p>
                            </div>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">SMS Provider</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={smsForm.provider}
                                    onChange={(e) => setSmsForm({ ...smsForm, provider: e.target.value })}
                                >
                                    <option value="twilio">Twilio</option>
                                    <option value="messagebird">MessageBird</option>
                                    <option value="vonage">Vonage (Nexmo)</option>
                                    <option value="aws_sns">AWS SNS</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">From Number</label>
                                <Input
                                    placeholder="+1234567890"
                                    value={smsForm.from_number}
                                    onChange={(e) => setSmsForm({ ...smsForm, from_number: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Key / Auth Token</label>
                            <Input
                                type="password"
                                placeholder={smsConfig?.credential_hint ? `Stored: ${smsConfig.credential_hint}` : "Paste your API key or auth token"}
                                value={smsForm.api_key}
                                onChange={(e) => setSmsForm({ ...smsForm, api_key: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/10">
                            <div className="space-y-0.5">
                                <p className="text-sm font-semibold">Activate this configuration</p>
                                <p className="text-xs text-muted-foreground">When enabled, platform SMS defaults will be ignored.</p>
                            </div>
                            <Switch
                                checked={smsForm.is_active}
                                onCheckedChange={(val) => setSmsForm({ ...smsForm, is_active: val })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 flex justify-between gap-4 p-4">
                        <div className="flex gap-2 flex-1">
                            <Input
                                placeholder="Test phone number"
                                className="max-w-[200px] h-9 text-xs"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value)}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testSMSMutation.mutate(testPhone)}
                                disabled={testSMSMutation.isPending || !testPhone || isUsingPlatformSMS}
                            >
                                {testSMSMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                Send Test
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            {!isUsingPlatformSMS && smsConfig && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                        if (confirm("Remove custom SMS config and revert to platform default?")) {
                                            deleteSMSMutation.mutate();
                                        }
                                    }}
                                    disabled={deleteSMSMutation.isPending}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Reset
                                </Button>
                            )}
                            <Button
                                size="sm"
                                onClick={() => saveSMSMutation.mutate(smsForm)}
                                disabled={saveSMSMutation.isPending}
                            >
                                {saveSMSMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" /> Save Config
                            </Button>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
