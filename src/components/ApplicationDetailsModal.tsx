import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Calendar, User, Building, CreditCard, MapPin, Phone, Mail, ArrowUpRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://iyizrpyjtkmpefaqzeth.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5aXpycHlqdGttcGVmYXF6ZXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDcwMjcsImV4cCI6MjA3MzA4MzAyN30.oHQmdNGORBegLFOAnyO0hrl93yeKy_mVcWC88npqFPU";
import { useToast } from "@/hooks/use-toast";
import { QueryForm } from "@/components/QueryForm";
interface ApplicationDetailsModalProps {
  applicationId: string;
  isOpen: boolean;
  onClose: () => void;
}
interface Application {
  id: string;
  application_id: string;
  bank_name: string;
  borrower_name: string;
  application_type: string;
  loan_type: string;
  loan_amount: number;
  submission_date: string;
  status: string;
  customer_id: string;
  phone: string;
  email: string;
  address: string;
  district?: string;
  taluk?: string;
  village?: string;
  nature_of_property?: string;
  location_of_property?: string;
  survey_number?: string;
  extent_of_property?: string;
  plot_no?: string;
  layout_name?: string;
  bank_application_no?: string;
  account_number?: string;
  salesman_name?: string;
  salesman_contact?: string;
  salesman_email?: string;
  office_branch?: string;
  branch_name?: string;
  owner_name?: string;
  sanction_date?: string;
  uploaded_files: any;
  opinion_files: any;
  assigned_to?: string;
  assigned_to_username?: string;
  assigned_at?: string;
  original_assigned_to?: string;
  original_assigned_to_username?: string;
  redirect_reason?: string;
  digital_signature_applied: boolean;
}
export const ApplicationDetailsModal = ({
  applicationId,
  isOpen,
  onClose
}: ApplicationDetailsModalProps) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);
  const [employees, setEmployees] = useState<Array<{
    id: string;
    username: string;
  }>>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<'employee' | 'bank'>('employee');
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFileName, setDownloadingFileName] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (isOpen && applicationId) {
      fetchApplicationDetails();
      // Determine user type and get user details
      const isAdmin = localStorage.getItem("isAdminLoggedIn") === "true";
      const isEmployee = localStorage.getItem("employeeLogin") === "true";
      const isBankEmployee = localStorage.getItem("bankEmployeeLogin") === "true";
      
      // Both admin and employee are on the advocate/employee side
      if (isAdmin) {
        setCurrentUserType("employee");
        setCurrentUserName(localStorage.getItem("adminUsername") || "Admin");
        setCurrentUserEmail(localStorage.getItem("adminEmail") || "");
      } else if (isEmployee) {
        setCurrentUserType("employee");
        setCurrentUserName(localStorage.getItem("employeeUsername") || "Employee");
        setCurrentUserEmail(localStorage.getItem("employeeEmail") || "");
      } else if (isBankEmployee) {
        setCurrentUserType("bank");
        setCurrentUserName(localStorage.getItem("bankEmployeeUsername") || "Bank Employee");
        setCurrentUserEmail(localStorage.getItem("bankEmployeeEmail") || "");
      }
    }
  }, [isOpen, applicationId]);

  // Separate effect to handle scroll reset when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset scroll position immediately and after a delay
      const scrollToTop = () => {
        const scrollViewport = document.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
          scrollViewport.scrollTop = 0;
        }
      };
      
      scrollToTop();
      const timer1 = setTimeout(scrollToTop, 50);
      const timer2 = setTimeout(scrollToTop, 150);
      const timer3 = setTimeout(scrollToTop, 300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, application]);
  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('applications').select('*').eq('application_id', applicationId).single();
      if (error) {
        console.error('Error fetching application details:', error);
        toast({
          title: "Error",
          description: "Failed to fetch application details",
          variant: "destructive"
        });
        return;
      }
      setApplication(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const {
        data,
        error
      } = await supabase.from('employee_accounts').select('id, username').eq('is_active', true).order('username');
      if (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: "Error",
          description: "Failed to fetch employee accounts",
          variant: "destructive"
        });
        return;
      }
      setEmployees(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoadingEmployees(false);
    }
  };
  const handleRedirectClick = () => {
    setShowEmployeeSelect(true);
    fetchEmployees();
  };
  const handleEmployeeSelect = async (employeeId: string) => {
    try {
      const selectedEmployee = employees.find(emp => emp.id === employeeId);
      if (!selectedEmployee || !application) return;

      // Set up redirect data - preserve original assignee info
      const updateData: any = {
        assigned_to: employeeId,
        assigned_to_username: selectedEmployee.username,
        assigned_at: new Date().toISOString(),
        status: 'redirected'
      };

      // If this is the first redirect, save the original assignee
      if (!application.original_assigned_to_username) {
        updateData.original_assigned_to = application.assigned_to;
        updateData.original_assigned_to_username = application.assigned_to_username;
      }
      const {
        error
      } = await supabase.from('applications').update(updateData).eq('id', application.id);
      if (error) {
        console.error('Error assigning application:', error);
        toast({
          title: "Error",
          description: "Failed to assign application",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Success",
        description: `Application redirected to ${selectedEmployee.username}`
      });

      // Refresh application details
      fetchApplicationDetails();
      setShowEmployeeSelect(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  const downloadFile = async (fileUrl: string, fileName: string) => {
    return new Promise<void>(async (resolve, reject) => {
      setIsDownloading(true);
      setDownloadingFileName(fileName);
      setDownloadProgress(0);

      const functionUrl = `${SUPABASE_URL}/functions/v1/proxy-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(fileName)}`;

      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      const xhr = new XMLHttpRequest();
      xhr.open('GET', functionUrl, true);
      xhr.responseType = 'blob';
      
      // Add authentication headers for private function access
      if (session?.access_token) {
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
      } else {
        // Fallback to public anon key when no user session exists
        xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_PUBLISHABLE_KEY}`);
      }
      // Supabase also expects the apikey header
      xhr.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY);

      // Track download progress
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setDownloadProgress(Math.round(percentComplete));
        } else {
          // If length is not computable, show indeterminate progress
          setDownloadProgress(50);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          setDownloadProgress(100);
          
          const blob = xhr.response;
          const downloadUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100);
          
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadProgress(0);
            toast({ title: 'Success', description: `${fileName} downloaded successfully` });
            resolve();
          }, 500);
        } else {
          setIsDownloading(false);
          setDownloadProgress(0);
          toast({ 
            title: 'Download Failed', 
            description: `Failed to download ${fileName}. Status: ${xhr.status}`,
            variant: 'destructive' 
          });
          reject(new Error(`Download failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        setIsDownloading(false);
        setDownloadProgress(0);
        toast({ 
          title: 'Download Failed', 
          description: 'Unable to download file inside the app. Please try again.',
          variant: 'destructive' 
        });
        reject(new Error('Download failed'));
      };

      xhr.send();
    });
  };
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Submitted</Badge>;
      case "in_review":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">In Review</Badge>;
      case "assigned":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Assigned</Badge>;
      case "to_be_assigned":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">To Be Assigned</Badge>;
      case "waiting_for_approval":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Opinion Submitted</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case "redirected":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Redirected</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>;
    }
  };
  if (!application && !loading) {
    return null;
  }
  return <>
      {/* Download Progress Dialog */}
      {isDownloading && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card border rounded-lg shadow-lg p-6 w-[90%] max-w-md">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Downloading File</h3>
                  <p className="text-sm text-muted-foreground">{downloadingFileName}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{downloadProgress}%</span>
                </div>
                <Progress value={downloadProgress} className="h-2" />
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Please wait while your file is being downloaded...
              </p>
            </div>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-bank-navy" />
              <span>Application Details - {applicationId}</span>
            </DialogTitle>
            
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          {loading ? <div className="flex justify-center py-8">
              <p>Loading application details...</p>
            </div> : application ? <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-bank-navy" />
                    <span>Application Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Application ID</label>
                    <p className="font-semibold">{application.application_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Application Type</label>
                    <p className="font-semibold">{application.application_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank Name</label>
                    <p className="font-semibold">{application.bank_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="font-semibold mt-1">{application.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Submission Date</label>
                    <p className="font-semibold">{new Date(application.submission_date).toLocaleDateString()}</p>
                  </div>
                  {application.assigned_to_username && currentUserType !== 'bank' && <div>
                      <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                      <p className="font-semibold">{application.assigned_to_username}</p>
                    </div>}
                </CardContent>
              </Card>

              {/* Applicant Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-bank-navy" />
                    <span>Applicant Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Applicant Full Name</label>
                    <p className="font-semibold">{application.borrower_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">District</label>
                    <p className="font-semibold">{application.district || 'Not specified'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Address</label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{application.address}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Taluk</label>
                    <p className="font-semibold">{application.taluk || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Village</label>
                    <p className="font-semibold">{application.village || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Owner Name</label>
                    <p className="font-semibold">{application.owner_name || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Property Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-bank-navy" />
                    <span>Property Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nature of Property</label>
                    <p className="font-semibold">{application.nature_of_property || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location of Property</label>
                    <p className="font-semibold">{application.location_of_property || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Survey Number</label>
                    <p className="font-semibold">{application.survey_number || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Extent of Property</label>
                    <p className="font-semibold">{application.extent_of_property || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Plot No</label>
                    <p className="font-semibold">{application.plot_no || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Layout Name</label>
                    <p className="font-semibold">{application.layout_name || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Banking Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-bank-navy" />
                    <span>Banking Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank Application No</label>
                    <p className="font-semibold">{application.bank_application_no || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product (Loan Type)</label>
                    <p className="font-semibold">{application.loan_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loan Amount</label>
                    <p className="font-semibold text-emerald-600">₹{Number(application.loan_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Account Number</label>
                    <p className="font-semibold">{application.account_number || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Rep Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-bank-navy" />
                    <span>Bank Rep Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank Rep Name</label>
                    <p className="font-semibold">{application.salesman_name || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Bank Rep Contact No</label>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{application.salesman_contact || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Bank Rep Email</label>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{application.salesman_email || 'Not specified'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5 text-bank-navy" />
                    <span>Loan Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loan Type</label>
                    <p className="font-semibold">{application.loan_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Loan Amount</label>
                    <p className="font-semibold text-emerald-600">₹{Number(application.loan_amount).toLocaleString()}</p>
                  </div>
                  {application.sanction_date && <div>
                      <label className="text-sm font-medium text-muted-foreground">Sanction Date</label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{new Date(application.sanction_date).toLocaleDateString()}</p>
                      </div>
                    </div>}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Digital Signature Applied</label>
                    <p className="font-semibold">{application.digital_signature_applied ? "Yes" : "No"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              {(application.office_branch || application.branch_name) && (
                <Card className="bg-yellow-50/50 border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-yellow-600" />
                      <span className="text-yellow-800">Additional Notes</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {application.office_branch && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Office Branch</label>
                        <p className="font-semibold text-slate-700">{application.office_branch}</p>
                      </div>
                    )}
                    {application.branch_name && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Branch Name</label>
                        <p className="font-semibold text-slate-700">{application.branch_name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Uploaded Documents */}
              {application.uploaded_files && Array.isArray(application.uploaded_files) && application.uploaded_files.length > 0 && <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-bank-navy" />
                      <span>Uploaded Documents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {application.uploaded_files.map((file: any, index: number) => <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => downloadFile(file.url, file.name)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>}

              {/* Opinion Documents */}
              {application.opinion_files && Array.isArray(application.opinion_files) && application.opinion_files.length > 0 && <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      <span>Legal Opinion Documents</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {application.opinion_files.map((file: any, index: number) => <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-emerald-50">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-emerald-600" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                              {file.signed && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 mt-1">
                                  Digitally Signed
                                </Badge>}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => downloadFile(file.url, file.name)}>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>}

              {/* Query Communication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5 text-bank-navy" />
                    <span>Query Communication</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <QueryForm
                    applicationId={application.application_id}
                    currentUserType={currentUserType}
                    currentUserName={currentUserName}
                    currentUserEmail={currentUserEmail}
                  />
                </CardContent>
              </Card>
            </div> : <div className="text-center py-8">
              <p>Application not found</p>
            </div>}
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>;
};