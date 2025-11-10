import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BankEmployeeSidebar } from "@/components/BankEmployeeSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Calendar, User, Building, Eye, Edit, Trash, History } from "lucide-react";
import { DocumentViewer } from "@/components/DocumentViewer";
import { EditApplicationModal } from "@/components/EditApplicationModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ScrollSyncBar } from "@/components/ui/scroll-sync-bar";
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
  uploaded_files: any;
  opinion_files: any;
  assigned_to_username?: string;
  bank_application_no?: string;
}
const getStatusBadge = (status: string) => {
  const statusConfig = {
    "submitted": {
      variant: "secondary" as const,
      className: "bg-orange-100 text-orange-800"
    },
    "assigned": {
      variant: "outline" as const,
      className: "bg-blue-100 text-blue-800"
    },
    "completed": {
      variant: "default" as const,
      className: "bg-green-100 text-green-800"
    },
    "draft": {
      variant: "outline" as const,
      className: "bg-gray-100 text-gray-800"
    },
    "waiting_for_approval": {
      variant: "secondary" as const,
      className: "bg-yellow-100 text-yellow-800"
    },
    "in_review": {
      variant: "outline" as const,
      className: "bg-blue-100 text-blue-800"
    },
    "to_be_assigned": {
      variant: "outline" as const,
      className: "bg-purple-100 text-purple-800"
    }
  };
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig["submitted"];
  return <Badge variant={config.variant} className={config.className}>
      {status === "submitted" ? "Submitted" : status === "assigned" ? "Under review" : status === "completed" ? "Submitted" : status === "waiting_for_approval" ? "Waiting for approval" : status === "in_review" ? "In review" : status === "to_be_assigned" ? "To be assigned" : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>;
};
export default function MySubmissions() {
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCaseHistoryOpen, setIsCaseHistoryOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<Application | null>(null);
  const {
    toast
  } = useToast();
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    fetchSubmissions();
  }, []);
  const fetchSubmissions = async () => {
    try {
      setLoading(true);

      // Get the current bank user from localStorage
      const currentBank = localStorage.getItem("bankUsername");
      if (!currentBank) {
        toast({
          title: "Error",
          description: "Bank authentication required",
          variant: "destructive"
        });
        return;
      }
      const {
        data,
        error
      } = await supabase.from('applications').select('*').eq('submitted_by', currentBank).in('status', ['waiting_for_approval', 'in_review', 'assigned', 'to_be_assigned']).order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching submissions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch submissions",
          variant: "destructive"
        });
        return;
      }
      setApplications(data || []);
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
  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setIsViewerOpen(true);
  };
  const handleEditApplication = (application: Application) => {
    setSelectedApplication(application);
    setIsEditModalOpen(true);
  };
  const handleViewCaseHistory = (application: Application) => {
    setSelectedApplication(application);
    setIsCaseHistoryOpen(true);
  };
  const handleDeleteClick = (application: Application) => {
    setApplicationToDelete(application);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!applicationToDelete) return;
    try {
      // Try delete without count first to see actual error
      const {
        error
      } = await supabase.from('applications').delete().eq('id', applicationToDelete.id);
      console.log('Delete result:', {
        error,
        deletedId: applicationToDelete.id
      });
      if (error) {
        console.error('Error deleting application:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to delete application",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "Success",
        description: "Application deleted successfully"
      });

      // Update local state immediately
      setApplications(prev => prev.filter(app => app.id !== applicationToDelete.id));

      // Refresh from database
      fetchSubmissions();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setApplicationToDelete(null);
    }
  };
  return <SidebarProvider>
      <div className="flex h-screen w-full">
        <BankEmployeeSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
                <p className="text-gray-600">Track your submitted loan applications</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6 pb-16 bg-gray-50">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{applications.length}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Review</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {applications.filter(app => app.status === "submitted").length}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Submitted</CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {applications.filter(app => app.status === "completed").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submissions Table */}
            <div className="-mx-6">
              <div ref={scrollContainerRef} className="overflow-x-auto px-6 hide-scrollbar">
                <Card className="min-w-[1200px] overflow-hidden">
                  <CardHeader>
                    <CardTitle>Submitted Applications</CardTitle>
                    <CardDescription>
                      View all your submitted loan applications and their current status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="px-6 py-4">
                      <Table className="min-w-[1200px]" wrapperClassName="relative w-full overflow-visible hide-scrollbar">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Advocate-application id</TableHead>
                            <TableHead>Bank application no</TableHead>
                            <TableHead>Applicant</TableHead>
                            <TableHead>Owner of the property</TableHead>
                            <TableHead>Loan Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Submitted Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8">
                                Loading submissions...
                              </TableCell>
                            </TableRow>
                          ) : applications.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                No submissions found
                              </TableCell>
                            </TableRow>
                          ) : (
                            applications.map((application) => (
                              <TableRow key={application.id}>
                                <TableCell className="font-medium">{application.application_id}</TableCell>
                                <TableCell>{application.bank_application_no || '-'}</TableCell>
                                <TableCell>{application.borrower_name}</TableCell>
                                <TableCell>{application.borrower_name}</TableCell>
                                <TableCell>{application.loan_type}</TableCell>
                                <TableCell className="font-semibold">₹{application.loan_amount.toLocaleString()}</TableCell>
                                <TableCell>{new Date(application.submission_date).toLocaleDateString()}</TableCell>
                                <TableCell>{getStatusBadge(application.status)}</TableCell>
                                <TableCell className="pr-6">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleViewDetails(application)}>
                                      <Eye className="h-4 w-4" />
                                      View
                                    </Button>
                                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleEditApplication(application)}>
                                      <Edit className="h-4 w-4" />
                                      Edit
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDeleteClick(application)}>
                                      <Trash className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>

      <DocumentViewer isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} application={selectedApplication} onApplicationUpdate={fetchSubmissions} />

      <EditApplicationModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} application={selectedApplication} onApplicationUpdate={fetchSubmissions} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the application "{applicationToDelete?.application_id}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Case History Dialog */}
      <AlertDialog open={isCaseHistoryOpen} onOpenChange={setIsCaseHistoryOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Case History - {selectedApplication?.application_id}
            </AlertDialogTitle>
            <AlertDialogDescription>
              View the complete history and timeline of this application
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedApplication && <>
                <div className="border-l-2 border-primary pl-4 space-y-4">
                  <div>
                    <div className="text-sm font-semibold">Application Created</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedApplication.submission_date).toLocaleString()}
                    </div>
                    <div className="text-sm mt-1">
                      Initial submission by {selectedApplication.submitted_by || 'Bank Employee'}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-semibold">Current Status</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {getStatusBadge(selectedApplication.status)}
                    </div>
                    {selectedApplication.assigned_to_username && <div className="text-sm mt-1">
                        Assigned to: {selectedApplication.assigned_to_username}
                      </div>}
                  </div>

                  <div>
                    <div className="text-sm font-semibold">Application Details</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <div>Borrower: {selectedApplication.borrower_name}</div>
                      <div>Bank: {selectedApplication.bank_name}</div>
                      <div>Loan Type: {selectedApplication.loan_type}</div>
                      <div>Amount: ₹{selectedApplication.loan_amount.toLocaleString()}</div>
                      {selectedApplication.bank_application_no && <div>Bank Application No: {selectedApplication.bank_application_no}</div>}
                    </div>
                  </div>
                </div>
              </>}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ScrollSyncBar targetRef={scrollContainerRef} />
    </SidebarProvider>;
}