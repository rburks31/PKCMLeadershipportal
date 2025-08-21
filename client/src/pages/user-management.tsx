import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users, 
  UserPlus, 
  Upload, 
  Download, 
  Search, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Phone,
  Mail,
  User,
  FileText,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Layout from '@/components/Layout';

const singleUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  username: z.string().min(1, 'Username is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phoneNumber: z.string().optional().refine((phone) => {
    if (!phone) return true;
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{10,}$/;
    return phoneRegex.test(phone);
  }, 'Please enter a valid phone number'),
  role: z.enum(['student', 'instructor'], { required_error: 'Role is required' }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SingleUserFormData = z.infer<typeof singleUserSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [bulkText, setBulkText] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const form = useForm<SingleUserFormData>({
    resolver: zodResolver(singleUserSchema),
    defaultValues: {
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'student',
      password: '',
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: SingleUserFormData) => {
      const response = await apiRequest('POST', '/api/admin/users', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Created",
        description: "New user has been created successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (data: { users: any[] }) => {
      const response = await apiRequest('POST', '/api/admin/users/bulk', data);
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Bulk Upload Complete",
        description: `Created ${result.created} users, ${result.errors} errors`,
      });
      setBulkText('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<SingleUserFormData> }) => {
      console.log("Sending update request for user:", data.id, "with data:", data.updates);
      const response = await apiRequest('PUT', `/api/admin/users/${data.id}`, data.updates);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      console.log("Update successful:", data);
      toast({
        title: "User Updated",
        description: "User information has been updated successfully",
      });
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      console.error("Update failed:", error);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (data: SingleUserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleBulkUpload = () => {
    const lines = bulkText.split('\n').filter(line => line.trim());
    const users = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Expected format: email,username,firstName,lastName,phoneNumber,role,password
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 6) {
        toast({
          title: "Invalid Format",
          description: `Line ${i + 1}: Expected at least 6 fields (email,username,firstName,lastName,phoneNumber,role,password)`,
          variant: "destructive",
        });
        return;
      }
      
      users.push({
        email: parts[0],
        username: parts[1],
        firstName: parts[2],
        lastName: parts[3],
        phoneNumber: parts[4] || null,
        role: parts[5] as 'student' | 'instructor',
        password: parts[6] || 'defaultPassword123',
      });
    }
    
    if (users.length === 0) {
      toast({
        title: "No Users Found",
        description: "Please enter user data in the correct format",
        variant: "destructive",
      });
      return;
    }
    
    bulkCreateMutation.mutate({ users });
  };

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    
    // Validate required fields
    if (!editingUser.firstName?.trim() || !editingUser.lastName?.trim()) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required",
        variant: "destructive",
      });
      return;
    }
    
    updateUserMutation.mutate({
      id: editingUser.id,
      updates: {
        firstName: editingUser.firstName?.trim() || null,
        lastName: editingUser.lastName?.trim() || null,
        phoneNumber: editingUser.phoneNumber?.trim() || null,
        role: editingUser.role,
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const filteredUsers = (users as any[])?.filter((user: any) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const downloadTemplate = () => {
    const template = `email,username,firstName,lastName,phoneNumber,role,password
john.doe@example.com,johndoe,John,Doe,+1-555-123-4567,student,password123
jane.smith@example.com,janesmith,Jane,Smith,+1-555-987-6543,instructor,password123`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-blue-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-2">Create and manage students and instructors</p>
          </div>

          <Tabs defaultValue="single" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single" data-testid="tab-single-user">Single User</TabsTrigger>
              <TabsTrigger value="bulk" data-testid="tab-bulk-upload">Bulk Upload</TabsTrigger>
              <TabsTrigger value="manage" data-testid="tab-manage-users">Manage Users</TabsTrigger>
            </TabsList>

            {/* Single User Creation */}
            <TabsContent value="single">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="text-blue-600" />
                    Create Single User
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" data-testid="input-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-username" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" placeholder="+1-555-123-4567" data-testid="input-phone-number" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-role">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="student">Student</SelectItem>
                                  <SelectItem value="instructor">Instructor</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input {...field} type="password" data-testid="input-password" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={createUserMutation.isPending}
                        className="w-full md:w-auto"
                        data-testid="button-create-user"
                      >
                        {createUserMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Create User
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bulk Upload */}
            <TabsContent value="bulk">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="text-blue-600" />
                    Bulk User Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={downloadTemplate}
                      data-testid="button-download-template"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Format Instructions:</h4>
                    <p className="text-sm text-blue-800 mb-2">
                      Enter one user per line in CSV format:
                    </p>
                    <code className="text-xs bg-white p-2 rounded block">
                      email,username,firstName,lastName,phoneNumber,role,password
                    </code>
                    <p className="text-sm text-blue-800 mt-2">
                      • phoneNumber can be empty but comma is required
                      • role must be either "student" or "instructor"
                      • password will default to "defaultPassword123" if empty
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="bulk-text">User Data (CSV Format)</Label>
                    <Textarea
                      id="bulk-text"
                      placeholder="john.doe@example.com,johndoe,John,Doe,+1-555-123-4567,student,password123"
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      className="min-h-[200px] mt-2"
                      data-testid="textarea-bulk-data"
                    />
                  </div>
                  
                  <Button
                    onClick={handleBulkUpload}
                    disabled={bulkCreateMutation.isPending || !bulkText.trim()}
                    data-testid="button-bulk-upload"
                  >
                    {bulkCreateMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Users
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Manage Users */}
            <TabsContent value="manage">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="text-blue-600" />
                      Manage Users
                    </div>
                    <Badge variant="secondary">{filteredUsers?.length || 0} users</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by email, username, or name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          data-testid="input-search-users"
                        />
                      </div>
                    </div>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full md:w-48" data-testid="select-filter-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                        <SelectItem value="instructor">Instructors</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Users Table */}
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading users...</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers?.map((user: any) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                {editingUser?.id === user.id ? (
                                  <div className="space-y-2">
                                    <Input
                                      value={editingUser.firstName || ''}
                                      onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                                      placeholder="First Name"
                                      data-testid={`input-edit-first-name-${user.id}`}
                                    />
                                    <Input
                                      value={editingUser.lastName || ''}
                                      onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                                      placeholder="Last Name"
                                      data-testid={`input-edit-last-name-${user.id}`}
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <div className="font-medium">
                                      {user.firstName} {user.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">@{user.username}</div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {editingUser?.id === user.id ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4 text-gray-400" />
                                      <span className="text-sm">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-gray-400" />
                                      <Input
                                        value={editingUser.phoneNumber || ''}
                                        onChange={(e) => setEditingUser({...editingUser, phoneNumber: e.target.value})}
                                        placeholder="Phone number"
                                        className="text-sm"
                                        data-testid={`input-edit-phone-${user.id}`}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Mail className="h-4 w-4 text-gray-400" />
                                      {user.email}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="h-4 w-4 text-gray-400" />
                                      {user.phoneNumber || 'No phone'}
                                      {user.phoneNumber ? (
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <AlertCircle className="h-3 w-3 text-orange-600" />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                {editingUser?.id === user.id ? (
                                  <Select 
                                    value={editingUser.role} 
                                    onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                                  >
                                    <SelectTrigger data-testid={`select-edit-role-${user.id}`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="student">Student</SelectItem>
                                      <SelectItem value="instructor">Instructor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Badge className={getRoleColor(user.role)}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {user.lastLoginAt ? (
                                    <Badge variant="outline" className="text-green-600">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {editingUser?.id === user.id ? (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleSaveEdit}
                                      disabled={updateUserMutation.isPending}
                                      data-testid={`button-save-edit-${user.id}`}
                                    >
                                      <Save className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingUser(null)}
                                      data-testid={`button-cancel-edit-${user.id}`}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditUser(user)}
                                      data-testid={`button-edit-${user.id}`}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="text-red-600 hover:text-red-700"
                                      data-testid={`button-delete-${user.id}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}