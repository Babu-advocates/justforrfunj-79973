import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BankManagerSidebar } from "@/components/BankManagerSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ApplicationDetailsModal } from "@/components/ApplicationDetailsModal";
import { getR2SignedUrl } from "@/lib/r2Storage";
import JSZip from "jszip";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Download,
  CalendarIcon
} from "lucide-react";

export default function DocumentTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Helpers to keep status display consistent with Application Details
  const statusLabelFromRaw = (raw: string) => {
    switch (raw) {
      case 'submitted':
        return 'Submitted';
      case 'to_be_assigned':
        return 'To Be Assigned';
      case 'assigned':
        return 'Assigned';
      case 'in_review':
        return 'In Review';
      case 'waiting_for_approval':
        return 'Opinion Submitted';
      case 'completed':
        return 'Completed';
      case 'redirected':
        return 'Redirected';
      case 'draft':
        return 'Draft';
      default:
        return raw.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    }
  };

  const isStatusMatch = (raw: string, filter: string) => {
    if (filter === 'all') return true;
    return raw === filter;
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const bankManagerId = localStorage.getItem("bankManagerId");
      
      if (!bankManagerId) {
        toast({
          title: "Error",
          description: "Bank manager not found. Please log in again.",
          variant: "destructive",
        });
        return;
      }

      // Fetch bank manager details to get bank name
      const { data: bankManagerData, error: managerError } = await supabase
        .from("bank_manager_accounts")
        .select("bank_name")
        .eq("id", bankManagerId)
        .single();

      if (managerError || !bankManagerData) {
        toast({
          title: "Error",
          description: "Failed to fetch bank manager details.",
          variant: "destructive",
        });
        return;
      }

      const bankNames = Array.isArray(bankManagerData.bank_name) 
        ? bankManagerData.bank_name 
        : [bankManagerData.bank_name];

      // Fetch applications for this bank - include all relevant statuses
      const { data: applications, error } = await supabase
        .from("applications")
        .select("*")
        .in("bank_name", bankNames)
        .in("status", ["submitted", "to_be_assigned", "assigned", "in_review", "waiting_for_approval", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match the expected format
      const transformedData = applications?.map((app) => {
        const submissionDate = new Date(app.submission_date || app.created_at);
        const today = new Date();
        const daysElapsed = Math.floor(
          (today.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Display label based on raw status (kept consistent with details modal)
        const displayStatus = statusLabelFromRaw(app.status);
        

        return {
          id: app.id,
          applicationNo: app.application_id,
          clientName: app.borrower_name,
          dateSubmitted: submissionDate.toISOString().split("T")[0],
          documentType: app.application_type === "legal opinion" ? "Loan Legal Opinion" : "Loan Recovery",
          status: displayStatus,
          advocate: app.assigned_to_username || "Not Assigned",
          daysElapsed,
          rawStatus: app.status,
        };
      }) || [];

      setDocumentsData(transformedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (applicationId: string) => {
    setSelectedApplicationId(applicationId);
    setShowDetailsModal(true);
  };

  const getStatusColor = (raw: string) => {
    switch (raw.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'waiting_for_approval':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_review':
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'to_be_assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (raw: string) => {
    switch (raw.toLowerCase()) {
      case 'completed':
      case 'waiting_for_approval':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_review':
      case 'assigned':
        return <RefreshCw className="h-4 w-4" />;
      case 'submitted':
      case 'to_be_assigned':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredDocuments = documentsData.filter(doc => {
    const matchesSearch = doc.applicationNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.documentType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = isStatusMatch(doc.rawStatus, statusFilter);
    
    // Date filtering
    let matchesDate = true;
    if (startDate || endDate) {
      const docDate = new Date(doc.dateSubmitted);
      if (startDate && docDate < startDate) matchesDate = false;
      if (endDate && docDate > endDate) matchesDate = false;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDownloadDocuments = async () => {
    try {
      setDownloading(true);
      const zip = new JSZip();
      
      // Get all application IDs from filtered documents
      const applicationIds = filteredDocuments.map(doc => doc.id);
      
      if (applicationIds.length === 0) {
        toast({
          title: "No Documents",
          description: "No documents to download in the current filter.",
          variant: "destructive",
        });
        return;
      }

      // Fetch all applications with their documents
      const { data: applications, error } = await supabase
        .from("applications")
        .select("id, application_id, uploaded_files")
        .in("id", applicationIds);

      if (error) throw error;

      let fileCount = 0;
      
      // Download each document and add to zip
      for (const app of applications || []) {
        if (app.uploaded_files && Array.isArray(app.uploaded_files)) {
          const appFolder = zip.folder(app.application_id);
          
          for (const fileData of app.uploaded_files) {
            try {
              const file = fileData as any;
              if (file.url) {
                // Extract the file path from R2 URL
                let filePath = '';
                if (file.url.includes('r2.cloudflarestorage.com')) {
                  const urlParts = file.url.split('/babuadvocate/');
                  if (urlParts.length > 1) {
                    filePath = urlParts[1];
                  }
                }

                if (filePath) {
                  // Get signed URL from R2 edge function
                  const { data: signedData, error: signedError } = await supabase.functions.invoke('r2-download', {
                    body: { filePath }
                  });

                  if (signedError || !signedData?.signedUrl) {
                    console.error('Failed to get signed URL:', signedError);
                    continue;
                  }

                  // Download using signed URL
                  const response = await fetch(signedData.signedUrl);
                  if (!response.ok) {
                    throw new Error(`Failed to download: ${response.statusText}`);
                  }
                  const blob = await response.blob();
                  const fileName = file.name || `document_${fileCount}.pdf`;
                  appFolder?.file(fileName, blob);
                  fileCount++;
                } else {
                  // Fallback for non-R2 URLs
                  const response = await fetch(file.url);
                  const blob = await response.blob();
                  const fileName = file.name || `document_${fileCount}.pdf`;
                  appFolder?.file(fileName, blob);
                  fileCount++;
                }
              }
            } catch (err) {
              console.error(`Failed to download file:`, err);
            }
          }
        }
      }

      if (fileCount === 0) {
        toast({
          title: "No Files",
          description: "No document files found to download.",
          variant: "destructive",
        });
        return;
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      
      // Name the zip file with date range
      const datePrefix = startDate && endDate 
        ? `${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}`
        : startDate 
        ? `from_${format(startDate, 'yyyy-MM-dd')}`
        : endDate
        ? `until_${format(endDate, 'yyyy-MM-dd')}`
        : 'all_documents';
      
      link.download = `${datePrefix}_documents.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Complete",
        description: `Successfully downloaded ${fileCount} documents.`,
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download documents",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const statusCounts = {
    total: documentsData.length,
    pending: documentsData.filter(d => d.rawStatus === 'submitted' || d.rawStatus === 'to_be_assigned').length,
    inReview: documentsData.filter(d => d.rawStatus === 'assigned' || d.rawStatus === 'in_review' || d.rawStatus === 'waiting_for_approval').length,
    completed: documentsData.filter(d => d.rawStatus === 'completed').length,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <BankManagerSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6 gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">Document Tracking</h1>
              <p className="text-sm text-muted-foreground">Track documents submitted to advocates</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Status Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                      <p className="text-2xl font-bold">{statusCounts.total}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">In Review</p>
                      <p className="text-2xl font-bold text-blue-600">{statusCounts.inReview}</p>
                    </div>
                    <RefreshCw className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{statusCounts.completed}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                      <CardTitle>Document List</CardTitle>
                      <CardDescription>All documents submitted to advocates</CardDescription>
                    </div>
                    <Button 
                      onClick={handleDownloadDocuments} 
                      disabled={downloading || filteredDocuments.length === 0}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      {downloading ? "Downloading..." : "Download All"}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="to_be_assigned">To Be Assigned</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_review">In Review</SelectItem>
                        <SelectItem value="waiting_for_approval">Opinion Submitted</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-48 justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Start Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-48 justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "End Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-2" />
                    <p>No documents found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Application No</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Client Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Date Submitted</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Document Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Advocate</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                      </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((doc) => (
                          <tr key={doc.applicationNo} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-blue-600">{doc.applicationNo}</td>
                            <td className="py-3 px-4 text-gray-700">{doc.clientName}</td>
                            <td className="py-3 px-4 text-gray-600">{doc.dateSubmitted}</td>
                            <td className="py-3 px-4 text-gray-700">{doc.documentType}</td>
                            <td className="py-3 px-4 text-gray-600">{doc.advocate}</td>
                            <td className="py-3 px-4">
                              <Badge className={`${getStatusColor(doc.rawStatus)} flex items-center gap-1 w-fit`}>
                                {getStatusIcon(doc.rawStatus)}
                                {statusLabelFromRaw(doc.rawStatus)}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 hover:bg-primary/10"
                                onClick={() => handleViewDetails(doc.applicationNo)}
                                title="View application and opinion details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Application Details Modal */}
      {selectedApplicationId && (
        <ApplicationDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedApplicationId(null);
          }}
          applicationId={selectedApplicationId}
        />
      )}
    </SidebarProvider>
  );
}