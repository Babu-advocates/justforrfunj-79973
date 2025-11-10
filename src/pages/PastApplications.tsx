import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { History, FileText, Calendar, User, DollarSign, CheckCircle, XCircle, Eye, Building2, ArrowUpDown, Loader2, Phone, Mail, MapPin, Download, FileDown, CalendarIcon } from "lucide-react";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { QueryForm } from "@/components/QueryForm";
import { ApplicationDetailsModal } from "@/components/ApplicationDetailsModal";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

interface Application {
  id: string;
  application_id: string;
  borrower_name: string;
  loan_type: string;
  loan_amount: number;
  status: string;
  submission_date: string;
  bank_name: string;
  branch_name?: string;
  assigned_to_username?: string;
  created_at: string;
  updated_at: string;
  opinion_files?: any[];
}

const PastApplications = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [selectedBank, setSelectedBank] = useState<string>("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [applications, setApplications] = useState<Application[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; username: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Determine if this is an admin route
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase
          .from('employee_accounts')
          .select('id, username')
          .eq('is_active', true)
          .order('username', { ascending: true });

        if (error) throw error;
        setEmployees(data || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    };

    if (isAdminRoute) {
      fetchEmployees();
    }
  }, [isAdminRoute]);

  // Fetch applications from Supabase
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        
        // Get employee username from localStorage
        const employeeUsername = localStorage.getItem('employeeUsername');
        
        let query = supabase
          .from('applications')
          .select('*');

        if (!isAdminRoute && employeeUsername) {
          // For employee route, show only applications assigned to this employee with completed status
          query = query
            .eq('assigned_to_username', employeeUsername)
            .in('status', ['submitted', 'completed', 'approved', 'rejected']);
        } else {
          // For admin route, show all submitted applications
          query = query.eq('status', 'submitted');
        }
        
        const { data, error } = await query.order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }

        setApplications((data || []) as Application[]);
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: "Error",
          description: "Failed to fetch applications. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [toast, isAdminRoute]);

  // Get unique banks for filter
  const banks = useMemo(() => {
    const uniqueBanks = [...new Set(applications
      .map(app => app.bank_name)
      .filter(bankName => bankName && bankName.trim() !== '') // Filter out empty/null bank names
    )];
    return uniqueBanks.sort();
  }, [applications]);

  // Get unique branches for filter (filtered by selected bank)
  const branches = useMemo(() => {
    let appsToFilter = applications;
    
    if (selectedBank !== "all") {
      appsToFilter = appsToFilter.filter(app => app.bank_name === selectedBank);
    }
    
    const uniqueBranches = [...new Set(appsToFilter
      .map(app => app.branch_name)
      .filter(branchName => branchName && branchName.trim() !== '')
    )];
    return uniqueBranches.sort();
  }, [applications, selectedBank]);

  // Filter and sort applications
  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications;

    // Filter by bank
    if (selectedBank !== "all") {
      filtered = filtered.filter(app => app.bank_name === selectedBank);
    }

    // Filter by branch
    if (selectedBranch !== "all") {
      filtered = filtered.filter(app => app.branch_name === selectedBranch);
    }

    // Filter by employee
    if (selectedEmployee !== "all") {
      filtered = filtered.filter(app => app.assigned_to_username === selectedEmployee);
    }

    // Filter by date range (based on created_at)
    if (startDate || endDate) {
      filtered = filtered.filter(app => {
        const appDate = new Date(app.created_at);
        const matchesStartDate = !startDate || appDate >= startDate;
        const matchesEndDate = !endDate || appDate <= new Date(endDate.setHours(23, 59, 59, 999));
        return matchesStartDate && matchesEndDate;
      });
    }

    // Sort by date
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.updated_at);
      const dateB = new Date(b.updated_at);
      
      return sortOrder === "newest" 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime();
    });

    return sorted;
  }, [applications, selectedBank, selectedBranch, selectedEmployee, sortOrder, startDate, endDate]);
  const downloadOpinionDocuments = async () => {
    try {
      // Get all applications with opinion files
      const appsWithOpinions = filteredAndSortedApplications.filter(
        app => app.opinion_files && Array.isArray(app.opinion_files) && app.opinion_files.length > 0
      );

      if (appsWithOpinions.length === 0) {
        toast({
          title: "No Opinion Documents",
          description: "No opinion documents found for the filtered applications.",
          variant: "destructive",
        });
        return;
      }

      // Collect all opinion files
      const allOpinionFiles: Array<{ file: any; appId: string; borrowerName: string; fileName: string }> = [];
      appsWithOpinions.forEach(app => {
        const typedApp = app as any;
        if (typedApp.opinion_files) {
          typedApp.opinion_files.forEach((file: any, index: number) => {
            // Create a unique filename for each PDF
            const originalName = file?.name || `opinion_${index + 1}.pdf`;
            const fileExtension = originalName.split('.').pop();
            const fileNameWithoutExt = originalName.replace(`.${fileExtension}`, '');
            const uniqueFileName = `${typedApp.application_id}_${fileNameWithoutExt}.${fileExtension}`;
            
            allOpinionFiles.push({
              file,
              appId: typedApp.application_id,
              borrowerName: typedApp.borrower_name,
              fileName: uniqueFileName
            });
          });
        }
      });

      toast({
        title: "Processing",
        description: `Preparing ${allOpinionFiles.length} opinion document(s) for download...`,
      });

      // Create a new ZIP file
      const zip = new JSZip();
      let successCount = 0;
      let failCount = 0;

      for (const { file, fileName } of allOpinionFiles) {
        try {
          let pdfUrl = '';
          
          if (file?.url) {
            pdfUrl = file.url;
          } else if (file?.path) {
            // Try to get signed URL from Supabase storage
            const { data: signedUrlData, error: signedError } = await supabase.storage
              .from('opinion-documents')
              .createSignedUrl(file.path, 3600);

            if (!signedError && signedUrlData?.signedUrl) {
              pdfUrl = signedUrlData.signedUrl;
            } else {
              failCount++;
              console.error(`Failed to get signed URL for ${file.path}:`, signedError);
              continue;
            }
          } else {
            failCount++;
            console.error(`No valid URL or path for file:`, file);
            continue;
          }

          // Fetch the PDF
          const response = await fetch(pdfUrl);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const pdfBytes = await response.arrayBuffer();
          
          // Add the PDF to the ZIP file
          zip.file(fileName, pdfBytes);
          
          successCount++;
        } catch (error) {
          failCount++;
          console.error('Error processing opinion file:', error);
        }
      }

      if (successCount === 0) {
        toast({
          title: "Error",
          description: "Failed to process any opinion documents",
          variant: "destructive",
        });
        return;
      }

      // Generate the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const blobUrl = URL.createObjectURL(zipBlob);
      
      // Create filename with bank name and date range
      const startDateStr = startDate ? format(startDate, 'dd-MM-yyyy') : 'Start';
      const endDateStr = endDate ? format(endDate, 'dd-MM-yyyy') : 'End';
      const bankName = selectedBank !== 'all' ? `${selectedBank.replace(/\s+/g, '_')}_` : '';
      const zipFileName = `Legal_Opinions_${bankName}${startDateStr}_to_${endDateStr}.zip`;
      
      // Download the ZIP file
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      toast({
        title: "Download Complete",
        description: `Downloaded ${successCount} opinion document(s) as separate PDFs in a ZIP file.${failCount > 0 ? ` ${failCount} failed.` : ''}`,
        variant: failCount > 0 ? "default" : "default",
      });

    } catch (error) {
      console.error('Error downloading opinion documents:', error);
      toast({
        title: "Error",
        description: "Failed to download opinion documents",
        variant: "destructive",
      });
    }
  };

  const exportToExcel = () => {
    try {
      const dataToExport = filteredAndSortedApplications.map((app, index) => ({
        'S.No': index + 1,
        'Application ID': app.application_id || '-',
        'Borrower Name': app.borrower_name || '-',
        'Bank Name': app.bank_name || '-',
        'Loan Type': app.loan_type || '-',
        'Loan Amount': app.loan_amount ? `₹${app.loan_amount.toLocaleString()}` : '-',
        'Status': app.status || '-',
        'Created Date': app.created_at ? format(new Date(app.created_at), 'dd-MM-yyyy') : '-',
        'Updated Date': app.updated_at ? format(new Date(app.updated_at), 'dd-MM-yyyy') : '-',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Past Applications');

      worksheet['!cols'] = [
        { wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 25 }, 
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];

      let filename = 'Past_Applications';
      if (startDate || endDate) {
        const start = startDate ? format(startDate, 'dd-MM-yyyy') : 'Start';
        const end = endDate ? format(endDate, 'dd-MM-yyyy') : 'End';
        filename += `_${start}_to_${end}`;
      }
      if (selectedBank !== 'all') {
        filename += `_${selectedBank.replace(/\s+/g, '_')}`;
      }
      filename += '.xlsx';

      XLSX.writeFile(workbook, filename);

      toast({
        title: "Success",
        description: `Exported ${dataToExport.length} applications to Excel`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "Failed to export to Excel",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "submitted":
        return <FileText className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Rejected
          </Badge>
        );
      case "submitted":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            Submitted
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            Completed
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
    }
  };

  const handleFileView = async (file: any, bucketName = 'application-documents') => {
    try {
      const fileName = file?.name || 'document';
      console.log('Attempting to access file:', fileName);

      // Check if file has a direct URL (newer uploads)
      if (file?.url) {
        await downloadFile(file.url, fileName);
        return;
      }

      // Check if file has a storage path (newer uploads)
      if (file?.path) {
        const { data: signedUrlData, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(file.path, 3600);

        if (signedError) {
          console.error('Error creating signed URL:', signedError);
          toast({
            title: 'Error',
            description: 'Could not access file',
            variant: 'destructive'
          });
          return;
        }

        if (signedUrlData?.signedUrl) {
          await downloadFile(signedUrlData.signedUrl, fileName);
          return;
        }
      }

      // Legacy fallback - search for file in storage
      const { data: fileList, error: listError } = await supabase.storage
        .from('application-documents')
        .list('', {
          limit: 1000,
          search: fileName
        });

      if (listError) {
        console.error('Error checking file existence:', listError);
        toast({
          title: 'Error',
          description: 'Could not check file availability',
          variant: 'destructive'
        });
        return;
      }

      const foundFile = fileList?.find(f => f.name === fileName);
      if (!foundFile) {
        toast({
          title: 'File Not Found',
          description: 'The document was not found in storage.',
          variant: 'destructive'
        });
        return;
      }

      // File found at root level
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(fileName, 3600);

      if (signedError) {
        console.error('Error creating signed URL:', signedError);
        toast({
          title: 'Error',
          description: 'Could not access file',
          variant: 'destructive'
        });
        return;
      }

      if (signedUrlData?.signedUrl) {
        await downloadFile(signedUrlData.signedUrl, fileName);
      } else {
        toast({
          title: 'Error',
          description: 'Could not access file',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('Error in handleFileView:', error);
      toast({
        title: 'Error',
        description: 'Failed to access document',
        variant: 'destructive'
      });
    }
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: 'Success',
        description: `${fileName} downloaded successfully`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Download error:', error);
      
      try {
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          toast({
            title: 'Popup Blocked',
            description: 'Please allow popups or check your downloads folder',
            variant: 'destructive'
          });
        }
      } catch (fallbackError) {
        toast({
          title: 'Error',
          description: 'Could not download or open the file',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-gradient-legal-bg overflow-hidden">
        {isAdminRoute ? <AppSidebar /> : <EmployeeSidebar />}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="flex-shrink-0 bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm shadow-elegant border-b border-white/20">
            <div className="px-3 md:px-6">
                <div className="flex justify-between items-center h-14 md:h-16">
                <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
                  <SidebarTrigger className="text-slate-600 hover:text-blue-600 transition-colors duration-200 flex-shrink-0" />
                  <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>
                  <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <History className="h-4 w-4 md:h-6 md:w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-base md:text-xl font-bold bg-gradient-to-r from-slate-800 to-amber-600 bg-clip-text text-transparent truncate">Past Applications</h1>
                      <p className="text-xs md:text-sm text-slate-600 hidden sm:block truncate">View completed loan applications</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  <Button 
                    onClick={exportToExcel}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex-shrink-0 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
                  >
                    <FileDown className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                    <span className="hidden md:inline">Export to Excel</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="px-6 py-8">
              <Card className="bg-white/95 backdrop-blur-sm shadow-elegant border border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Past Applications
                      </CardTitle>
                      <CardDescription>
                        View completed applications
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">Applications</h3>
                        <p className="text-sm text-slate-600">
                          Showing {filteredAndSortedApplications.length} of {applications.length} applications
                        </p>
                      </div>
                      
                      {/* Filter and Sort Controls */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-500" />
                          <Select value={selectedBank} onValueChange={(value) => {
                            setSelectedBank(value);
                            setSelectedBranch("all"); // Reset branch when bank changes
                          }}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by bank" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Banks</SelectItem>
                              {banks.map((bank) => (
                                <SelectItem key={bank} value={bank}>
                                  {bank}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-500" />
                          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Filter by branch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Branches</SelectItem>
                              {branches.map((branch) => (
                                <SelectItem key={branch} value={branch}>
                                  {branch}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {isAdminRoute && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by employee" />
                              </SelectTrigger>
                              <SelectContent className="bg-white z-50">
                                <SelectItem value="all">All Employees</SelectItem>
                                {employees.map((employee) => (
                                  <SelectItem key={employee.id} value={employee.username}>
                                    {employee.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Date Range Filter */}
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4 text-slate-500" />
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-[140px] justify-start text-left font-normal",
                                  !startDate && "text-muted-foreground"
                                )}
                              >
                                {startDate ? format(startDate, "dd-MM-yyyy") : "Start Date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <span className="text-slate-500">to</span>
                          
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-[140px] justify-start text-left font-normal",
                                  !endDate && "text-muted-foreground"
                                )}
                              >
                                {endDate ? format(endDate, "dd-MM-yyyy") : "End Date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>

                          {(startDate || endDate) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStartDate(undefined);
                                setEndDate(undefined);
                              }}
                            >
                              Clear Dates
                            </Button>
                          )}
                          
                          {startDate && endDate && (
                            <Button 
                              onClick={downloadOpinionDocuments}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                              size="sm"
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download Opinions
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4 text-slate-500" />
                          <Select value={sortOrder} onValueChange={(value: "newest" | "oldest") => setSortOrder(value)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="newest">Newest First</SelectItem>
                              <SelectItem value="oldest">Oldest First</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
                        <span className="ml-2 text-slate-600">Loading applications...</span>
                      </div>
                    ) : filteredAndSortedApplications.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">No applications found</h3>
                        <p className="text-slate-600">No applications match your current filters.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredAndSortedApplications.map((application) => (
                          <Card key={application.id} className="border border-slate-200 hover:shadow-md transition-shadow duration-200">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <h3 className="text-lg font-semibold text-slate-800">
                                        {application.borrower_name}
                                      </h3>
                                      <div className="flex items-center gap-1">
                                        {getStatusIcon(application.status)}
                                        {getStatusBadge(application.status)}
                                      </div>
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      ID: {application.application_id}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <Building2 className="h-4 w-4 text-slate-500" />
                                      <span className="text-slate-600">{application.bank_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-slate-500" />
                                      <span className="text-slate-600">{application.loan_type}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <DollarSign className="h-4 w-4 text-slate-500" />
                                      <span className="text-slate-600">₹{application.loan_amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-slate-500" />
                                      <span className="text-slate-600">
                                        Updated: {new Date(application.updated_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2 ml-4">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedApplicationId(application.application_id);
                                      setDetailsModalOpen(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                </Card>
            </div>
          </main>
        </div>
      </div>

      {/* Application Details Modal */}
      <ApplicationDetailsModal
        applicationId={selectedApplicationId}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
      />
    </SidebarProvider>
  );
  };

export default PastApplications;