import { useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/lib/toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Building2, FileText, Clock, TrendingUp, CheckCircle, Camera, LogOut } from "lucide-react";
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [pendingApplicationsCount, setPendingApplicationsCount] = useState(0);
  const [totalApplicationsCount, setTotalApplicationsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({
    totalDays: 0,
    presentDays: 0,
    percentage: 0
  });
  const [percentageChanges, setPercentageChanges] = useState({
    banksSolved: 0,
    pendingCases: 0,
    totalCases: 0
  });

  // Fetch applications count and notifications from database
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    fetchApplicationsCount();
    fetchNotifications();
    fetchAttendanceData();

    // Set up real-time subscriptions
    const currentEmployee = localStorage.getItem('employeeUsername') || 'Nazar';
    
    const applicationsChannel = supabase
      .channel('applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `assigned_to_username=eq.${currentEmployee}`
        },
        () => {
          fetchApplicationsCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(applicationsChannel);
    };
  }, []);
  const fetchApplicationsCount = async () => {
    try {
      setLoading(true);

      // Get current employee username from localStorage
      const currentEmployee = localStorage.getItem('employeeUsername') || 'Nazar';

      // Get current month dates
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Get last month dates
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Current month - Total applications
      const { data: totalApplicationsCurrent, error: totalError } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('assigned_to_username', currentEmployee)
        .gte('created_at', startOfCurrentMonth.toISOString())
        .lte('created_at', endOfCurrentMonth.toISOString());

      // Last month - Total applications
      const { data: totalApplicationsLast } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('assigned_to_username', currentEmployee)
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      // Current month - Completed applications (Banks Solved)
      const { data: completedApplicationsCurrent, error: completedError } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('assigned_to_username', currentEmployee)
        .or('status.eq.completed,status.eq.closed,digital_signature_applied.eq.true')
        .gte('created_at', startOfCurrentMonth.toISOString())
        .lte('created_at', endOfCurrentMonth.toISOString());

      // Last month - Completed applications
      const { data: completedApplicationsLast } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('assigned_to_username', currentEmployee)
        .or('status.eq.completed,status.eq.closed,digital_signature_applied.eq.true')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      // Current month - Pending applications
      const { data: pendingApplicationsCurrent, error: pendingError } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('assigned_to_username', currentEmployee)
        .in('status', ['draft', 'submitted', 'in_review', 'pending'])
        .gte('created_at', startOfCurrentMonth.toISOString())
        .lte('created_at', endOfCurrentMonth.toISOString());

      // Last month - Pending applications
      const { data: pendingApplicationsLast } = await supabase
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('assigned_to_username', currentEmployee)
        .in('status', ['draft', 'submitted', 'in_review', 'pending'])
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

      if (totalError) console.error('Error fetching total applications:', totalError);
      if (completedError) console.error('Error fetching completed applications:', completedError);
      if (pendingError) console.error('Error fetching pending applications:', pendingError);

      // Calculate current counts
      const totalCount = totalApplicationsCurrent?.length || 0;
      const completedCount = completedApplicationsCurrent?.length || 0;
      const pendingCount = pendingApplicationsCurrent?.length || 0;

      // Calculate last month counts
      const totalCountLast = totalApplicationsLast?.length || 0;
      const completedCountLast = completedApplicationsLast?.length || 0;
      const pendingCountLast = pendingApplicationsLast?.length || 0;

      // Calculate percentage changes
      const calculatePercentageChange = (current: number, last: number) => {
        if (last === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - last) / last) * 100);
      };

      setTotalApplicationsCount(totalCount);
      setApplicationsCount(completedCount);
      setPendingApplicationsCount(pendingCount);
      
      setPercentageChanges({
        banksSolved: calculatePercentageChange(completedCount, completedCountLast),
        pendingCases: calculatePercentageChange(pendingCount, pendingCountLast),
        totalCases: calculatePercentageChange(totalCount, totalCountLast)
      });
    } catch (error) {
      console.error('Error fetching applications count:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchAttendanceData = async () => {
    try {
      const currentEmployee = localStorage.getItem('employeeUsername') || 'Nazar';
      
      // Get current month start and end dates
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Fetch attendance records for current month
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('date, type')
        .eq('employee_username', currentEmployee)
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0]);
      
      if (attendanceError) {
        console.error('Error fetching attendance:', attendanceError);
        return;
      }
      
      // Fetch excluded dates for current month
      const { data: excludedDates, error: excludedError } = await supabase
        .from('attendance_excluded_dates')
        .select('excluded_date')
        .gte('excluded_date', startOfMonth.toISOString().split('T')[0])
        .lte('excluded_date', endOfMonth.toISOString().split('T')[0]);
      
      if (excludedError) {
        console.error('Error fetching excluded dates:', excludedError);
      }
      
      // Get unique dates where employee checked in
      const uniqueCheckInDates = new Set(
        attendanceRecords
          ?.filter(record => record.type === 'check-in')
          .map(record => record.date) || []
      );
      
      const presentDays = uniqueCheckInDates.size;
      
      // Calculate total working days (excluding weekends and excluded dates)
      let totalWorkingDays = 0;
      const excludedDatesSet = new Set(excludedDates?.map(d => d.excluded_date) || []);
      
      for (let d = new Date(startOfMonth); d <= now && d <= endOfMonth; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateStr = d.toISOString().split('T')[0];
        
        // Skip Sundays (0) and excluded dates
        if (dayOfWeek !== 0 && !excludedDatesSet.has(dateStr)) {
          totalWorkingDays++;
        }
      }
      
      const percentage = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 0;
      
      setAttendanceData({
        totalDays: totalWorkingDays,
        presentDays,
        percentage
      });
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      // Get current employee username from localStorage
      const currentEmployee = localStorage.getItem('employeeUsername') || 'Nazar';

      // Fetch notifications for the current employee (last 5 notifications)
      const {
        data: notificationsData,
        error
      } = await supabase.from('notifications').select('*').eq('employee_username', currentEmployee).order('created_at', {
        ascending: false
      }).limit(5);
      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      // Transform notifications data for display
      const formattedNotifications = notificationsData?.map(notification => {
        const timeAgo = getTimeAgo(notification.created_at);
        return {
          type: notification.type || 'Notification',
          message: notification.message,
          time: timeAgo,
          applicationId: notification.application_id,
          isRead: notification.is_read
        };
      }) || [];
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Helper function to calculate time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const analyticsData = {
    attendance: attendanceData,
    banksSolved: applicationsCount,
    pendingCases: pendingApplicationsCount,
    totalCases: totalApplicationsCount
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-employee-light font-kontora">
        <EmployeeSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="min-h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-3 md:px-6 gap-2 md:gap-4 flex-wrap md:flex-nowrap py-3 md:py-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Welcome back! Here's your overview.</p>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto mt-4 lg:mt-0">
              {/* Attendance Button - Prominent on Mobile */}
              <Button 
                onClick={() => navigate('/employee/attendance')} 
                className="bg-employee-legal hover:bg-employee-legal-hover text-employee-legal-foreground flex-1 sm:flex-none h-12 md:h-10 text-base md:text-sm font-semibold"
              >
                <Camera className="h-5 w-5 md:h-4 md:w-4 mr-2" />
                Enter Attendance
              </Button>
              
              {/* Logout Button - Hidden on mobile, shown in sidebar */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-red-600 hidden sm:flex h-10">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be redirected to the login page and will need to sign in again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                    showToast.success("Successfully logged out!");
                    navigate('/');
                  }} className="bg-red-600 hover:bg-red-700">
                      Yes, Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6">
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-card bg-gradient-to-br from-card to-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Attendance Rate
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-employee-legal" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {analyticsData.attendance.percentage}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analyticsData.attendance.presentDays}/{analyticsData.attendance.totalDays} days this month
                  </p>
                  <div className="mt-2">
                    <Badge variant={analyticsData.attendance.percentage >= 90 ? "default" : "destructive"}>
                      {analyticsData.attendance.percentage >= 90 ? "Excellent" : "Needs Improvement"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card bg-gradient-to-br from-card to-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Banks Solved
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-employee-legal" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? "..." : analyticsData.banksSolved}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully resolved cases
                  </p>
                  <div className="flex items-center mt-2 text-employee-legal">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">
                      {percentageChanges.banksSolved >= 0 ? '+' : ''}{percentageChanges.banksSolved}% from last month
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card bg-gradient-to-br from-card to-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Cases
                  </CardTitle>
                  <Clock className="h-4 w-4 text-employee-legal" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? "..." : analyticsData.pendingCases}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting resolution
                  </p>
                  <div className="flex items-center mt-2 text-employee-legal">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">
                      {percentageChanges.pendingCases >= 0 ? '+' : ''}{percentageChanges.pendingCases}% from last month
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-card bg-gradient-to-br from-card to-card/80">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Cases
                  </CardTitle>
                  <FileText className="h-4 w-4 text-employee-legal" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {loading ? "..." : analyticsData.totalCases}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Handled this year
                  </p>
                  <div className="flex items-center mt-2 text-employee-legal">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span className="text-xs font-medium">
                      {percentageChanges.totalCases >= 0 ? '+' : ''}{percentageChanges.totalCases}% from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-0 shadow-card bg-gradient-to-br from-card to-card/80">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
                <CardDescription>Your latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {notifications.length > 0 ? notifications.map((notification, index) => <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <CheckCircle className={`h-5 w-5 ${notification.isRead ? 'text-muted-foreground' : 'text-employee-legal'}`} />
                          <div>
                            <p className="font-medium text-foreground">{notification.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            {notification.applicationId && <p className="text-xs text-muted-foreground">
                                App ID: {notification.applicationId}
                              </p>}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{notification.time}</span>
                      </div>) : <div className="flex items-center justify-center p-8 text-muted-foreground">
                      <p>No recent notifications</p>
                    </div>}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-card bg-gradient-to-br from-card to-card/80">
              
              
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>;
}