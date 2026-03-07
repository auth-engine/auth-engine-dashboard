"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import {
    Plus,
    Trash2,
    ShieldCheck,
    Loader2,
    Lock,
    Edit,
    AlertCircle,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function PlatformRolesPage() {
    const queryClient = useQueryClient();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        scope: "TENANT",
        level: 0,
        permissions: [] as string[], // IDs
    });

    // Fetches
    const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
        queryKey: ["globalRoles"],
        queryFn: async () => {
            const { data } = await apiClient.get("/platform/roles");
            return data;
        },
    });

    const { data: permissions = [], isLoading: isLoadingPerms } = useQuery({
        queryKey: ["globalPermissions"],
        queryFn: async () => {
            const { data } = await apiClient.get("/platform/roles/permissions");
            return data;
        },
    });

    // Derived
    const platformRoles = roles.filter((r: any) => r.scope === "PLATFORM");
    const tenantRoles = roles.filter((r: any) => r.scope === "TENANT");

    // Filtered permissions based on tab/scope
    const availablePerms = useMemo(() => {
        return permissions.filter((p: any) => {
            if (p.name.startsWith("auth.")) return true;
            if (formData.scope === "PLATFORM" && p.name.startsWith("platform.")) return true;
            if (formData.scope === "TENANT" && p.name.startsWith("tenant.")) return true;
            return false;
        });
    }, [permissions, formData.scope]);

    const handleOpenCreate = () => {
        toast.info("Opening role creation...");
        setEditingRole(null);
        setFormData({
            name: "",
            description: "",
            scope: "TENANT",
            level: 0,
            permissions: [],
        });
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (role: any) => {
        toast.info(`Editing role: ${role.name}`);
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || "",
            scope: role.scope,
            level: role.level,
            permissions: role.permission_ids || [], // using IDs
        });
        setIsDialogOpen(true);
    };

    // Mutations
    const saveMutation = useMutation({
        mutationFn: async (payload: any) => {
            if (editingRole) {
                const { data } = await apiClient.put(`/platform/roles/${editingRole.id}`, payload);
                return data;
            } else {
                const { data } = await apiClient.post("/platform/roles", payload);
                return data;
            }
        },
        onSuccess: () => {
            toast.success(editingRole ? "Role updated!" : "Role created!");
            queryClient.invalidateQueries({ queryKey: ["globalRoles"] });
            setIsDialogOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Failed to save role.");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await apiClient.delete(`/platform/roles/${id}`);
        },
        onSuccess: () => {
            toast.success("Role deleted!");
            queryClient.invalidateQueries({ queryKey: ["globalRoles"] });
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.detail || "Failed to delete role.");
        }
    });

    const handleSubmit = () => {
        saveMutation.mutate({
            name: formData.name,
            description: formData.description,
            scope: formData.scope,
            level: parseInt(formData.level.toString(), 10),
            permissions: formData.permissions,
        });
    };

    const togglePermission = (id: string, checked: boolean) => {
        setFormData(prev => {
            if (checked) {
                return { ...prev, permissions: [...prev.permissions, id] };
            } else {
                return { ...prev, permissions: prev.permissions.filter(p => p !== id) };
            }
        });
    };

    const isSystemRole = (name: string) => ["SUPER_ADMIN", "PLATFORM_ADMIN", "TENANT_OWNER"].includes(name);

    const renderRoleCard = (role: any) => (
        <Card key={role.id} className="shadow-sm border-muted flex flex-col h-full">
            <CardHeader className="pb-2 flex-none">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest bg-primary/5 text-primary border-primary/10">
                            {role.scope}
                        </Badge>
                        {isSystemRole(role.name) && (
                            <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-widest">
                                SYSTEM
                            </Badge>
                        )}
                    </div>
                </div>
                <CardTitle className="text-lg mt-2 truncate" title={role.name}>{role.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 min-h-[32px]">
                    {role.description || "No description provided."}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 flex-grow space-y-4">
                <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Permissions
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {!role.permissions?.length && (
                            <span className="text-xs text-muted-foreground italic">None assigned</span>
                        )}
                        {role.permissions?.slice(0, 5).map((p: string) => (
                            <Badge key={p} variant="secondary" className="text-[9px] px-1.5 py-0 truncate max-w-full">
                                {p}
                            </Badge>
                        ))}
                        {role.permissions?.length > 5 && (
                            <Badge variant="ghost" className="text-[9px] px-1.5 py-0">
                                +{role.permissions.length - 5} more
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Level</p>
                    <p className="text-sm">{role.level}</p>
                </div>
            </CardContent>
            <div className="px-6 py-3 bg-muted/30 border-t border-muted flex justify-between items-center mt-auto flex-none">
                <span className="text-[10px] text-muted-foreground" title={role.id}>{role.id.slice(0, 8)}...</span>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => handleOpenEdit(role)}>
                        <Edit className="mr-1.5 h-3 w-3" /> Edit
                    </Button>
                    {!isSystemRole(role.name) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                                if (confirm("Are you sure you want to delete this role?")) {
                                    deleteMutation.mutate(role.id);
                                }
                            }}
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="mr-1.5 h-3 w-3" /> Delete
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
                        <p className="text-muted-foreground mt-1">
                            Define platform and tenant roles across the system.
                        </p>
                    </div>
                    <DialogTrigger asChild>
                        <Button onClick={handleOpenCreate} className="rounded-xl">
                            <Plus className="mr-2 h-4 w-4" /> Create Role
                        </Button>
                    </DialogTrigger>
                </div>

                {(isLoadingRoles || isLoadingPerms) ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                ) : (
                    <Tabs defaultValue="tenant" className="space-y-6">
                        <TabsList className="bg-muted w-full justify-start overflow-x-auto">
                            <TabsTrigger value="tenant" className="w-[150px]">Tenant Roles</TabsTrigger>
                            <TabsTrigger value="platform" className="w-[150px]">Platform Roles</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tenant" className="m-0 border-none outline-none">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {tenantRoles.map(renderRoleCard)}
                            </div>
                            {tenantRoles.length === 0 && (
                                <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
                                    <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                                    <p>No tenant roles found.</p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="platform" className="m-0 border-none outline-none">
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {platformRoles.map(renderRoleCard)}
                            </div>
                            {platformRoles.length === 0 && (
                                <div className="py-20 text-center text-muted-foreground flex flex-col items-center">
                                    <AlertCircle className="h-10 w-10 mb-2 opacity-50" />
                                    <p>No platform roles found.</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                <DialogContent className="sm:max-w-[600px] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? "Edit Role" : "Create Role"}</DialogTitle>
                        <DialogDescription>
                            {editingRole
                                ? "Manage your existing platform or tenant role."
                                : "Create a new role for your platform or tenants."}
                        </DialogDescription>
                    </DialogHeader>


                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Role Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. EDITOR"
                                disabled={editingRole && isSystemRole(editingRole.name)}
                                className="uppercase"
                            />
                            {editingRole && isSystemRole(editingRole.name) && (
                                <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What can this role do?"
                                className="resize-none h-20"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="scope">Scope</Label>
                                <select
                                    id="scope"
                                    value={formData.scope}
                                    onChange={e => {
                                        setFormData(prev => ({
                                            ...prev,
                                            scope: e.target.value,
                                            permissions: [], // reset perms on scope change
                                        }))
                                    }}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    disabled={!!editingRole} // lock scope on edit
                                >
                                    <option value="TENANT">TENANT</option>
                                    <option value="PLATFORM">PLATFORM</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level" className="justify-between flex">
                                    <span>Hierarchy Level</span>
                                    <span className="text-muted-foreground font-normal text-xs">(higher = more power)</span>
                                </Label>
                                <Input
                                    id="level"
                                    type="number"
                                    value={formData.level}
                                    onChange={e => setFormData({ ...formData, level: parseInt(e.target.value, 10) || 0 })}
                                    min={0}
                                    max={100}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                            <Label>Map Permissions</Label>
                            <p className="text-xs text-muted-foreground pb-2">
                                Only permissions matching the {formData.scope} scope (or globally accessible auth traits) can be assigned.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-1 bg-muted/20 rounded-lg">
                                {availablePerms.map((p: any) => {
                                    const checked = formData.permissions.includes(p.id);
                                    return (
                                        <label
                                            key={p.id}
                                            className={`flex items-start gap-2 p-3 rounded-md border text-sm cursor-pointer transition-colors ${checked ? 'bg-primary/5 border-primary/50' : 'bg-background hover:bg-muted/50 border-border'}`}
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-1 h-4 w-4 shrink-0 rounded-sm border-primary text-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                checked={checked}
                                                onChange={(e) => togglePermission(p.id, e.target.checked)}
                                            />
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">{p.name}</p>
                                                <p className="text-xs text-muted-foreground">{p.description}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                                {availablePerms.length === 0 && (
                                    <p className="text-xs text-muted-foreground p-2">No permissions available for this scope.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saveMutation.isPending}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={saveMutation.isPending || !formData.name}>
                            {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Role
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
