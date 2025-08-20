import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const loginSchema = z.object({
  login: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check if there's a reset token in the URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('reset');
    if (token) {
      setResetToken(token);
      setActiveTab("reset");
    }
  }, [location]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !isLoading) {
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
      localStorage.removeItem('redirectAfterLogin');
      window.location.href = redirectPath;
    }
  }, [user, isLoading]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      // Force redirect after successful login
      setTimeout(() => {
        const redirectPath = localStorage.getItem('redirectAfterLogin') || '/';
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectPath;
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Account created!",
        description: "Welcome to PKCM Leadership and Ministry Class.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Reset link sent!",
        description: "If the email exists, a reset link has been sent to your inbox.",
      });
      setActiveTab("login"); // Return to login tab
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send reset link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordFormData) => {
      const res = await apiRequest("POST", "/api/reset-password", {
        token: resetToken,
        newPassword: data.password,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password reset successfully!",
        description: "You can now sign in with your new password.",
      });
      setActiveTab("login");
      setResetToken(null);
      // Clear the URL parameters
      window.history.replaceState({}, '', '/auth');
    },
    onError: (error: any) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  const handleForgotPassword = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  const handleResetPassword = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Authentication forms */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-pastoral-blue">
              PKCM Leadership Class
            </h1>
            <p className="text-pastoral-gray mt-2">
              Empowering every follower of Jesus to grow in faith
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {!resetToken ? (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="reset">Reset Password</TabsTrigger>
              </TabsList>
            )}
            
            {activeTab === "forgot" && (
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="forgot">Forgot Password</TabsTrigger>
              </TabsList>
            )}

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Enter your email/username and password to access your courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div>
                      <Label htmlFor="login">Email or Username</Label>
                      <Input
                        id="login"
                        {...loginForm.register("login")}
                        placeholder="Enter your email or username"
                        data-testid="input-login"
                      />
                      {loginForm.formState.errors.login && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.login.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        {...loginForm.register("password")}
                        placeholder="Enter your password"
                        data-testid="input-password"
                      />
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </Button>
                    
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab("forgot")}
                        className="text-sm text-pastoral-blue hover:underline"
                        data-testid="button-forgot-password"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join the PKCM Leadership and Ministry Class community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...registerForm.register("firstName")}
                          placeholder="First name"
                          data-testid="input-first-name"
                        />
                        {registerForm.formState.errors.firstName && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.firstName.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...registerForm.register("lastName")}
                          placeholder="Last name"
                          data-testid="input-last-name"
                        />
                        {registerForm.formState.errors.lastName && (
                          <p className="text-sm text-red-600 mt-1">
                            {registerForm.formState.errors.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        {...registerForm.register("email")}
                        placeholder="Enter your email"
                        data-testid="input-email"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        {...registerForm.register("username")}
                        placeholder="Choose a username"
                        data-testid="input-username"
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="registerPassword">Password</Label>
                      <Input
                        id="registerPassword"
                        type="password"
                        {...registerForm.register("password")}
                        placeholder="Create a password"
                        data-testid="input-register-password"
                      />
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register"
                    >
                      {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Forgot Password Tab */}
            <TabsContent value="forgot">
              <Card>
                <CardHeader>
                  <CardTitle>Forgot Password</CardTitle>
                  <CardDescription>
                    Enter your email address and we'll send you a link to reset your password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                    <div>
                      <Label htmlFor="forgotEmail">Email</Label>
                      <Input
                        id="forgotEmail"
                        type="email"
                        {...forgotPasswordForm.register("email")}
                        placeholder="Enter your email address"
                        data-testid="input-forgot-email"
                      />
                      {forgotPasswordForm.formState.errors.email && (
                        <p className="text-sm text-red-600 mt-1">
                          {forgotPasswordForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={forgotPasswordMutation.isPending}
                      data-testid="button-send-reset"
                    >
                      {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                    </Button>
                    
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className="text-sm text-pastoral-blue hover:underline"
                        data-testid="button-back-to-login"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reset Password Tab */}
            <TabsContent value="reset">
              <Card>
                <CardHeader>
                  <CardTitle>Reset Password</CardTitle>
                  <CardDescription>
                    Enter your new password below
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...resetPasswordForm.register("password")}
                        placeholder="Enter your new password"
                        data-testid="input-new-password"
                      />
                      {resetPasswordForm.formState.errors.password && (
                        <p className="text-sm text-red-600 mt-1">
                          {resetPasswordForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...resetPasswordForm.register("confirmPassword")}
                        placeholder="Confirm your new password"
                        data-testid="input-confirm-password"
                      />
                      {resetPasswordForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-600 mt-1">
                          {resetPasswordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={resetPasswordMutation.isPending}
                      data-testid="button-reset-password"
                    >
                      {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="flex-1 bg-gradient-to-br from-pastoral-blue to-pastoral-purple flex items-center justify-center p-8">
        <div className="text-white text-center max-w-md">
          <div className="mb-8">
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Transform Your Ministry
            </h2>
            <p className="text-lg text-white/90 mb-6">
              Join thousands of believers growing in biblical leadership through 
              comprehensive training, community discussions, and practical application.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full mr-3 flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span>Interactive video lessons</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full mr-3 flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span>Community discussions</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full mr-3 flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span>Progress tracking & certificates</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-white/20 rounded-full mr-3 flex items-center justify-center">
                <span className="text-sm">✓</span>
              </div>
              <span>Live classes with instructors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}