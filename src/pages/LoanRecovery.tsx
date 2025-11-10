import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Search, Filter, Building2, User, Calendar, RefreshCw, IndianRupee, Eye, ChevronDown, Download, Plus, Edit2, Trash2, Save, X, History, Loader2, CalendarIcon } from "lucide-react";
import * as XLSX from 'xlsx';
import { AppSidebar } from "@/components/AppSidebar";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { FloatingInput } from "@/components/ui/floating-input";
import { DatePicker } from "@/components/ui/date-picker";


const LoanRecovery = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBank, setSelectedBank] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [litigationCases, setLitigationCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [litigationAccessAccounts, setLitigationAccessAccounts] = useState<any[]>([]);
  const [visibleToAccounts, setVisibleToAccounts] = useState<string[]>([]);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [newHistoryEntry, setNewHistoryEntry] = useState({
    registration_number: "",
    judge: "",
    business_on_date: "",
    hearing_date: "",
    purpose_of_hearing: ""
  });
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);
  const [isUpdatingHistory, setIsUpdatingHistory] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    fetchLitigationCases();
    fetchLitigationAccessAccounts();

    // Set up real-time subscription
    const channel = supabase
      .channel('litigation-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'litigation_cases'
        },
        () => {
          fetchLitigationCases();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLitigationCases = async () => {
    try {
      const { data, error } = await supabase
        .from('litigation_cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching litigation cases:', error);
        showToast.error('Failed to load litigation cases');
      } else {
        setLitigationCases(data || []);
      }
    } catch (error) {
      console.error('Error fetching litigation cases:', error);
      showToast.error('Failed to load litigation cases');
    } finally {
      setLoading(false);
    }
  };

  const fetchLitigationAccessAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('litigation_access_accounts')
        .select('username')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching litigation access accounts:', error);
      } else {
        setLitigationAccessAccounts(data || []);
      }
    } catch (error) {
      console.error('Error fetching litigation access accounts:', error);
    }
  };

  const banks = Array.from(new Set(
    litigationCases
      .filter(c => c.bank_name)
      .map(c => c.bank_name)
  ));
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Decreed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Dismissed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-muted text-muted-foreground";
    }
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
        setLitigationCases(litigationCases.map(c => 
          c.id === caseId ? { ...c, status: newStatus } : c
        ));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast.error('Failed to update status');
    }
  };
  const filteredApplications = litigationCases.filter(litigationCase => {
    const name = litigationCase.category === 'bank' 
      ? litigationCase.borrower_name 
      : litigationCase.petitioner_name;
    const bank = litigationCase.bank_name || '';
    
    const matchesSearch = 
      name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      litigationCase.case_no?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      litigationCase.case_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBank = selectedBank === "all" || litigationCase.bank_name === selectedBank;
    
    // Date range filtering based on filing_date
    let matchesDateRange = true;
    if (startDate || endDate) {
      const filingDate = new Date(litigationCase.filing_date);
      if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = filingDate >= start && filingDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = filingDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = filingDate <= end;
      }
    }
    
    return matchesSearch && matchesBank && matchesDateRange;
  });

  const handleExportToExcel = () => {
    // Prepare data for Excel export (using filtered data)
    const exportData = filteredApplications.map((litigationCase) => {
      const baseData: any = {
        "Case No": litigationCase.case_no,
        "Category": litigationCase.category,
        "Status": litigationCase.status,
        "Case Type": litigationCase.case_type,
        "Court Name": litigationCase.court_name,
        "Court District": litigationCase.court_district,
        "Filing Date": litigationCase.filing_date ? format(new Date(litigationCase.filing_date), 'dd MMM yyyy') : '-',
        "Next Hearing Date": litigationCase.next_hearing_date ? format(new Date(litigationCase.next_hearing_date), 'dd MMM yyyy') : '-',
      };

      // Add bank-specific fields
      if (litigationCase.category === 'bank') {
        baseData["Bank Name"] = litigationCase.bank_name || '-';
        baseData["Branch Name"] = litigationCase.branch_name || '-';
        baseData["Account No"] = litigationCase.account_no || '-';
        baseData["Loan Amount"] = litigationCase.loan_amount ? `₹${litigationCase.loan_amount.toLocaleString()}` : '-';
        baseData["Borrower Name"] = litigationCase.borrower_name || '-';
        baseData["Co-Borrower Name"] = litigationCase.co_borrower_name || '-';
      }

      // Add private-specific fields
      if (litigationCase.category === 'private') {
        baseData["Petitioner Name"] = litigationCase.petitioner_name || '-';
        baseData["Respondent Name"] = litigationCase.respondent_name || '-';
        baseData["Petitioner Address"] = litigationCase.petitioner_address || '-';
        baseData["Respondent Address"] = litigationCase.respondent_address || '-';
      }

      // Add advocate fees
      baseData["Total Advocate Fees"] = litigationCase.total_advocate_fees ? `₹${litigationCase.total_advocate_fees.toLocaleString()}` : '-';
      baseData["Initial Fees"] = litigationCase.initial_fees ? `₹${litigationCase.initial_fees.toLocaleString()}` : '-';
      baseData["Initial Fees Received On"] = litigationCase.initial_fees_received_on ? format(new Date(litigationCase.initial_fees_received_on), 'dd MMM yyyy') : '-';
      baseData["Final Fees"] = litigationCase.final_fees ? `₹${litigationCase.final_fees.toLocaleString()}` : '-';
      baseData["Final Fees Received On"] = litigationCase.final_fees_received_on ? format(new Date(litigationCase.final_fees_received_on), 'dd MMM yyyy') : '-';
      baseData["Judgement Date"] = litigationCase.judgement_date ? format(new Date(litigationCase.judgement_date), 'dd MMM yyyy') : '-';

      // Add additional information
      baseData["Present Status"] = litigationCase.present_status || '-';
      baseData["Details"] = litigationCase.details || '-';
      baseData["Created At"] = litigationCase.created_at ? format(new Date(litigationCase.created_at), 'dd MMM yyyy HH:mm') : '-';

      return baseData;
    });

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Litigation Cases");

    // Generate Excel file
    XLSX.writeFile(workbook, `Litigation_Cases_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleViewDetails = async (litigationCase: any) => {
    setSelectedCase(litigationCase);
    // Fetch existing visibility settings for this case
    try {
      const { data, error } = await (supabase as any)
        .from('litigation_case_visibility')
        .select('litigation_access_username')
        .eq('litigation_case_id', litigationCase.id);
      
      if (error) {
        console.error('Error fetching visibility:', error);
        setVisibleToAccounts([]);
      } else {
        const usernames = data?.map((v: any) => v.litigation_access_username) || [];
        setVisibleToAccounts(usernames);
      }
    } catch (error) {
      console.error('Error fetching visibility:', error);
      setVisibleToAccounts([]);
    }
    
    setIsDetailsOpen(true);
  };

  const handleViewHistory = async (litigationCase: any) => {
    setSelectedCase(litigationCase);
    
    // Fetch case history
    await fetchCaseHistory(litigationCase.id);
    
    // Initialize new history entry with filing date
    setNewHistoryEntry({
      registration_number: "",
      judge: "",
      business_on_date: litigationCase.filing_date || "",
      hearing_date: "",
      purpose_of_hearing: ""
    });
    
    setIsHistoryOpen(true);
  };

  const fetchCaseHistory = async (caseId: string) => {
    try {
      const { data, error } = await supabase
        .from('litigation_case_history')
        .select('*')
        .eq('litigation_case_id', caseId)
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
      setHistoryEntries([]);
    }
  };

  const handleAddHistoryEntry = async () => {
    if (!selectedCase) return;

    if (!newHistoryEntry.hearing_date) {
      showToast.error('Please fill in the hearing date');
      return;
    }

    setIsSubmittingHistory(true);
    try {
      const { data, error } = await supabase
        .from('litigation_case_history')
        .insert({
          litigation_case_id: selectedCase.id,
          registration_number: newHistoryEntry.registration_number,
          judge_name: newHistoryEntry.judge,
          business_on_date: newHistoryEntry.business_on_date,
          hearing_date: newHistoryEntry.hearing_date,
          purpose_of_hearing: newHistoryEntry.purpose_of_hearing
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding history entry:', error);
        showToast.error('Failed to add history entry');
      } else {
        setHistoryEntries([...historyEntries, data]);
        // Reset form with previous hearing date as business_on_date
        setNewHistoryEntry({
          registration_number: "",
          judge: "",
          business_on_date: newHistoryEntry.hearing_date || "",
          hearing_date: "",
          purpose_of_hearing: ""
        });
        showToast.success('History entry added successfully');
      }
    } catch (error) {
      console.error('Error adding history entry:', error);
      showToast.error('Failed to add history entry');
    } finally {
      setIsSubmittingHistory(false);
    }
  };

  const handleEditHistoryEntry = async (entry: any) => {
    if (editingHistoryId === entry.id) {
      // Save the edit
      setIsUpdatingHistory(true);
      try {
        const { error } = await supabase
          .from('litigation_case_history')
          .update({
            registration_number: entry.registration_number,
            judge_name: entry.judge_name,
            business_on_date: entry.business_on_date,
            hearing_date: entry.hearing_date,
            purpose_of_hearing: entry.purpose_of_hearing
          })
          .eq('id', entry.id);

        if (error) {
          console.error('Error updating history entry:', error);
          showToast.error('Failed to update history entry');
        } else {
          showToast.success('History entry updated successfully');
          setEditingHistoryId(null);
          await fetchCaseHistory(selectedCase.id);
        }
      } catch (error) {
        console.error('Error updating history entry:', error);
        showToast.error('Failed to update history entry');
      } finally {
        setIsUpdatingHistory(false);
      }
    } else {
      setEditingHistoryId(entry.id);
    }
  };

  const handleDeleteHistoryEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('litigation_case_history')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('Error deleting history entry:', error);
        showToast.error('Failed to delete history entry');
      } else {
        setHistoryEntries(historyEntries.filter(entry => entry.id !== entryId));
        showToast.success('History entry deleted successfully');
        setDeletingEntryId(null);
      }
    } catch (error) {
      console.error('Error deleting history entry:', error);
      showToast.error('Failed to delete history entry');
    }
  };

  const updateHistoryEntry = (entryId: string, field: string, value: string) => {
    setHistoryEntries(historyEntries.map(entry => 
      entry.id === entryId ? { ...entry, [field]: value } : entry
    ));
  };

  const toggleAccountVisibility = async (username: string) => {
    if (!selectedCase) return;

    const isCurrentlyVisible = visibleToAccounts.includes(username);
    
    try {
      if (isCurrentlyVisible) {
        // Remove visibility
        const { error } = await (supabase as any)
          .from('litigation_case_visibility')
          .delete()
          .eq('litigation_case_id', selectedCase.id)
          .eq('litigation_access_username', username);
        
        if (error) {
          console.error('Error removing visibility:', error);
          showToast.error('Failed to update visibility');
          return;
        }
        
        setVisibleToAccounts(prev => prev.filter(u => u !== username));
        showToast.success(`Removed visibility for ${username}`);
      } else {
        // Add visibility
        const { error } = await (supabase as any)
          .from('litigation_case_visibility')
          .insert({
            litigation_case_id: selectedCase.id,
            litigation_access_username: username
          });
        
        if (error) {
          console.error('Error adding visibility:', error);
          showToast.error('Failed to update visibility');
          return;
        }
        
        setVisibleToAccounts(prev => [...prev, username]);
        showToast.success(`Added visibility for ${username}`);
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      showToast.error('Failed to update visibility');
    }
  };

  const handleNoVisible = async () => {
    if (!selectedCase) return;
    
    try {
      // Remove all visibility entries for this case
      const { error } = await (supabase as any)
        .from('litigation_case_visibility')
        .delete()
        .eq('litigation_case_id', selectedCase.id);
      
      if (error) {
        console.error('Error clearing visibility:', error);
        showToast.error('Failed to clear visibility');
        return;
      }
      
      setVisibleToAccounts([]);
      showToast.success('Cleared all visibility settings');
    } catch (error) {
      console.error('Error clearing visibility:', error);
      showToast.error('Failed to clear visibility');
    }
  };

  const handleEdit = (litigationCase: any) => {
    setEditFormData({ ...litigationCase });
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData) return;

    setIsSavingEdit(true);
    try {
      const { error } = await supabase
        .from('litigation_cases')
        .update({
          case_no: editFormData.case_no,
          category: editFormData.category,
          bank_name: editFormData.bank_name,
          branch_name: editFormData.branch_name,
          account_no: editFormData.account_no,
          loan_amount: editFormData.loan_amount,
          borrower_name: editFormData.borrower_name,
          co_borrower_name: editFormData.co_borrower_name,
          petitioner_name: editFormData.petitioner_name,
          petitioner_address: editFormData.petitioner_address,
          respondent_name: editFormData.respondent_name,
          respondent_address: editFormData.respondent_address,
          case_type: editFormData.case_type,
          court_name: editFormData.court_name,
          court_district: editFormData.court_district,
          filing_date: editFormData.filing_date,
          next_hearing_date: editFormData.next_hearing_date,
          total_advocate_fees: editFormData.total_advocate_fees,
          initial_fees: editFormData.initial_fees,
          initial_fees_received_on: editFormData.initial_fees_received_on,
          final_fees: editFormData.final_fees,
          final_fees_received_on: editFormData.final_fees_received_on,
          judgement_date: editFormData.judgement_date,
          present_status: editFormData.present_status,
          details: editFormData.details,
          status: editFormData.status
        })
        .eq('id', editFormData.id);

      if (error) {
        console.error('Error updating litigation case:', error);
        showToast.error('Failed to update litigation case');
      } else {
        showToast.success('Litigation case updated successfully');
        setIsEditOpen(false);
        fetchLitigationCases();
      }
    } catch (error) {
      console.error('Error updating litigation case:', error);
      showToast.error('Failed to update litigation case');
    } finally {
      setIsSavingEdit(false);
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-legal-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-sm shadow-elegant border-b border-white/20">
            <div className="px-6">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <SidebarTrigger className="text-slate-600 hover:text-blue-600 transition-colors duration-200" />
                  <div className="h-6 w-px bg-slate-300"></div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-600 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-emerald-600 bg-clip-text text-transparent">Litigation Applications</h1>
                      <p className="text-sm text-slate-600">Manage Litigation cases</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleExportToExcel}
                  variant="outline"
                  className="border-green-600 text-green-600 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="px-6 py-8">
              {/* Filters Section */}
              <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-lg shadow-card border border-white/20 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="Search case number, name..." 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)} 
                      className="pl-10 bg-white/50 border-slate-200 focus:border-blue-300 focus:ring-blue-200" 
                    />
                  </div>
                  
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger className="bg-white/50 border-slate-200">
                      <SelectValue placeholder="Filter by bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Banks</SelectItem>
                      {banks.map(bank => (
                        <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex gap-2 items-center">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal bg-white/50 border-slate-200",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal bg-white/50 border-slate-200",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
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
                  </div>
                </div>
              </div>

              {/* Litigation Applications Table */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-card border border-white/20 overflow-hidden">
                {loading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="h-12 w-12 text-slate-400 mx-auto mb-4 animate-spin" />
                    <p className="text-slate-600">Loading litigation cases...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-green-50 hover:from-slate-50 hover:to-green-50">
                        <TableHead className="font-semibold text-slate-700">Case No</TableHead>
                        <TableHead className="font-semibold text-slate-700">Status</TableHead>
                        <TableHead className="font-semibold text-slate-700">Name</TableHead>
                        <TableHead className="font-semibold text-slate-700">Bank</TableHead>
                        <TableHead className="font-semibold text-slate-700">Court</TableHead>
                        <TableHead className="font-semibold text-slate-700">Case Type</TableHead>
                        <TableHead className="font-semibold text-slate-700">Filing Date</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map(litigationCase => {
                        const name = litigationCase.category === 'bank' 
                          ? litigationCase.borrower_name 
                          : litigationCase.petitioner_name;
                        
                        return (
                          <TableRow key={litigationCase.id} className="hover:bg-green-50/50 transition-colors duration-200">
                            <TableCell className="font-medium">
                              <div className="flex items-center space-x-2">
                                <RefreshCw className="h-4 w-4 text-emerald-600" />
                                <span className="text-slate-800">{litigationCase.case_no}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select 
                                value={litigationCase.status} 
                                onValueChange={(value) => handleStatusChange(litigationCase.id, value)}
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
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-700">{name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4 text-slate-500" />
                                <span className="text-slate-700">{litigationCase.bank_name || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-700">{litigationCase.court_name}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-slate-700">{litigationCase.case_type}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-slate-600">
                                  {format(new Date(litigationCase.filing_date), 'yyyy-MM-dd')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white" 
                                  size="sm"
                                  onClick={() => handleViewHistory(litigationCase)}
                                >
                                  <History className="h-4 w-4 mr-1" />
                                  History
                                </Button>
                                <Button 
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(litigationCase)}
                                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  className="bg-[#334155] hover:bg-[#475569] text-white" 
                                  size="sm"
                                  onClick={() => handleViewDetails(litigationCase)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Details
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* No Results */}
              {!loading && filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <RefreshCw className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">No litigation cases found</h3>
                  <p className="text-slate-500">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Case Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-bold">Litigation Case Details</DialogTitle>
                <DialogDescription>Complete information about the litigation case</DialogDescription>
              </div>
            </div>
            <div className="mt-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Visible to
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white z-50">
                  <DropdownMenuItem onClick={handleNoVisible} className="cursor-pointer hover:bg-slate-100">
                    <span className="text-red-600 font-medium">No Visible</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {litigationAccessAccounts.map((account) => (
                    <DropdownMenuCheckboxItem
                      key={account.username}
                      checked={visibleToAccounts.includes(account.username)}
                      onCheckedChange={() => toggleAccountVisibility(account.username)}
                      className="cursor-pointer"
                    >
                      {account.username}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                    <Badge className={getStatusColor(selectedCase.status)}>{selectedCase.status}</Badge>
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
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <History className="h-6 w-6 mr-2 text-indigo-600" />
              Case History - {selectedCase?.case_no}
            </DialogTitle>
            <DialogDescription>
              Manage case history entries and hearing records
            </DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-6 mt-4">
              {/* Case History Section */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-6 flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-indigo-600" />
                  Case History
                </h3>

                {/* Add New History Entry Form */}
                <div className="bg-white p-6 rounded-lg mb-6 border border-indigo-200">
                  <h4 className="font-medium mb-6 text-base text-slate-700">Add New Entry</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FloatingInput
                      label="Registration Number"
                      value={newHistoryEntry.registration_number}
                      onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, registration_number: e.target.value })}
                    />
                    <FloatingInput
                      label="Judge Name"
                      value={newHistoryEntry.judge}
                      onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, judge: e.target.value })}
                    />
                    <DatePicker
                      label="Business On Date"
                      value={newHistoryEntry.business_on_date}
                      onChange={(date) => setNewHistoryEntry({ ...newHistoryEntry, business_on_date: date })}
                      showLabelOutside={false}
                    />
                    <DatePicker
                      label="Hearing Date"
                      value={newHistoryEntry.hearing_date}
                      onChange={(date) => setNewHistoryEntry({ ...newHistoryEntry, hearing_date: date })}
                      showLabelOutside={false}
                    />
                    <div className="md:col-span-2">
                      <FloatingInput
                        label="Purpose of Hearing"
                        value={newHistoryEntry.purpose_of_hearing}
                        onChange={(e) => setNewHistoryEntry({ ...newHistoryEntry, purpose_of_hearing: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddHistoryEntry}
                    className="mt-5 bg-indigo-600 hover:bg-indigo-700"
                    disabled={isSubmittingHistory}
                  >
                    {isSubmittingHistory ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding Entry...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                      </>
                    )}
                  </Button>
                </div>

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
                          <TableHead className="text-sm font-semibold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyEntries.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell className="text-sm">
                              {editingHistoryId === entry.id ? (
                                <Input
                                  value={entry.registration_number || ""}
                                  onChange={(e) => updateHistoryEntry(entry.id, 'registration_number', e.target.value)}
                                  className="text-sm h-10"
                                />
                              ) : (
                                entry.registration_number || "-"
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {editingHistoryId === entry.id ? (
                                <Input
                                  value={entry.judge_name || ""}
                                  onChange={(e) => updateHistoryEntry(entry.id, 'judge_name', e.target.value)}
                                  className="text-sm h-10"
                                />
                              ) : (
                                entry.judge_name || "-"
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {editingHistoryId === entry.id ? (
                                <DatePicker
                                  label="Business On Date"
                                  value={entry.business_on_date || ""}
                                  onChange={(date) => updateHistoryEntry(entry.id, 'business_on_date', date)}
                                  showLabelOutside={false}
                                />
                              ) : (
                                entry.business_on_date ? format(new Date(entry.business_on_date), 'dd MMM yyyy') : "-"
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {editingHistoryId === entry.id ? (
                                <DatePicker
                                  label="Hearing Date"
                                  value={entry.hearing_date || ""}
                                  onChange={(date) => updateHistoryEntry(entry.id, 'hearing_date', date)}
                                  showLabelOutside={false}
                                />
                              ) : (
                                entry.hearing_date ? format(new Date(entry.hearing_date), 'dd MMM yyyy') : "-"
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {editingHistoryId === entry.id ? (
                                <Input
                                  value={entry.purpose_of_hearing || ""}
                                  onChange={(e) => updateHistoryEntry(entry.id, 'purpose_of_hearing', e.target.value)}
                                  className="text-sm h-10"
                                />
                              ) : (
                                entry.purpose_of_hearing || "-"
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {editingHistoryId === entry.id ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleEditHistoryEntry(entry)}
                                      className="h-8 w-8 p-0"
                                      disabled={isUpdatingHistory}
                                    >
                                      {isUpdatingHistory ? (
                                        <Loader2 className="h-4 w-4 text-green-600 animate-spin" />
                                      ) : (
                                        <Save className="h-4 w-4 text-green-600" />
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingHistoryId(null)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <X className="h-4 w-4 text-slate-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingHistoryId(entry.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit2 className="h-4 w-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeletingEntryId(entry.id)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-indigo-200 p-8 text-center">
                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No case history entries yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit Litigation Case</DialogTitle>
            <DialogDescription>Update the litigation case information</DialogDescription>
          </DialogHeader>
          
          {editFormData && (
            <div className="space-y-6 mt-4">
              {/* Basic Information */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput
                    label="Case Number"
                    value={editFormData.case_no || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, case_no: e.target.value })}
                  />
                  <Select value={editFormData.category || ""} onValueChange={(value) => setEditFormData({ ...editFormData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <FloatingInput
                    label="Case Type"
                    value={editFormData.case_type || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, case_type: e.target.value })}
                  />
                  <Select value={editFormData.status || ""} onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Decreed">Decreed</SelectItem>
                      <SelectItem value="Dismissed">Dismissed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FloatingInput
                    label="Court Name"
                    value={editFormData.court_name || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, court_name: e.target.value })}
                  />
                  <FloatingInput
                    label="Court District"
                    value={editFormData.court_district || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, court_district: e.target.value })}
                  />
                  <DatePicker
                    label="Filing Date"
                    value={editFormData.filing_date || ""}
                    onChange={(date) => setEditFormData({ ...editFormData, filing_date: date })}
                    showLabelOutside={false}
                  />
                  <DatePicker
                    label="Next Hearing Date"
                    value={editFormData.next_hearing_date || ""}
                    onChange={(date) => setEditFormData({ ...editFormData, next_hearing_date: date })}
                    showLabelOutside={false}
                  />
                </div>
              </div>

              {/* Bank Details - shown only for bank category */}
              {editFormData.category === 'bank' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Bank Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput
                      label="Bank Name"
                      value={editFormData.bank_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
                    />
                    <FloatingInput
                      label="Branch Name"
                      value={editFormData.branch_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, branch_name: e.target.value })}
                    />
                    <FloatingInput
                      label="Account Number"
                      value={editFormData.account_no || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, account_no: e.target.value })}
                    />
                    <FloatingInput
                      label="Loan Amount"
                      type="number"
                      value={editFormData.loan_amount || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, loan_amount: parseFloat(e.target.value) || null })}
                    />
                    <FloatingInput
                      label="Borrower Name"
                      value={editFormData.borrower_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, borrower_name: e.target.value })}
                    />
                    <FloatingInput
                      label="Co-Borrower Name"
                      value={editFormData.co_borrower_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, co_borrower_name: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {/* Party Details - shown only for private category */}
              {editFormData.category === 'private' && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg mb-4">Party Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FloatingInput
                      label="Petitioner Name"
                      value={editFormData.petitioner_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, petitioner_name: e.target.value })}
                    />
                    <FloatingInput
                      label="Respondent Name"
                      value={editFormData.respondent_name || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, respondent_name: e.target.value })}
                    />
                    <div className="col-span-2">
                      <FloatingInput
                        label="Petitioner Address"
                        value={editFormData.petitioner_address || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, petitioner_address: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <FloatingInput
                        label="Respondent Address"
                        value={editFormData.respondent_address || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, respondent_address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fees Information */}
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Advocate Fees</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FloatingInput
                    label="Total Advocate Fees"
                    type="number"
                    value={editFormData.total_advocate_fees || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, total_advocate_fees: parseFloat(e.target.value) || null })}
                  />
                  <FloatingInput
                    label="Initial Fees"
                    type="number"
                    value={editFormData.initial_fees || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, initial_fees: parseFloat(e.target.value) || null })}
                  />
                  <DatePicker
                    label="Initial Fees Received On"
                    value={editFormData.initial_fees_received_on || ""}
                    onChange={(date) => setEditFormData({ ...editFormData, initial_fees_received_on: date })}
                    showLabelOutside={false}
                  />
                  <FloatingInput
                    label="Final Fees"
                    type="number"
                    value={editFormData.final_fees || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, final_fees: parseFloat(e.target.value) || null })}
                  />
                  <DatePicker
                    label="Final Fees Received On"
                    value={editFormData.final_fees_received_on || ""}
                    onChange={(date) => setEditFormData({ ...editFormData, final_fees_received_on: date })}
                    showLabelOutside={false}
                  />
                  <DatePicker
                    label="Judgement Date"
                    value={editFormData.judgement_date || ""}
                    onChange={(date) => setEditFormData({ ...editFormData, judgement_date: date })}
                    showLabelOutside={false}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">Additional Information</h3>
                <div className="space-y-4">
                  <FloatingInput
                    label="Present Status"
                    value={editFormData.present_status || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, present_status: e.target.value })}
                  />
                  <FloatingInput
                    label="Details"
                    value={editFormData.details || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, details: e.target.value })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={isSavingEdit}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSavingEdit ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
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
      <AlertDialog open={!!deletingEntryId} onOpenChange={() => setDeletingEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete History Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this history entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingEntryId && handleDeleteHistoryEntry(deletingEntryId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>;
};
export default LoanRecovery;