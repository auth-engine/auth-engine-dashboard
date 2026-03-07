"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useState } from "react";
import {
    Key,
    Plus,
    Trash2,
    Loader2,
    Copy,
    Eye,
    EyeOff,
    AlertTriangle,
    CheckCircle2,
    Clock
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ServiceKeysPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [description, setDescription] = useState("");
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);

    // Fetch service keys
    const { data: keys, isLoading } = useQuery({
        queryKey: ["serviceKeys"],
        queryFn: async () => {
            const { data } = await apiClient.get("/auth/service-keys");
            return data;
        },
    });

    // Create service key
    const createMutation = useMutation({
        mutationFn: async (desc: string) => {
            const { data } = await apiClient.post("/auth/service-keys", {
                description: desc || undefined,
            });
            return data;
        },
        onSuccess: (data) => {
            setNewlyCreatedKey(data.raw_key || data.key);
            setShowKey(true);
            setDescription("");
            toast.success("Service key created! Copy it now — it won't be shown again.");
            queryClient.invalidateQueries({ queryKey: ["serviceKeys"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to create service key");
        },
    });

    // Revoke service key
    const revokeMutation = useMutation({
        mutationFn: async (keyId: string) => {
            await apiClient.delete(`/auth/service-keys/${keyId}`);
        },
        onSuccess: () => {
            toast.success("Service key revoked");
            queryClient.invalidateQueries({ queryKey: ["serviceKeys"] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Failed to revoke service key");
        },
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Service Keys</h1>
                    <p className="text-muted-foreground mt-1">
                        Machine-to-machine API keys for platform integrations and automation.
                    </p>
                </div>

                <Dialog open={isCreating} onOpenChange={(open) => {
                    setIsCreating(open);
                    if (!open) {
                        setNewlyCreatedKey(null);
                        setShowKey(false);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="rounded-xl shadow-lg shadow-foreground/20 bg-foreground text-background hover:bg-foreground/90">
                            <Plus className="mr-2 h-4 w-4" /> Generate Key
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{newlyCreatedKey ? "Key Created Successfully" : "Generate Service Key"}</DialogTitle>
                            <DialogDescription>
                                {newlyCreatedKey
                                    ? "Copy your key now. It will not be shown again."
                                    : "Create a new API key for machine-to-machine integrations."}
                            </DialogDescription>
                        </DialogHeader>
                        {newlyCreatedKey ? (
                            <div className="space-y-4 py-4">
                                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Save this key</p>
                                        <p className="text-xs text-muted-foreground">
                                            This is the only time the full key will be displayed. Store it securely.
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <Input
                                        readOnly
                                        value={showKey ? newlyCreatedKey : "•".repeat(40)}
                                        className="font-mono text-xs pr-20"
                                    />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => setShowKey(!showKey)}
                                        >
                                            {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => copyToClipboard(newlyCreatedKey)}
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description (optional)</label>
                                    <Input
                                        placeholder="e.g. CI/CD Pipeline, Data Sync Service"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            {newlyCreatedKey ? (
                                <Button onClick={() => { setIsCreating(false); setNewlyCreatedKey(null); setShowKey(false); }}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Done
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => createMutation.mutate(description)}
                                    disabled={createMutation.isPending}
                                >
                                    {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Generate Key
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="shadow-sm border-muted overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : !keys || keys.length === 0 ? (
                    <div className="py-20 text-center">
                        <Key className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <h3 className="text-lg font-semibold">No service keys</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                            Generate your first API key to enable machine-to-machine integrations.
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Key Prefix</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Last Used</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.map((key: any) => (
                                <TableRow key={key.id} className="group transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Key className="h-4 w-4 text-muted-foreground" />
                                            <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                                                {key.key_prefix}...
                                            </code>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {key.description || "No description"}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {new Date(key.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground">
                                            {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : "Never"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => {
                                                if (confirm("Revoke this service key? This cannot be undone.")) {
                                                    revokeMutation.mutate(key.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Revoke
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </Card>

            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex gap-4">
                <Key className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-primary">About Service Keys</p>
                    <p className="text-xs text-muted-foreground">
                        Service keys provide machine-to-machine access to the platform API. Keys are hashed at rest —
                        only the prefix is stored for identification. Requires <code className="bg-muted px-1 py-0.5 rounded text-[10px]">platform.tenants.manage</code> permission.
                    </p>
                </div>
            </div>
        </div>
    );
}
