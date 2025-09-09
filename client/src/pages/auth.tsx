import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import logoImage from "@assets/SEVEN WEAPONS OF THE WEAPON_1755651386501.jpg";

// Phone number formatter function
function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for US numbers
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else if (phoneNumber.length <= 10) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
  } else {
    // For international numbers (with country code)
    return `+${phoneNumber.slice(0, phoneNumber.length - 10)} (${phoneNumber.slice(-10, -7)}) ${phoneNumber.slice(-7, -4)}-${phoneNumber.slice(-4)}`;
  }
}

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Registration form state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPhoneNumber, setRegPhoneNumber] = useState("");
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: { login: string; password: string }) => {
      const res = await apiRequest("POST", "/api/login", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Login successful!" });
      navigate("/");
    },
    onError: (error: any) => {
      toast({ 
        title: "Login Failed", 
        description: error.message || "Invalid username or password", 
        variant: "destructive" 
      });
    },
  });
  
  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { 
      username: string; 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string;
      phoneNumber?: string;
    }) => {
      const res = await apiRequest("POST", "/api/register", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Registration successful! You are now logged in." });
      navigate("/");
    },
    onError: (error: any) => {
      toast({ 
        title: "Registration Failed", 
        description: error.message || "Failed to create account", 
        variant: "destructive" 
      });
    },
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      toast({ 
        title: "Error", 
        description: "Please enter both username and password", 
        variant: "destructive" 
      });
      return;
    }
    loginMutation.mutate({ login: loginUsername, password: loginPassword });
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!regUsername || !regEmail || !regPassword || !regFirstName || !regLastName) {
      toast({ 
        title: "Error", 
        description: "Please fill in all required fields", 
        variant: "destructive" 
      });
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      toast({ 
        title: "Error", 
        description: "Passwords do not match", 
        variant: "destructive" 
      });
      return;
    }
    
    if (regPassword.length < 6) {
      toast({ 
        title: "Error", 
        description: "Password must be at least 6 characters", 
        variant: "destructive" 
      });
      return;
    }
    
    // Strip phone number formatting before sending
    const cleanPhoneNumber = regPhoneNumber ? regPhoneNumber.replace(/\D/g, '') : undefined;
    
    registerMutation.mutate({ 
      username: regUsername,
      email: regEmail,
      password: regPassword,
      firstName: regFirstName,
      lastName: regLastName,
      phoneNumber: cleanPhoneNumber
    });
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-pastoral-blue/10 to-pastoral-green/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img 
            src={logoImage} 
            alt="PKCM Logo" 
            className="h-16 w-auto mx-auto mb-4"
          />
          <CardTitle className="text-2xl">PKCM Leadership and Ministry Class</CardTitle>
          <CardDescription>Sign in or create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username or Email</Label>
                  <Input
                    id="login-username"
                    type="text"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    data-testid="input-login-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    data-testid="input-login-password"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                  data-testid="button-login"
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
            
            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-firstname">First Name *</Label>
                    <Input
                      id="reg-firstname"
                      type="text"
                      value={regFirstName}
                      onChange={(e) => setRegFirstName(e.target.value)}
                      placeholder="John"
                      data-testid="input-reg-firstname"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-lastname">Last Name *</Label>
                    <Input
                      id="reg-lastname"
                      type="text"
                      value={regLastName}
                      onChange={(e) => setRegLastName(e.target.value)}
                      placeholder="Doe"
                      data-testid="input-reg-lastname"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-username">Username *</Label>
                  <Input
                    id="reg-username"
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Choose a username"
                    data-testid="input-reg-username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email Address *</Label>
                  <Input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="john.doe@example.com"
                    data-testid="input-reg-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-phone">Phone Number (Optional)</Label>
                  <Input
                    id="reg-phone"
                    type="tel"
                    value={regPhoneNumber}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setRegPhoneNumber(formatted);
                    }}
                    placeholder="(123) 456-7890"
                    maxLength={20}
                    data-testid="input-reg-phone"
                  />
                  <p className="text-xs text-gray-500">
                    Format: (123) 456-7890 or +1 (123) 456-7890
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password *</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create a password (min 6 characters)"
                    data-testid="input-reg-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm">Confirm Password *</Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    data-testid="input-reg-confirm"
                  />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}