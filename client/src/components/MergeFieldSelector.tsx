import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  Users, 
  BookOpen, 
  Play, 
  Settings,
  Copy,
  Eye,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Available merge fields organized by category
const MERGE_FIELDS = {
  USER: [
    { field: '{firstName}', description: 'User\'s first name', example: 'John' },
    { field: '{lastName}', description: 'User\'s last name', example: 'Doe' },
    { field: '{fullName}', description: 'User\'s full name (first + last)', example: 'John Doe' },
    { field: '{email}', description: 'User\'s email address', example: 'john.doe@example.com' },
    { field: '{username}', description: 'User\'s username', example: 'johndoe' },
    { field: '{phoneNumber}', description: 'User\'s phone number', example: '(555) 123-4567' },
    { field: '{role}', description: 'User\'s role', example: 'Student' }
  ],
  COURSE: [
    { field: '{courseName}', description: 'Course title', example: 'Leadership Fundamentals' },
    { field: '{courseDescription}', description: 'Course description', example: 'Learn biblical leadership principles' },
    { field: '{instructorName}', description: 'Course instructor\'s name', example: 'Pastor Smith' },
    { field: '{courseDifficulty}', description: 'Course difficulty level', example: 'Intermediate' },
    { field: '{estimatedHours}', description: 'Estimated course duration', example: '8 hours' }
  ],
  LESSON: [
    { field: '{lessonTitle}', description: 'Lesson title', example: 'Servant Leadership' },
    { field: '{lessonDescription}', description: 'Lesson description', example: 'Understanding servant leadership principles' },
    { field: '{lessonDuration}', description: 'Lesson duration in minutes', example: '45 minutes' }
  ],
  SYSTEM: [
    { field: '{platformName}', description: 'Platform name', example: 'PKCM Leadership and Ministry Class' },
    { field: '{currentDate}', description: 'Current date', example: '12/25/2024' },
    { field: '{currentTime}', description: 'Current time', example: '10:30 AM' },
    { field: '{supportEmail}', description: 'Support contact email', example: 'support@pkcm.org' },
    { field: '{loginUrl}', description: 'Login page URL', example: 'https://pkcm.replit.app/auth' }
  ]
} as const;

interface MergeFieldSelectorProps {
  onInsertField: (field: string) => void;
  className?: string;
}

export function MergeFieldSelector({ onInsertField, className }: MergeFieldSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleInsertField = (field: string) => {
    onInsertField(field);
    toast({
      title: "Merge field added",
      description: `${field} has been inserted into your message`,
    });
  };

  const handleCopyField = (field: string) => {
    navigator.clipboard.writeText(field);
    toast({
      title: "Copied to clipboard",
      description: `${field} has been copied to your clipboard`,
    });
  };

  const filteredFields = Object.entries(MERGE_FIELDS).reduce((acc, [category, fields]) => {
    const filtered = fields.filter(
      (field) =>
        field.field.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      (acc as any)[category] = filtered;
    }
    return acc;
  }, {} as Record<string, Array<{ field: string; description: string; example: string }>>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'USER': return <Users className="h-4 w-4" />;
      case 'COURSE': return <BookOpen className="h-4 w-4" />;
      case 'LESSON': return <Play className="h-4 w-4" />;
      case 'SYSTEM': return <Settings className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'USER': return 'bg-blue-100 text-blue-800';
      case 'COURSE': return 'bg-green-100 text-green-800';
      case 'LESSON': return 'bg-purple-100 text-purple-800';
      case 'SYSTEM': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Merge Fields
        </CardTitle>
        <p className="text-sm text-gray-600">
          Add personalized variables to your messages. Click to insert or copy.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="merge-field-search">Search merge fields</Label>
          <Input
            id="merge-field-search"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="input-merge-field-search"
          />
        </div>

        <Tabs defaultValue="USER" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {Object.keys(MERGE_FIELDS).map((category) => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="flex items-center gap-1 text-xs"
              >
                {getCategoryIcon(category)}
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(filteredFields).map(([category, fields]) => (
            <TabsContent key={category} value={category} className="mt-4">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {fields.map((field) => (
                  <div
                    key={field.field}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {field.field}
                        </code>
                        <Badge variant="outline" className={getCategoryColor(category)}>
                          {category.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{field.description}</p>
                      <p className="text-xs text-gray-500">
                        Example: <span className="font-medium">{field.example}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyField(field.field)}
                        data-testid={`button-copy-${field.field}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInsertField(field.field)}
                        data-testid={`button-insert-${field.field}`}
                      >
                        <Plus className="h-3 w-3" />
                        Insert
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="pt-4 border-t">
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Eye className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Preview your message:</p>
              <p>Merge fields will be replaced with actual data when the message is sent. For example, "Hello {'{firstName}'}" becomes "Hello John" for a user named John.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showMergeFields?: boolean;
  type?: 'email' | 'sms';
}

export function MessageComposer({
  value,
  onChange,
  placeholder = "Type your message here...",
  className = "",
  showMergeFields = true,
  type = 'email'
}: MessageComposerProps) {
  const handleInsertField = (field: string) => {
    // Insert at cursor position or at the end
    const textarea = document.querySelector('textarea[data-testid="textarea-message-composer"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + field + value.substring(end);
      onChange(newValue);
      
      // Set cursor position after the inserted field
      setTimeout(() => {
        textarea.setSelectionRange(start + field.length, start + field.length);
        textarea.focus();
      }, 0);
    } else {
      // Fallback: append to end
      onChange(value + field);
    }
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${className}`}>
      <div className="lg:col-span-2 space-y-2">
        <Label htmlFor="message-composer">
          {type === 'email' ? 'Email Message' : 'SMS Message'}
        </Label>
        <Textarea
          id="message-composer"
          data-testid="textarea-message-composer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={type === 'sms' ? 4 : 8}
          className="font-mono text-sm"
        />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Use merge fields to personalize your message</span>
          {type === 'sms' && (
            <span className={value.length > 160 ? 'text-red-600' : ''}>
              {value.length}/160 characters
            </span>
          )}
        </div>
      </div>
      
      {showMergeFields && (
        <div className="lg:col-span-1">
          <MergeFieldSelector onInsertField={handleInsertField} />
        </div>
      )}
    </div>
  );
}