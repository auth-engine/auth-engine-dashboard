"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";

import { apiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { AuthResponse } from "@/lib/types";
import { FaGithub, FaGoogle, FaMicrosoft } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const loginSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(1, { message: "Password is required." }),
});

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const returnTo = searchParams.get("returnTo") || "/me";
    const { setTokens, setUser } = useAuthStore();

    const [mfaPendingToken, setMfaPendingToken] = useState<string | null>(null);
    const [mfaCode, setMfaCode] = useState("");
    const [isWebAuthnLoading, setIsWebAuthnLoading] = useState(false);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "" },
    });

    const handleLoginSuccess = (data: AuthResponse) => {
        setTokens(data.access_token, data.refresh_token);
        if (data.user) setUser(data.user);
        toast.success("Successfully logged in!");
        router.push(returnTo);
    };

    const loginMutation = useMutation({
        mutationFn: async (values: z.infer<typeof loginSchema>) => {
            const { data } = await apiClient.post("/auth/login", values);
            return data;
        },
        onSuccess: (data: any) => {
            if (data.mfa_pending_token && !data.access_token) {
                setMfaPendingToken(data.mfa_pending_token);
                toast.info("Enter your MFA code to continue.");
                return;
            }
            handleLoginSuccess(data);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.detail || "Invalid email or password.");
        },
    });

    const mfaCompleteMutation = useMutation({
        mutationFn: async ({ token, code }: { token: string; code: string }) => {
            const { data } = await apiClient.post<AuthResponse>("/auth/mfa/complete", {
                mfa_pending_token: token,
                code,
            });
            return data;
        },
        onSuccess: handleLoginSuccess,
        onError: () => toast.error("Invalid MFA code."),
    });

    const handleWebAuthnLogin = async () => {
        setIsWebAuthnLoading(true);

        try {
            const { data } = await apiClient.post(
                "/auth/webauthn/authenticate/begin",
                {}
            );

            const assertion = await startAuthentication({
                optionsJSON: data.options,
            });

            const credentialPayload = {
                id: assertion.id,
                rawId: assertion.rawId,
                type: assertion.type,
                response: {
                    clientDataJSON: assertion.response.clientDataJSON,
                    authenticatorData: assertion.response.authenticatorData,
                    signature: assertion.response.signature,
                    userHandle: assertion.response.userHandle,
                },
            };

            const { data: loginData } = await apiClient.post<AuthResponse>(
                "/auth/webauthn/authenticate/complete",
                { credential: credentialPayload }
            );

            handleLoginSuccess(loginData);
        } catch (error: any) {
            if (error.name === "NotAllowedError") {
                toast.error("Passkey authentication cancelled.");
            } else {
                toast.error(error.response?.data?.detail || "Passkey login failed.");
            }
        } finally {
            setIsWebAuthnLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        const baseUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

        window.location.href = `${baseUrl}/auth/oauth/${provider}/login`;
    };

    const onSubmit = (values: z.infer<typeof loginSchema>) =>
        loginMutation.mutate(values);

    if (mfaPendingToken) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <ShieldCheck className="mx-auto h-8 w-8 text-primary mb-2" />
                        <CardTitle>Two-Factor Verification</CardTitle>
                        <CardDescription>
                            Enter the 6-digit code from your authenticator app.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Input
                            placeholder="000000"
                            value={mfaCode}
                            maxLength={6}
                            onChange={(e) =>
                                setMfaCode(e.target.value.replace(/\D/g, ""))
                            }
                            className="text-center text-xl tracking-[0.4em]"
                        />

                        <Button
                            className="w-full"
                            disabled={mfaCode.length !== 6}
                            onClick={() =>
                                mfaCompleteMutation.mutate({
                                    token: mfaPendingToken,
                                    code: mfaCode,
                                })
                            }
                        >
                            Verify & Sign In
                        </Button>
                    </CardContent>

                    <CardFooter>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => setMfaPendingToken(null)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl">Sign In</CardTitle>
                    <CardDescription>
                        Access your account securely
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">

                    {/* EMAIL LOGIN */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="name@example.com" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex justify-between">
                                            <FormLabel>Password</FormLabel>
                                            <Link
                                                href="/forgot-password"
                                                className="text-sm text-primary"
                                            >
                                                Forgot?
                                            </Link>
                                        </div>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <Button className="w-full" disabled={loginMutation.isPending}>
                                {loginMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                Sign In
                            </Button>
                        </form>
                    </Form>

                    {/* DIVIDER */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    {/* PASSKEY */}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleWebAuthnLogin}
                        disabled={isWebAuthnLoading}
                    >
                        {isWebAuthnLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <KeyRound className="mr-2 h-4 w-4" />
                        )}
                        Sign in with Passkey
                    </Button>

                    {/* SOCIAL */}
                    <div className="grid grid-cols-2 gap-3">

                        <Button
                            variant="outline"
                            onClick={() => handleSocialLogin("google")}
                        >
                            <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
                            Google
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => handleSocialLogin("microsoft")}
                        >
                            <FaMicrosoft className="mr-2 h-4 w-4 text-blue-600" />
                            Microsoft
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => handleSocialLogin("github")}
                        >
                            <FaGithub className="mr-2 h-4 w-4" />
                            GitHub
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => handleSocialLogin("authengine")}
                        >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            AuthEngine
                        </Button>

                    </div>
                </CardContent>

                <CardFooter className="justify-center text-sm">
                    Don't have an account?{" "}
                    <Link href="/register" className="text-primary ml-1">
                        Sign up
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-screen items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }
        >
            <LoginPageContent />
        </Suspense>
    );
}