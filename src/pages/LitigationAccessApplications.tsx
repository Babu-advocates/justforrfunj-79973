import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import LitigationAccessSidebar from "@/components/LitigationAccessSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";
import { Eye, RefreshCw, Building2, User, IndianRupee, History, Calendar, Menu, LogOut, LayoutDashboard, Scale, FileText, Download, Search } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
interface Application {
  id: string;
  application_id: string;
  bank_name: string;
  borrower_name: string;
  loan_type: string;
  loan_amount: number;
  status: string;
  submission_date: string;
  application_type: string;
  // Additional fields from litigation_cases
  court_name?: string;
  court_district?: string;
  filing_date?: string;
  next_hearing_date?: string;
  branch_name?: string;
  account_no?: string;
  co_borrower_name?: string;
  petitioner_name?: string;
  respondent_name?: string;
  petitioner_address?: string;
  respondent_address?: string;
  total_advocate_fees?: number;
  initial_fees?: number;
  initial_fees_received_on?: string;
  final_fees?: number;
  final_fees_received_on?: string;
  judgement_date?: string;
  present_status?: string;
  details?: string;
}
const LitigationAccessApplications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const username = localStorage.getItem('litigationAccessUsername') || 'User';
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchLoanType, setSearchLoanType] = useState("");
  useEffect(() => {
    fetchApplications();
  }, []);
  const fetchApplications = async () => {
    try {
      const username = localStorage.getItem('litigationAccessUsername');
      
      if (!username) {
        toast.error('User not logged in');
        setLoading(false);
        return;
      }

      // First, get all litigation case IDs visible to this user
      const { data: visibilityData, error: visibilityError } = await (supabase as any)
        .from('litigation_case_visibility')
        .select('litigation_case_id')
        .eq('litigation_access_username', username);

      if (visibilityError) {
        console.error('Error fetching visibility:', visibilityError);
        toast.error('Failed to load visibility settings');
        setLoading(false);
        return;
      }

      const visibleCaseIds = visibilityData?.map((v: any) => v.litigation_case_id) || [];

      if (visibleCaseIds.length === 0) {
        setApplications([]);
        setLoading(false);
        return;
      }

      // Fetch litigation cases that are visible to this user
      const { data: casesData, error: casesError } = await supabase
        .from('litigation_cases')
        .select('*')
        .in('id', visibleCaseIds)
        .order('created_at', { ascending: false });

      if (casesError) {
        console.error('Error fetching cases:', casesError);
        toast.error('Failed to load cases');
      } else {
        // Transform litigation cases to match the Application interface
        const transformedData = casesData?.map(litigationCase => ({
          id: litigationCase.id,
          application_id: litigationCase.case_no,
          bank_name: litigationCase.bank_name || '',
          borrower_name: litigationCase.category === 'bank' 
            ? litigationCase.borrower_name 
            : litigationCase.petitioner_name || '',
          loan_type: litigationCase.case_type,
          loan_amount: litigationCase.loan_amount || 0,
          status: litigationCase.status || 'Active',
          submission_date: litigationCase.created_at,
          application_type: litigationCase.category,
          // Additional fields
          court_name: litigationCase.court_name,
          court_district: litigationCase.court_district,
          filing_date: litigationCase.filing_date,
          next_hearing_date: litigationCase.next_hearing_date,
          branch_name: litigationCase.branch_name,
          account_no: litigationCase.account_no,
          co_borrower_name: litigationCase.co_borrower_name,
          petitioner_name: litigationCase.petitioner_name,
          respondent_name: litigationCase.respondent_name,
          petitioner_address: litigationCase.petitioner_address,
          respondent_address: litigationCase.respondent_address,
          total_advocate_fees: litigationCase.total_advocate_fees,
          initial_fees: litigationCase.initial_fees,
          initial_fees_received_on: litigationCase.initial_fees_received_on,
          final_fees: litigationCase.final_fees,
          final_fees_received_on: litigationCase.final_fees_received_on,
          judgement_date: litigationCase.judgement_date,
          present_status: litigationCase.present_status,
          details: litigationCase.details,
        })) || [];
        
        setApplications(transformedData);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'draft':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleViewDetails = (app: Application) => {
    setSelectedApplication(app);
    setIsDetailsOpen(true);
  };

  const handleViewHistory = async (app: Application) => {
    setSelectedApplication(app);
    setIsHistoryOpen(true);
    
    // Fetch history entries for this case
    try {
      const { data, error } = await supabase
        .from('litigation_case_history')
        .select('*')
        .eq('litigation_case_id', app.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching history:', error);
        toast.error('Failed to load case history');
      } else {
        setHistoryEntries(data || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load case history');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('litigationAccessLogin');
    localStorage.removeItem('litigationAccessId');
    localStorage.removeItem('litigationAccessUsername');
    navigate('/bank-login');
  };

  const handleExportToExcel = () => {
    const exportData = filteredApplications.map((app) => ({
      "Application ID": app.application_id,
      "Status": app.status,
      "Borrower Name": app.borrower_name,
      "Bank": app.bank_name || 'N/A',
      "Loan Type": app.loan_type,
      "Loan Amount": app.loan_amount || 'N/A',
      "Submitted On": new Date(app.submission_date).toLocaleDateString(),
      "Court Name": app.court_name || 'N/A',
      "Court District": app.court_district || 'N/A',
      "Filing Date": app.filing_date ? new Date(app.filing_date).toLocaleDateString() : 'N/A',
      "Next Hearing Date": app.next_hearing_date ? new Date(app.next_hearing_date).toLocaleDateString() : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Litigation Cases");

    XLSX.writeFile(workbook, `Litigation_Cases_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel file downloaded successfully');
  };

  const filteredApplications = applications.filter((app) => {
    const matchesName =
      searchName === "" ||
      app.borrower_name.toLowerCase().includes(searchName.toLowerCase()) ||
      app.application_id.toLowerCase().includes(searchName.toLowerCase());

    const matchesStatus =
      filterStatus === "" || filterStatus === "all" || app.status.toLowerCase() === filterStatus.toLowerCase();

    const matchesLoanType =
      searchLoanType === "" || app.loan_type.toLowerCase().includes(searchLoanType.toLowerCase());

    return matchesName && matchesStatus && matchesLoanType;
  });

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/litigation-access-dashboard",
    },
    {
      title: "View Applications",
      icon: FileText,
      path: "/litigation-access-applications",
    },
  ];

  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-dashboard">
        {/* Mobile Menu Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-72 bg-gradient-to-b from-blue-600 to-blue-700 border-r border-blue-700 overflow-y-auto">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-blue-500/30 bg-blue-700/50">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 mb-3 rounded-full bg-white/20 flex items-center justify-center">
                    <Scale className="h-7 w-7 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-1">{username}</h2>
                  <p className="text-xs text-white/80 uppercase tracking-wider">Litigation Dashboard</p>
                </div>
              </div>

              {/* Menu Items */}
              <div className="flex-1 px-4 py-6">
                <p className="text-white/70 uppercase tracking-wider text-xs font-semibold mb-3 px-2">Main Menu</p>
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.title}
                        onClick={() => {
                          navigate(item.path);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                          isActive
                            ? 'bg-white text-blue-700'
                            : 'text-white/90 hover:bg-white/10'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Logout Button */}
              <div className="p-4 border-t border-blue-500/30 bg-blue-700">
                <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <button className="w-full flex items-center justify-center gap-3 bg-red-600 text-white font-bold px-4 py-3 rounded-lg hover:bg-red-700 transition-colors">
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to logout? You will need to login again to access your account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                        Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {!isMobile && <LitigationAccessSidebar />}
        
        <main className="flex-1">
          {/* Header with Hamburger Menu */}
          <header className="bg-card border-b border-border px-4 md:px-8 py-4 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden shrink-0"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                )}
                <div className="min-w-0">
                  <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">View Applications</h1>
                  <p className="text-muted-foreground text-xs md:text-sm mt-1">Litigation cases visible to you</p>
                </div>
              </div>
              <Button
                onClick={handleExportToExcel}
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="border-green-600 text-green-600 hover:bg-green-50 shrink-0"
                disabled={applications.length === 0}
              >
                <Download className="h-4 w-4 md:mr-2" />
                <span className="hidden sm:inline">Export to Excel</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </div>
          </header>

          <div className="p-4 md:p-8">
            {/* Filter Section */}
            {!loading && applications.length > 0 && (
              <div className="mb-6 bg-card rounded-lg border p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Decreed">Decreed</SelectItem>
                      <SelectItem value="Dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by loan type..."
                      value={searchLoanType}
                      onChange={(e) => setSearchLoanType(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {(searchName || (filterStatus && filterStatus !== "all") || searchLoanType) && (
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredApplications.length} of {applications.length} cases
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchName("");
                        setFilterStatus("all");
                        setSearchLoanType("");
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            )}

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">No applications are currently visible to you.</p>
              <p className="text-sm text-muted-foreground mt-2">Contact your administrator to grant access to litigation cases.</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="bg-card rounded-lg border p-8 text-center">
              <p className="text-muted-foreground">No cases match your filter criteria.</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Borrower Name</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Loan Type</TableHead>
                    <TableHead>Loan Amount</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.application_id}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{app.borrower_name}</TableCell>
                      <TableCell>{app.bank_name || 'N/A'}</TableCell>
                      <TableCell>{app.loan_type}</TableCell>
                      <TableCell>₹{app.loan_amount?.toLocaleString('en-IN') || 'N/A'}</TableCell>
                      <TableCell>{new Date(app.submission_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleViewDetails(app)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleViewHistory(app)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <History className="h-4 w-4 mr-2" />
                            Case History
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          </div>

          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Litigation Case Details</DialogTitle>
                <DialogDescription>Complete information about the litigation case</DialogDescription>
              </DialogHeader>
              
              {selectedApplication && (
                <div className="space-y-6 mt-4">
                  {/* Case Information */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 flex items-center">
                      <RefreshCw className="h-5 w-5 mr-2 text-emerald-600" />
                      Case Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Case No</p>
                        <p className="font-medium">{selectedApplication.application_id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Category</p>
                        <Badge className="capitalize">{selectedApplication.application_type}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Case Type</p>
                        <p className="font-medium">{selectedApplication.loan_type}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Status</p>
                        <Badge className={getStatusColor(selectedApplication.status)}>
                          {selectedApplication.status}
                        </Badge>
                      </div>
                      {selectedApplication.court_name && (
                        <div>
                          <p className="text-sm text-slate-600">Court Name</p>
                          <p className="font-medium">{selectedApplication.court_name}</p>
                        </div>
                      )}
                      {selectedApplication.court_district && (
                        <div>
                          <p className="text-sm text-slate-600">Court District</p>
                          <p className="font-medium">{selectedApplication.court_district}</p>
                        </div>
                      )}
                      {selectedApplication.filing_date && (
                        <div>
                          <p className="text-sm text-slate-600">Filing Date</p>
                          <p className="font-medium">{format(new Date(selectedApplication.filing_date), 'dd MMM yyyy')}</p>
                        </div>
                      )}
                      {selectedApplication.next_hearing_date && (
                        <div>
                          <p className="text-sm text-slate-600">Next Hearing Date</p>
                          <p className="font-medium">{format(new Date(selectedApplication.next_hearing_date), 'dd MMM yyyy')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bank Details (for bank category) */}
                  {selectedApplication.application_type === 'bank' && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                        Bank Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Bank Name</p>
                          <p className="font-medium">{selectedApplication.bank_name || 'N/A'}</p>
                        </div>
                        {selectedApplication.branch_name && (
                          <div>
                            <p className="text-sm text-slate-600">Branch Name</p>
                            <p className="font-medium">{selectedApplication.branch_name}</p>
                          </div>
                        )}
                        {selectedApplication.account_no && (
                          <div>
                            <p className="text-sm text-slate-600">Account No</p>
                            <p className="font-medium">{selectedApplication.account_no}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-slate-600">Loan Amount</p>
                          <p className="font-medium text-emerald-600">
                            ₹{selectedApplication.loan_amount?.toLocaleString('en-IN') || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Borrower Name</p>
                          <p className="font-medium">{selectedApplication.borrower_name}</p>
                        </div>
                        {selectedApplication.co_borrower_name && (
                          <div>
                            <p className="text-sm text-slate-600">Co-Borrower Name</p>
                            <p className="font-medium">{selectedApplication.co_borrower_name}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Party Details (for private category) */}
                  {selectedApplication.application_type === 'private' && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <User className="h-5 w-5 mr-2 text-purple-600" />
                        Party Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedApplication.petitioner_name && (
                          <div>
                            <p className="text-sm text-slate-600">Petitioner Name</p>
                            <p className="font-medium">{selectedApplication.petitioner_name}</p>
                          </div>
                        )}
                        {selectedApplication.respondent_name && (
                          <div>
                            <p className="text-sm text-slate-600">Respondent Name</p>
                            <p className="font-medium">{selectedApplication.respondent_name}</p>
                          </div>
                        )}
                        {selectedApplication.petitioner_address && (
                          <div className="col-span-2">
                            <p className="text-sm text-slate-600">Petitioner Address</p>
                            <p className="font-medium">{selectedApplication.petitioner_address}</p>
                          </div>
                        )}
                        {selectedApplication.respondent_address && (
                          <div className="col-span-2">
                            <p className="text-sm text-slate-600">Respondent Address</p>
                            <p className="font-medium">{selectedApplication.respondent_address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Advocate Fees */}
                  {(selectedApplication.total_advocate_fees || selectedApplication.initial_fees || selectedApplication.final_fees) && (
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 flex items-center">
                        <IndianRupee className="h-5 w-5 mr-2 text-amber-600" />
                        Advocate Fees
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedApplication.total_advocate_fees && (
                          <div>
                            <p className="text-sm text-slate-600">Total Advocate Fees</p>
                            <p className="font-medium">₹{selectedApplication.total_advocate_fees.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                        {selectedApplication.initial_fees && (
                          <div>
                            <p className="text-sm text-slate-600">Initial Fees</p>
                            <p className="font-medium">₹{selectedApplication.initial_fees.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                        {selectedApplication.initial_fees_received_on && (
                          <div>
                            <p className="text-sm text-slate-600">Initial Fees Received On</p>
                            <p className="font-medium">{format(new Date(selectedApplication.initial_fees_received_on), 'dd MMM yyyy')}</p>
                          </div>
                        )}
                        {selectedApplication.final_fees && (
                          <div>
                            <p className="text-sm text-slate-600">Final Fees</p>
                            <p className="font-medium">₹{selectedApplication.final_fees.toLocaleString('en-IN')}</p>
                          </div>
                        )}
                        {selectedApplication.final_fees_received_on && (
                          <div>
                            <p className="text-sm text-slate-600">Final Fees Received On</p>
                            <p className="font-medium">{format(new Date(selectedApplication.final_fees_received_on), 'dd MMM yyyy')}</p>
                          </div>
                        )}
                        {selectedApplication.judgement_date && (
                          <div>
                            <p className="text-sm text-slate-600">Date of Judgement</p>
                            <p className="font-medium">{format(new Date(selectedApplication.judgement_date), 'dd MMM yyyy')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Present Status & Additional Details */}
                  {(selectedApplication.present_status || selectedApplication.details) && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">Additional Information</h3>
                      {selectedApplication.present_status && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-600 mb-1">Present Status</p>
                          <p className="font-medium">{selectedApplication.present_status}</p>
                        </div>
                      )}
                      {selectedApplication.details && (
                        <div>
                          <p className="text-sm text-slate-600 mb-1">Details</p>
                          <p className="font-medium">{selectedApplication.details}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Case History Dialog - View Only */}
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center">
                  <History className="h-6 w-6 mr-2 text-indigo-600" />
                  Case History - {selectedApplication?.application_id}
                </DialogTitle>
                <DialogDescription>
                  View case history entries and hearing records
                </DialogDescription>
              </DialogHeader>
              
              {selectedApplication && (
                <div className="space-y-6 mt-4">
                  {/* Case History Section */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-xl mb-6 flex items-center">
                      <Calendar className="h-6 w-6 mr-2 text-indigo-600" />
                      Case History
                    </h3>

                    {/* History Entries Table */}
                    {historyEntries.length > 0 ? (
                      <div className="bg-white rounded-lg border border-indigo-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-indigo-50">
                              <TableHead className="text-sm font-semibold">Registration No</TableHead>
                              <TableHead className="text-sm font-semibold">Judge</TableHead>
                              <TableHead className="text-sm font-semibold">Business On Date</TableHead>
                              <TableHead className="text-sm font-semibold">Hearing Date</TableHead>
                              <TableHead className="text-sm font-semibold">Purpose</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historyEntries.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell className="text-sm">
                                  {entry.registration_number || "-"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {entry.judge_name || "-"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {entry.business_on_date ? format(new Date(entry.business_on_date), 'dd MMM yyyy') : "-"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {entry.hearing_date ? format(new Date(entry.hearing_date), 'dd MMM yyyy') : "-"}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {entry.purpose_of_hearing || "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-indigo-200 p-8 text-center">
                        <p className="text-slate-500">No case history entries found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>;
};
export default LitigationAccessApplications;