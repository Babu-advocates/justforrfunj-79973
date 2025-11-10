import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LitigationSidebar } from "@/components/LitigationSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Scale, Search, Filter, Eye, User, Building2, Calendar, RefreshCw, IndianRupee, History, Plus, Edit2, Trash2, Save, X, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// History Entry Row Component
function HistoryEntryRow({ entry, isEditing, isSaving, onEdit, onSave, onDelete, onCancel }: any) {
  const [editedEntry, setEditedEntry] = useState(entry);

  if (isEditing) {
    return (
      <TableRow className="bg-amber-50">
        <TableCell>
          <Input
            value={editedEntry.registration_number}
            onChange={(e) => setEditedEntry({...editedEntry, registration_number: e.target.value})}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Input
            value={editedEntry.judge_name}
            onChange={(e) => setEditedEntry({...editedEntry, judge_name: e.target.value})}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-full justify-start text-left font-normal",
                  !editedEntry.business_on_date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {editedEntry.business_on_date ? format(new Date(editedEntry.business_on_date), "dd-MM-yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={editedEntry.business_on_date ? new Date(editedEntry.business_on_date) : undefined}
                onSelect={(date) => setEditedEntry({...editedEntry, business_on_date: date ? format(date, "yyyy-MM-dd") : ""})}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </TableCell>
        <TableCell>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 w-full justify-start text-left font-normal",
                  !editedEntry.hearing_date && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {editedEntry.hearing_date ? format(new Date(editedEntry.hearing_date), "dd-MM-yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={editedEntry.hearing_date ? new Date(editedEntry.hearing_date) : undefined}
                onSelect={(date) => setEditedEntry({...editedEntry, hearing_date: date ? format(date, "yyyy-MM-dd") : ""})}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </TableCell>
        <TableCell>
          <Input
            value={editedEntry.purpose_of_hearing}
            onChange={(e) => setEditedEntry({...editedEntry, purpose_of_hearing: e.target.value})}
            className="h-8"
          />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSave(editedEntry)}
              disabled={isSaving}
              className="disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
              ) : (
                <Save className="h-4 w-4 text-green-600" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={isSaving}
              className="disabled:opacity-50"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{entry.registration_number}</TableCell>
      <TableCell>{entry.judge_name}</TableCell>
      <TableCell>{entry.business_on_date ? format(new Date(entry.business_on_date), 'dd-MM-yyyy') : '-'}</TableCell>
      <TableCell>{entry.hearing_date ? format(new Date(entry.hearing_date), 'dd-MM-yyyy') : '-'}</TableCell>
      <TableCell>{entry.purpose_of_hearing}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            disabled={isSaving}
            className="disabled:opacity-50"
          >
            <Edit2 className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isSaving}
            className="disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function MyLitigationSubmissions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [myCases, setMyCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCaseHistoryOpen, setIsCaseHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [newHistoryEntry, setNewHistoryEntry] = useState({
    registration_number: "",
    judge: "",
    business_on_date: "",
    hearing_date: "",
    purpose_of_hearing: ""
  });
  const [editRequests, setEditRequests] = useState<Record<string, any>>({});
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isEditApprovalDialogOpen, setIsEditApprovalDialogOpen] = useState(false);
  const [caseToEdit, setCaseToEdit] = useState<any>(null);

  const currentUsername = localStorage.getItem('litigationUsername') || '';

  useEffect(() => {
    fetchMyCases();
    fetchEditRequests();

    // Set up real-time subscription
    const channel = supabase
      .channel('my-litigation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'litigation_cases',
          filter: `created_by=eq.${currentUsername}`
        },
        () => {
          fetchMyCases();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'litigation_edit_requests',
          filter: `requested_by=eq.${currentUsername}`
        },
        () => {
          fetchEditRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUsername]);

  const fetchMyCases = async () => {
    if (!currentUsername) {
      showToast.error('User not logged in');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('litigation_cases')
        .select('*')
        .eq('created_by', currentUsername)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching my cases:', error);
        showToast.error('Failed to load your cases');
      } else {
        setMyCases(data || []);
      }
    } catch (error) {
      console.error('Error fetching my cases:', error);
      showToast.error('Failed to load your cases');
    } finally {
      setLoading(false);
    }
  };

  const fetchEditRequests = async () => {
    if (!currentUsername) return;

    try {
      const { data, error } = await supabase
        .from('litigation_edit_requests')
        .select('*')
        .eq('requested_by', currentUsername)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching edit requests:', error);
      } else {
        const requestMap: Record<string, any> = {};
        data?.forEach(req => {
          requestMap[req.litigation_case_id] = req;
        });
        setEditRequests(requestMap);
      }
    } catch (error) {
      console.error('Error fetching edit requests:', error);
    }
  };

  const handleRequestEditAccess = async (caseItem: any) => {
    setRequestingAccess(true);
    try {
      // Find the latest request for this case by this user
      const { data: existing, error: selectError } = await supabase
        .from('litigation_edit_requests')
        .select('id, status')
        .eq('litigation_case_id', caseItem.id)
        .eq('requested_by', currentUsername)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing edit request:', selectError);
      }

      if (existing) {
        if (existing.status === 'pending') {
          showToast.error('You already have a pending request for this case');
        } else {
          const { error: updateReqError } = await supabase
            .from('litigation_edit_requests')
            .update({
              status: 'pending',
              requested_at: new Date().toISOString(),
              reviewed_at: null,
              reviewed_by: null,
            })
            .eq('id', existing.id);

          if (updateReqError) {
            console.error('Error updating existing edit request:', updateReqError);
            showToast.error('Failed to request edit access');
          } else {
            showToast.success('Edit access request sent to admin');
            fetchEditRequests();
          }
        }
      } else {
        const { error: insertError } = await supabase
          .from('litigation_edit_requests')
          .insert({
            litigation_case_id: caseItem.id,
            requested_by: currentUsername,
            case_no: caseItem.case_no,
            status: 'pending'
          });

        if (insertError) {
          console.error('Error requesting edit access:', insertError);
          showToast.error('Failed to request edit access');
        } else {
          showToast.success('Edit access request sent to admin');
          fetchEditRequests();
        }
      }
    } catch (error) {
      console.error('Error requesting edit access:', error);
      showToast.error('Failed to request edit access');
    } finally {
      setRequestingAccess(false);
    }
  };

  const hasEditAccess = (caseId: string) => {
    const request = editRequests[caseId];
    return request?.status === 'approved';
  };

  const getEditRequestStatus = (caseId: string) => {
    return editRequests[caseId];
  };

  const filteredCases = myCases.filter((caseItem) => {
    const name = caseItem.category === 'bank' 
      ? caseItem.borrower_name 
      : caseItem.petitioner_name;
    
    const matchesSearch =
      caseItem.case_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.court_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || caseItem.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      Pending: "bg-blue-100 text-blue-800 border-blue-200",
      Decreed: "bg-green-100 text-green-800 border-green-200",
      Dismissed: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      <Badge className={`${statusColors[status] || "bg-muted text-muted-foreground"} capitalize`}>
        {status}
      </Badge>
    );
  };

  const handleStatusChange = async (caseId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('litigation_cases')
        .update({ status: newStatus })
        .eq('id', caseId);

      if (error) {
        console.error('Error updating status:', error);
        showToast.error('Failed to update status');
      } else {
        showToast.success('Status updated successfully');
        // Update local state
        setMyCases(myCases.map(c => 
          c.id === caseId ? { ...c, status: newStatus } : c
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error('Failed to update status');
    }
  };

  const handleViewDetails = (caseItem: any) => {
    setSelectedCase(caseItem);
    setIsDetailsOpen(true);
  };

  const handleViewCaseHistory = async (caseItem: any) => {
    setSelectedCase(caseItem);
    setIsCaseHistoryOpen(true);
    
    // Initialize new history entry with filing date as business on date
    setNewHistoryEntry({
      registration_number: "",
      judge: "",
      business_on_date: caseItem.filing_date || "",
      hearing_date: "",
      purpose_of_hearing: ""
    });
    
    // Fetch history entries from database
    try {
      const { data, error } = await supabase
        .from('litigation_case_history')
        .select('*')
        .eq('litigation_case_id', caseItem.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching case history:', error);
        showToast.error('Failed to load case history');
        setHistoryEntries([]);
      } else {
        setHistoryEntries(data || []);
      }
    } catch (error) {
      console.error('Error fetching case history:', error);
      showToast.error('Failed to load case history');
      setHistoryEntries([]);
    }
  };

  const handleAddHistoryEntry = async () => {
    if (!newHistoryEntry.registration_number || !newHistoryEntry.judge || 
        !newHistoryEntry.business_on_date || !newHistoryEntry.hearing_date || 
        !newHistoryEntry.purpose_of_hearing) {
      showToast.error("Please fill in all required fields");
      return;
    }
    
    if (!selectedCase?.id) {
      showToast.error("No case selected");
      return;
    }

    setIsAddingHistory(true);
    try {
      const { data, error } = await supabase
        .from('litigation_case_history')
        .insert([{
          litigation_case_id: selectedCase.id,
          registration_number: newHistoryEntry.registration_number,
          judge_name: newHistoryEntry.judge,
          business_on_date: newHistoryEntry.business_on_date,
          hearing_date: newHistoryEntry.hearing_date,
          purpose_of_hearing: newHistoryEntry.purpose_of_hearing
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding history entry:', error);
        showToast.error('Failed to add history entry');
      } else {
        setHistoryEntries([data, ...historyEntries]);
        // Reset form with previous hearing date as business_on_date
        setNewHistoryEntry({
          registration_number: "",
          judge: "",
          business_on_date: newHistoryEntry.hearing_date || "",
          hearing_date: "",
          purpose_of_hearing: ""
        });
        showToast.success("History entry added successfully");
      }
    } catch (error) {
      console.error('Error adding history entry:', error);
      showToast.error('Failed to add history entry');
    } finally {
      setIsAddingHistory(false);
    }
  };

  const handleEditHistoryEntry = (id: string) => {
    setEditingHistoryId(id);
  };

  const handleSaveHistoryEntry = async (id: string, updatedEntry: any) => {
    setIsSavingHistory(true);
    try {
      const { error } = await supabase
        .from('litigation_case_history')
        .update({
          registration_number: updatedEntry.registration_number,
          judge_name: updatedEntry.judge_name,
          business_on_date: updatedEntry.business_on_date,
          hearing_date: updatedEntry.hearing_date,
          purpose_of_hearing: updatedEntry.purpose_of_hearing
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating history entry:', error);
        showToast.error('Failed to update history entry');
      } else {
        setHistoryEntries(historyEntries.map(entry => 
          entry.id === id ? { ...entry, ...updatedEntry } : entry
        ));
        setEditingHistoryId(null);
        showToast.success("History entry updated successfully");
      }
    } catch (error) {
      console.error('Error updating history entry:', error);
      showToast.error('Failed to update history entry');
    } finally {
      setIsSavingHistory(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setHistoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!historyToDelete) return;

    setIsDeletingHistory(true);
    try {
      const { error } = await supabase
        .from('litigation_case_history')
        .delete()
        .eq('id', historyToDelete);

      if (error) {
        console.error('Error deleting history entry:', error);
        showToast.error('Failed to delete history entry');
      } else {
        setHistoryEntries(historyEntries.filter(entry => entry.id !== historyToDelete));
        showToast.success("History entry deleted successfully");
        setDeleteDialogOpen(false);
        setHistoryToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting history entry:', error);
      showToast.error('Failed to delete history entry');
    } finally {
      setIsDeletingHistory(false);
    }
  };

  const handleEditCase = (caseItem: any) => {
    // Check if user has approved edit access
    if (!hasEditAccess(caseItem.id)) {
      const editRequest = getEditRequestStatus(caseItem.id);
      
      if (editRequest?.status === 'pending') {
        showToast.error('Your edit request is pending approval');
      } else if (editRequest?.status === 'declined') {
        showToast.error('Your edit request was declined. Please request again.');
      } else {
        showToast.error('You need approval to edit this case. Please request edit access.');
      }
      return;
    }

    setCaseToEdit(caseItem);
    setIsEditApprovalDialogOpen(true);
  };

  const handleConfirmEdit = () => {
    if (caseToEdit) {
      setEditingCase({ ...caseToEdit });
      setIsEditDialogOpen(true);
      setIsEditApprovalDialogOpen(false);
      setCaseToEdit(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCase) return;

    setIsSavingEdit(true);
    try {
      // Update the case
      const { error: updateError } = await supabase
        .from('litigation_cases')
        .update({
          case_no: editingCase.case_no,
          case_type: editingCase.case_type,
          court_name: editingCase.court_name,
          court_district: editingCase.court_district,
          filing_date: editingCase.filing_date,
          next_hearing_date: editingCase.next_hearing_date,
          bank_name: editingCase.bank_name,
          branch_name: editingCase.branch_name,
          account_no: editingCase.account_no,
          loan_amount: editingCase.loan_amount,
          borrower_name: editingCase.borrower_name,
          co_borrower_name: editingCase.co_borrower_name,
          petitioner_name: editingCase.petitioner_name,
          respondent_name: editingCase.respondent_name,
          petitioner_address: editingCase.petitioner_address,
          respondent_address: editingCase.respondent_address,
          total_advocate_fees: editingCase.total_advocate_fees,
          initial_fees: editingCase.initial_fees,
          initial_fees_received_on: editingCase.initial_fees_received_on,
          final_fees: editingCase.final_fees,
          final_fees_received_on: editingCase.final_fees_received_on,
          judgement_date: editingCase.judgement_date,
          present_status: editingCase.present_status,
          details: editingCase.details,
        })
        .eq('id', editingCase.id);

      if (updateError) {
        console.error('Error updating case:', updateError);
        showToast.error('Failed to update case');
        return;
      }

      // Revoke edit access by marking the latest approved request as revoked
      const { data: latestApproved, error: selectApprovedErr } = await supabase
        .from('litigation_edit_requests')
        .select('id')
        .eq('litigation_case_id', editingCase.id)
        .eq('requested_by', currentUsername)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (selectApprovedErr) {
        console.error('Error finding approved edit request to revoke:', selectApprovedErr);
      }

      if (latestApproved?.id) {
        const { error: revokeError } = await supabase
          .from('litigation_edit_requests')
          .update({ status: 'revoked', reviewed_at: new Date().toISOString() })
          .eq('id', latestApproved.id);

        if (revokeError) {
          console.error('Error revoking edit access:', revokeError);
          // Don't show error to user as the case was updated successfully
        }
      }

      // Immediately update local state to reflect revoked status
      setEditRequests(prev => ({
        ...prev,
        [editingCase.id]: { ...(prev[editingCase.id] || {}), status: 'revoked' }
      }));

      showToast.success('Case updated successfully. Request access again for next edit.');
      setIsEditDialogOpen(false);
      setEditingCase(null);
      
      // Also refetch to ensure consistency
      fetchEditRequests();
      fetchMyCases();
    } catch (error) {
      console.error('Error updating case:', error);
      showToast.error('Failed to update case');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 to-emerald-100 font-kontora">
        <LitigationSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-6 gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-foreground">My Submissions</h1>
              <p className="text-sm text-muted-foreground">View cases you've created</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            <Card className="border-0 shadow-card bg-gradient-to-br from-card to-card/80">
              <CardHeader className="border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Scale className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">My Cases</CardTitle>
                    <CardDescription>
                      {filteredCases.length} case{filteredCases.length !== 1 ? "s" : ""} created by you
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by case no, name, or court..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Decreed">Decreed</SelectItem>
                      <SelectItem value="Dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-600">Loading your cases...</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case No</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Bank</TableHead>
                          <TableHead>Court</TableHead>
                          <TableHead>Case Type</TableHead>
                          <TableHead>Filing Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCases.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No cases found. Try adjusting your filters or create a new case.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCases.map((caseItem) => {
                            const name = caseItem.category === 'bank' 
                              ? caseItem.borrower_name 
                              : caseItem.petitioner_name;
                            
                            return (
                              <TableRow key={caseItem.id}>
                                <TableCell className="font-medium">{caseItem.case_no}</TableCell>
                                <TableCell>
                                  <Select 
                                    value={caseItem.status} 
                                    onValueChange={(value) => handleStatusChange(caseItem.id, value)}
                                  >
                                    <SelectTrigger className="w-[140px]">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Pending">Pending</SelectItem>
                                      <SelectItem value="Decreed">Decreed</SelectItem>
                                      <SelectItem value="Dismissed">Dismissed</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>{name}</TableCell>
                                <TableCell>{caseItem.bank_name || '-'}</TableCell>
                                <TableCell>{caseItem.court_name}</TableCell>
                                <TableCell>{caseItem.case_type}</TableCell>
                                <TableCell>{format(new Date(caseItem.filing_date), 'dd MMM yyyy')}</TableCell>
                                 <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewDetails(caseItem)}
                                      title="View details"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditCase(caseItem)}
                                      disabled={!hasEditAccess(caseItem.id)}
                                      title={!hasEditAccess(caseItem.id) ? "Request edit access first" : "Edit case"}
                                      className={hasEditAccess(caseItem.id) ? "text-blue-600" : ""}
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewCaseHistory(caseItem)}
                                      title="View and edit case history"
                                    >
                                      <History className="h-4 w-4" />
                                    </Button>
                                    {!hasEditAccess(caseItem.id) && (!getEditRequestStatus(caseItem.id) || ['revoked','expired','consumed'].includes(getEditRequestStatus(caseItem.id)?.status)) && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleRequestEditAccess(caseItem)}
                                        disabled={requestingAccess}
                                        className="text-yellow-600 hover:text-yellow-700"
                                        title="Request edit access"
                                      >
                                        <Lock className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {getEditRequestStatus(caseItem.id)?.status === 'pending' && (
                                      <Badge variant="outline" className="text-xs">Pending</Badge>
                                    )}
                                    {getEditRequestStatus(caseItem.id)?.status === 'declined' && (
                                      <Badge variant="destructive" className="text-xs">Declined</Badge>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Case Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Litigation Case Details</DialogTitle>
            <DialogDescription>Complete information about the litigation case</DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
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
                    <p className="font-medium">{selectedCase.case_no}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Category</p>
                    <Badge className="capitalize">{selectedCase.category}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Case Type</p>
                    <p className="font-medium">{selectedCase.case_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Status</p>
                    {getStatusBadge(selectedCase.status)}
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Court Name</p>
                    <p className="font-medium">{selectedCase.court_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Court District</p>
                    <p className="font-medium">{selectedCase.court_district}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Filing Date</p>
                    <p className="font-medium">{format(new Date(selectedCase.filing_date), 'dd MMM yyyy')}</p>
                  </div>
                  {selectedCase.next_hearing_date && (
                    <div>
                      <p className="text-sm text-slate-600">Next Hearing Date</p>
                      <p className="font-medium">{format(new Date(selectedCase.next_hearing_date), 'dd MMM yyyy')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Details (for bank category) */}
              {selectedCase.category === 'bank' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-blue-600" />
                    Bank Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Bank Name</p>
                      <p className="font-medium">{selectedCase.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Branch Name</p>
                      <p className="font-medium">{selectedCase.branch_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Account No</p>
                      <p className="font-medium">{selectedCase.account_no}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Loan Amount</p>
                      <p className="font-medium text-emerald-600">₹{selectedCase.loan_amount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Borrower Name</p>
                      <p className="font-medium">{selectedCase.borrower_name}</p>
                    </div>
                    {selectedCase.co_borrower_name && (
                      <div>
                        <p className="text-sm text-slate-600">Co-Borrower Name</p>
                        <p className="font-medium">{selectedCase.co_borrower_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Party Details (for private category) */}
              {selectedCase.category === 'private' && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3 flex items-center">
                    <User className="h-5 w-5 mr-2 text-purple-600" />
                    Party Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">Petitioner Name</p>
                      <p className="font-medium">{selectedCase.petitioner_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Respondent Name</p>
                      <p className="font-medium">{selectedCase.respondent_name}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">Petitioner Address</p>
                      <p className="font-medium">{selectedCase.petitioner_address}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600">Respondent Address</p>
                      <p className="font-medium">{selectedCase.respondent_address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Advocate Fees */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-3 flex items-center">
                  <IndianRupee className="h-5 w-5 mr-2 text-amber-600" />
                  Advocate Fees
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedCase.total_advocate_fees && (
                    <div>
                      <p className="text-sm text-slate-600">Total Advocate Fees</p>
                      <p className="font-medium">₹{selectedCase.total_advocate_fees.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedCase.initial_fees && (
                    <div>
                      <p className="text-sm text-slate-600">Initial Fees</p>
                      <p className="font-medium">₹{selectedCase.initial_fees.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedCase.initial_fees_received_on && (
                    <div>
                      <p className="text-sm text-slate-600">Initial Fees Received On</p>
                      <p className="font-medium">{format(new Date(selectedCase.initial_fees_received_on), 'dd MMM yyyy')}</p>
                    </div>
                  )}
                  {selectedCase.final_fees && (
                    <div>
                      <p className="text-sm text-slate-600">Final Fees</p>
                      <p className="font-medium">₹{selectedCase.final_fees.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedCase.final_fees_received_on && (
                    <div>
                      <p className="text-sm text-slate-600">Final Fees Received On</p>
                      <p className="font-medium">{format(new Date(selectedCase.final_fees_received_on), 'dd MMM yyyy')}</p>
                    </div>
                  )}
                  {selectedCase.judgement_date && (
                    <div>
                      <p className="text-sm text-slate-600">Date of Judgement</p>
                      <p className="font-medium">{format(new Date(selectedCase.judgement_date), 'dd MMM yyyy')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Present Status & Additional Details */}
              {(selectedCase.present_status || selectedCase.details) && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-3">Additional Information</h3>
                  {selectedCase.present_status && (
                    <div className="mb-3">
                      <p className="text-sm text-slate-600 mb-1">Present Status</p>
                      <p className="font-medium">{selectedCase.present_status}</p>
                    </div>
                  )}
                  {selectedCase.details && (
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Details</p>
                      <p className="font-medium">{selectedCase.details}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Case History Dialog */}
      <Dialog open={isCaseHistoryOpen} onOpenChange={setIsCaseHistoryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <History className="h-6 w-6" />
              Case History - {selectedCase?.case_no}
            </DialogTitle>
            <DialogDescription>
              Add, edit, and manage the complete history and timeline of this litigation case
            </DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-4">
              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader className="bg-blue-900">
                    <TableRow>
                      <TableHead className="text-white font-semibold">Registration Number</TableHead>
                      <TableHead className="text-white font-semibold">Judge</TableHead>
                      <TableHead className="text-white font-semibold">Business On Date</TableHead>
                      <TableHead className="text-white font-semibold">Hearing Date</TableHead>
                      <TableHead className="text-white font-semibold">Purpose of Hearing</TableHead>
                      <TableHead className="text-white font-semibold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No history entries yet. Add your first entry below.
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyEntries.map((entry) => (
                        <HistoryEntryRow
                          key={entry.id}
                          entry={entry}
                          isEditing={editingHistoryId === entry.id}
                          isSaving={isSavingHistory}
                          onEdit={() => handleEditHistoryEntry(entry.id)}
                          onSave={(updatedEntry) => handleSaveHistoryEntry(entry.id, updatedEntry)}
                          onDelete={() => handleDeleteClick(entry.id)}
                          onCancel={() => setEditingHistoryId(null)}
                        />
                      ))
                    )}
                    
                    {/* Add New Row */}
                    <TableRow className="bg-sky-50">
                      <TableCell>
                        <Input
                          placeholder="Registration No."
                          value={newHistoryEntry.registration_number}
                          onChange={(e) => setNewHistoryEntry({...newHistoryEntry, registration_number: e.target.value})}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Judge Name"
                          value={newHistoryEntry.judge}
                          onChange={(e) => setNewHistoryEntry({...newHistoryEntry, judge: e.target.value})}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-8 w-full justify-start text-left font-normal",
                                !newHistoryEntry.business_on_date && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {newHistoryEntry.business_on_date ? format(new Date(newHistoryEntry.business_on_date), "dd-MM-yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={newHistoryEntry.business_on_date ? new Date(newHistoryEntry.business_on_date) : undefined}
                              onSelect={(date) => setNewHistoryEntry({...newHistoryEntry, business_on_date: date ? format(date, "yyyy-MM-dd") : ""})}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-8 w-full justify-start text-left font-normal",
                                !newHistoryEntry.hearing_date && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {newHistoryEntry.hearing_date ? format(new Date(newHistoryEntry.hearing_date), "dd-MM-yyyy") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={newHistoryEntry.hearing_date ? new Date(newHistoryEntry.hearing_date) : undefined}
                              onSelect={(date) => setNewHistoryEntry({...newHistoryEntry, hearing_date: date ? format(date, "yyyy-MM-dd") : ""})}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="Purpose"
                          value={newHistoryEntry.purpose_of_hearing}
                          onChange={(e) => setNewHistoryEntry({...newHistoryEntry, purpose_of_hearing: e.target.value})}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={handleAddHistoryEntry}
                          disabled={isAddingHistory}
                          className="gap-2 disabled:opacity-50"
                        >
                          {isAddingHistory ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Add
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Case Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Edit2 className="h-6 w-6" />
              Edit Litigation Case
            </DialogTitle>
            <DialogDescription>Update case information - changes will be saved in real-time</DialogDescription>
          </DialogHeader>
          
          {editingCase && (
            <div className="space-y-6 mt-4">
              {/* Basic Case Information */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg mb-3">Case Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Case No</label>
                    <Input
                      value={editingCase.case_no}
                      onChange={(e) => setEditingCase({...editingCase, case_no: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Case Type</label>
                    <Input
                      value={editingCase.case_type}
                      onChange={(e) => setEditingCase({...editingCase, case_type: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Court Name</label>
                    <Input
                      value={editingCase.court_name}
                      onChange={(e) => setEditingCase({...editingCase, court_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Court District</label>
                    <Input
                      value={editingCase.court_district}
                      onChange={(e) => setEditingCase({...editingCase, court_district: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Filing Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Calendar className="mr-2 h-4 w-4" />
                          {editingCase.filing_date ? format(new Date(editingCase.filing_date), "dd-MM-yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editingCase.filing_date ? new Date(editingCase.filing_date) : undefined}
                          onSelect={(date) => setEditingCase({...editingCase, filing_date: date ? format(date, "yyyy-MM-dd") : ""})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Next Hearing Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Calendar className="mr-2 h-4 w-4" />
                          {editingCase.next_hearing_date ? format(new Date(editingCase.next_hearing_date), "dd-MM-yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editingCase.next_hearing_date ? new Date(editingCase.next_hearing_date) : undefined}
                          onSelect={(date) => setEditingCase({...editingCase, next_hearing_date: date ? format(date, "yyyy-MM-dd") : ""})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              {editingCase.category === 'bank' && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-3">Bank Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Bank Name</label>
                      <Input
                        value={editingCase.bank_name || ""}
                        onChange={(e) => setEditingCase({...editingCase, bank_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Branch Name</label>
                      <Input
                        value={editingCase.branch_name || ""}
                        onChange={(e) => setEditingCase({...editingCase, branch_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Account No</label>
                      <Input
                        value={editingCase.account_no || ""}
                        onChange={(e) => setEditingCase({...editingCase, account_no: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Loan Amount</label>
                      <Input
                        type="number"
                        value={editingCase.loan_amount || ""}
                        onChange={(e) => setEditingCase({...editingCase, loan_amount: parseFloat(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Borrower Name</label>
                      <Input
                        value={editingCase.borrower_name || ""}
                        onChange={(e) => setEditingCase({...editingCase, borrower_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Co-Borrower Name</label>
                      <Input
                        value={editingCase.co_borrower_name || ""}
                        onChange={(e) => setEditingCase({...editingCase, co_borrower_name: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Party Details */}
              {editingCase.category === 'private' && (
                <div className="bg-purple-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-lg mb-3">Party Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Petitioner Name</label>
                      <Input
                        value={editingCase.petitioner_name || ""}
                        onChange={(e) => setEditingCase({...editingCase, petitioner_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 mb-1 block">Respondent Name</label>
                      <Input
                        value={editingCase.respondent_name || ""}
                        onChange={(e) => setEditingCase({...editingCase, respondent_name: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-slate-600 mb-1 block">Petitioner Address</label>
                      <Input
                        value={editingCase.petitioner_address || ""}
                        onChange={(e) => setEditingCase({...editingCase, petitioner_address: e.target.value})}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm text-slate-600 mb-1 block">Respondent Address</label>
                      <Input
                        value={editingCase.respondent_address || ""}
                        onChange={(e) => setEditingCase({...editingCase, respondent_address: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Advocate Fees */}
              <div className="bg-amber-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg mb-3">Advocate Fees</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Total Advocate Fees</label>
                    <Input
                      type="number"
                      value={editingCase.total_advocate_fees || ""}
                      onChange={(e) => setEditingCase({...editingCase, total_advocate_fees: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Initial Fees</label>
                    <Input
                      type="number"
                      value={editingCase.initial_fees || ""}
                      onChange={(e) => setEditingCase({...editingCase, initial_fees: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Initial Fees Received On</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Calendar className="mr-2 h-4 w-4" />
                          {editingCase.initial_fees_received_on ? format(new Date(editingCase.initial_fees_received_on), "dd-MM-yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editingCase.initial_fees_received_on ? new Date(editingCase.initial_fees_received_on) : undefined}
                          onSelect={(date) => setEditingCase({...editingCase, initial_fees_received_on: date ? format(date, "yyyy-MM-dd") : null})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Final Fees</label>
                    <Input
                      type="number"
                      value={editingCase.final_fees || ""}
                      onChange={(e) => setEditingCase({...editingCase, final_fees: parseFloat(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Final Fees Received On</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Calendar className="mr-2 h-4 w-4" />
                          {editingCase.final_fees_received_on ? format(new Date(editingCase.final_fees_received_on), "dd-MM-yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editingCase.final_fees_received_on ? new Date(editingCase.final_fees_received_on) : undefined}
                          onSelect={(date) => setEditingCase({...editingCase, final_fees_received_on: date ? format(date, "yyyy-MM-dd") : null})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Judgement Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left">
                          <Calendar className="mr-2 h-4 w-4" />
                          {editingCase.judgement_date ? format(new Date(editingCase.judgement_date), "dd-MM-yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editingCase.judgement_date ? new Date(editingCase.judgement_date) : undefined}
                          onSelect={(date) => setEditingCase({...editingCase, judgement_date: date ? format(date, "yyyy-MM-dd") : null})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-slate-50 p-4 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg mb-3">Additional Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Present Status</label>
                    <Input
                      value={editingCase.present_status || ""}
                      onChange={(e) => setEditingCase({...editingCase, present_status: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-600 mb-1 block">Details</label>
                    <Input
                      value={editingCase.details || ""}
                      onChange={(e) => setEditingCase({...editingCase, details: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingCase(null);
                  }}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this case history entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingHistory}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeletingHistory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingHistory ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Approval Confirmation Dialog */}
      <AlertDialog open={isEditApprovalDialogOpen} onOpenChange={setIsEditApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Edit Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to edit this litigation case? You will need to request approval again for future edits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsEditApprovalDialogOpen(false);
              setCaseToEdit(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEdit}>
              Proceed to Edit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
