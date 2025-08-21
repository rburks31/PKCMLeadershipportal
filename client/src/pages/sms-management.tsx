import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, Send, CheckCircle, XCircle, MessageCircle, ArrowLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
}

interface SMSTemplate {
  key: string;
  name: string;
  template: (name: string, ...args: string[]) => string;
}

export default function SMSManagement() {
  const { toast } = useToast();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [filterByRole, setFilterByRole] = useState('all');

  // Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Fetch SMS templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery<SMSTemplate[]>({
    queryKey: ['/api/admin/sms/templates'],
  });

  // Send individual SMS mutation
  const sendSMSMutation = useMutation({
    mutationFn: async (data: { userId: string; message: string; mediaUrls?: string[] }) => {
      const response = await apiRequest('POST', '/api/admin/sms/send', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "SMS Sent Successfully",
        description: data.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send SMS",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send bulk SMS mutation
  const sendBulkSMSMutation = useMutation({
    mutationFn: async (data: { userIds?: string[]; message: string; filterByRole?: string }) => {
      const response = await apiRequest('POST', '/api/admin/sms/bulk', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk SMS Sent",
        description: `${data.message}`,
      });
      setSelectedUsers([]);
      setMessage('');
      setFilterByRole('');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Bulk SMS",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filter users with phone numbers
  const usersWithPhones = users.filter(user => {
    const hasPhone = user.phoneNumber && 
                     user.phoneNumber.toString().trim() !== '' && 
                     user.phoneNumber.toString().trim() !== 'null' && 
                     user.phoneNumber.toString().trim() !== 'undefined';
    return hasPhone && user.isActive;
  });
  
  // Debug logging
  console.log('All users:', users.length);
  console.log('Users with phones:', usersWithPhones.length);
  console.log('Sample users:', users.slice(0, 3).map(u => ({ id: u.id, phone: u.phoneNumber, firstName: u.firstName })));

  const handleSendIndividualSMS = (userId: string) => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    sendSMSMutation.mutate({
      userId,
      message: message.trim()
    });
  };

  const handleSendBulkSMS = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    const data: any = { message: message.trim() };

    if (selectedUsers.length > 0) {
      data.userIds = selectedUsers;
    } else if (filterByRole && filterByRole !== 'all') {
      data.filterByRole = filterByRole;
    }

    sendBulkSMSMutation.mutate(data);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(usersWithPhones.map(user => user.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SMS management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Link href="/admin" className="hover:text-blue-600 transition-colors">
              Admin Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium">SMS/MMS Management</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm" data-testid="button-back-to-admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="text-blue-600" />
            SMS/MMS Management
          </h1>
          <p className="text-gray-600 mt-2">Send SMS notifications to students, instructors, and administrators</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users with Phone Numbers</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{usersWithPhones.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected Users</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{selectedUsers.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bulk" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="bulk" data-testid="tab-bulk-sms">Bulk SMS</TabsTrigger>
            <TabsTrigger value="individual" data-testid="tab-individual-sms">Individual SMS</TabsTrigger>
            <TabsTrigger value="templates" data-testid="tab-sms-templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="text-blue-600" />
                  Send Bulk SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Message Input */}
                <div className="space-y-2">
                  <Label htmlFor="bulk-message">Message</Label>
                  <Textarea
                    id="bulk-message"
                    data-testid="textarea-bulk-message"
                    placeholder="Enter your SMS message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <p className="text-sm text-gray-500">{message.length}/1600 characters</p>
                </div>

                {/* Targeting Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Filter by Role</Label>
                    <Select value={filterByRole} onValueChange={setFilterByRole} data-testid="select-filter-role">
                      <SelectTrigger>
                        <SelectValue placeholder="All roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        <SelectItem value="student">Students only</SelectItem>
                        <SelectItem value="instructor">Instructors only</SelectItem>
                        <SelectItem value="admin">Admins only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>User Selection</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllUsers}
                        data-testid="button-select-all"
                      >
                        Select All ({usersWithPhones.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                        data-testid="button-clear-selection"
                      >
                        Clear ({selectedUsers.length})
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendBulkSMS}
                  disabled={sendBulkSMSMutation.isPending || !message.trim()}
                  className="w-full"
                  data-testid="button-send-bulk-sms"
                >
                  {sendBulkSMSMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending SMS...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send SMS to {selectedUsers.length > 0 ? selectedUsers.length : filterByRole !== 'all' ? 'filtered' : 'all'} users
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="text-blue-600" />
                  Send Individual SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Message Input */}
                <div className="space-y-2">
                  <Label htmlFor="individual-message">Message</Label>
                  <Textarea
                    id="individual-message"
                    data-testid="textarea-individual-message"
                    placeholder="Enter your SMS message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-2">
                  <Label>Select Users ({usersWithPhones.length} users with phone numbers)</Label>
                  <div className="max-h-96 overflow-y-auto border rounded-md p-4 space-y-2">
                    {usersWithPhones.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium mb-2">No Users with Phone Numbers</p>
                        <p className="text-sm">Add phone numbers to users in the User Management section to send SMS messages.</p>
                      </div>
                    ) : (
                      usersWithPhones.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-white hover:bg-gray-50"
                        data-testid={`user-card-${user.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="h-4 w-4 text-blue-600"
                            data-testid={`checkbox-user-${user.id}`}
                          />
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-sm text-gray-500">{user.phoneNumber}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleSendIndividualSMS(user.id)}
                            disabled={sendSMSMutation.isPending || !message.trim()}
                            data-testid={`button-send-sms-${user.id}`}
                          >
                            {sendSMSMutation.isPending ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="text-blue-600" />
                  SMS Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading templates...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.key}
                        className="p-4 border rounded-lg bg-white hover:bg-gray-50"
                        data-testid={`template-${template.key}`}
                      >
                        <h4 className="font-medium mb-2">{template.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {typeof template.template === 'function' 
                            ? template.template('[Student Name]', '[Course/Lesson]', '[Date]')
                            : 'Template preview not available'
                          }
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMessage(
                            typeof template.template === 'function' 
                              ? template.template('[Student Name]', '[Course/Lesson]', '[Date]')
                              : ''
                          )}
                          data-testid={`button-use-template-${template.key}`}
                        >
                          Use Template
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}