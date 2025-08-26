import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search,
  User,
  BookOpen,
  MessageCircle,
  Calendar,
  Mail,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import { format } from "date-fns";

const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  type: z.enum(["all", "users", "courses", "discussions", "classes", "emails"]),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.enum(["relevance", "date", "name", "activity"]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

type SearchFormData = z.infer<typeof searchSchema>;

interface SearchResult {
  id: string;
  type: "user" | "course" | "discussion" | "class" | "email";
  title: string;
  description: string;
  metadata: Record<string, any>;
  score: number;
  lastModified: string;
  url: string;
}

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdvancedSearchDialog({ open, onOpenChange }: AdvancedSearchDialogProps) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      type: "all",
      sortBy: "relevance",
      sortOrder: "desc",
    },
  });

  const { data: recentSearches } = useQuery({
    queryKey: ["/api/admin/recent-searches"],
    enabled: open,
  });

  const { data: popularSearches } = useQuery({
    queryKey: ["/api/admin/popular-searches"],
    enabled: open,
  });

  const handleSearch = async (data: SearchFormData) => {
    setIsSearching(true);
    setActiveTab("results");
    
    try {
      const params = new URLSearchParams();
      params.append("q", data.query);
      params.append("type", data.type);
      if (data.dateFrom) params.append("dateFrom", data.dateFrom);
      if (data.dateTo) params.append("dateTo", data.dateTo);
      if (data.status) params.append("status", data.status);
      params.append("sortBy", data.sortBy);
      params.append("sortOrder", data.sortOrder);

      const response = await fetch(`/api/admin/search?${params.toString()}`);
      const results = await response.json();
      setSearchResults(results.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user": return <User className="h-4 w-4" />;
      case "course": return <BookOpen className="h-4 w-4" />;
      case "discussion": return <MessageCircle className="h-4 w-4" />;
      case "class": return <Calendar className="h-4 w-4" />;
      case "email": return <Mail className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "user": return "bg-blue-100 text-blue-800";
      case "course": return "bg-green-100 text-green-800";
      case "discussion": return "bg-purple-100 text-purple-800";
      case "class": return "bg-orange-100 text-orange-800";
      case "email": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleQuickSearch = (query: string, type: string = "all") => {
    form.setValue("query", query);
    form.setValue("type", type as any);
    form.handleSubmit(handleSearch)();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" data-testid="advanced-search-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </DialogTitle>
          <DialogDescription>
            Search across all platform content with advanced filters and sorting options
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" data-testid="tab-search-form">Search</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-search-results">
              Results {searchResults.length > 0 && `(${searchResults.length})`}
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-search-history">History</TabsTrigger>
          </TabsList>

          {/* Search Form Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Criteria</CardTitle>
                <CardDescription>
                  Define your search parameters to find exactly what you're looking for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="query"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Search Query</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  {...field} 
                                  placeholder="Enter your search query..."
                                  className="pl-10"
                                  data-testid="input-search-query"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-search-type">
                                  <SelectValue placeholder="Select content type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="all">All Content</SelectItem>
                                <SelectItem value="users">Users</SelectItem>
                                <SelectItem value="courses">Courses</SelectItem>
                                <SelectItem value="discussions">Discussions</SelectItem>
                                <SelectItem value="classes">Live Classes</SelectItem>
                                <SelectItem value="emails">Emails</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status (Optional)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-search-status">
                                  <SelectValue placeholder="Any status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Any status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>From Date (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                data-testid="input-search-date-from"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dateTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>To Date (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="date"
                                data-testid="input-search-date-to"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sortBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort By</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-search-sort-by">
                                  <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="relevance">Relevance</SelectItem>
                                <SelectItem value="date">Date Modified</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="activity">Activity</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sortOrder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sort Order</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-search-sort-order">
                                  <SelectValue placeholder="Sort order" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="desc">
                                  <div className="flex items-center gap-2">
                                    <SortDesc className="h-4 w-4" />
                                    Descending
                                  </div>
                                </SelectItem>
                                <SelectItem value="asc">
                                  <div className="flex items-center gap-2">
                                    <SortAsc className="h-4 w-4" />
                                    Ascending
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        type="submit" 
                        disabled={isSearching}
                        data-testid="button-perform-search"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        {isSearching ? "Searching..." : "Search"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => form.reset()}
                        data-testid="button-clear-search"
                      >
                        Clear
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Quick Search Suggestions */}
            {popularSearches && (popularSearches as any[]).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Popular Searches</CardTitle>
                  <CardDescription>Quick access to commonly searched items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(popularSearches as any[]).map((search, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickSearch(search.query, search.type)}
                        data-testid={`button-popular-search-${index}`}
                      >
                        {getTypeIcon(search.type)}
                        <span className="ml-2">{search.query}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Search Results Tab */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Search Results</CardTitle>
                    <CardDescription>
                      Found {searchResults.length} results
                    </CardDescription>
                  </div>
                  {searchResults.length > 0 && (
                    <Button variant="outline" size="sm" data-testid="button-export-results">
                      <Download className="h-4 w-4 mr-2" />
                      Export Results
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isSearching ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="mt-1">
                                {getTypeIcon(result.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{result.title}</h3>
                                  <Badge className={getTypeColor(result.type)}>
                                    {result.type}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Score: {Math.round(result.score * 100)}%
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {result.description}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Last modified: {format(new Date(result.lastModified), "MMM dd, yyyy")}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" data-testid={`button-view-result-${index}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-edit-result-${index}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : activeTab === "results" ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No results found. Try adjusting your search criteria.</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Search History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Searches</CardTitle>
                <CardDescription>Your search history for quick access</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSearches && (recentSearches as any[]).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Query</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Results</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(recentSearches as any[]).map((search, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{search.query}</TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(search.type)}>
                              {search.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{search.resultCount}</TableCell>
                          <TableCell>{format(new Date(search.timestamp), "MMM dd, HH:mm")}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuickSearch(search.query, search.type)}
                              data-testid={`button-repeat-search-${index}`}
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No recent searches</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}