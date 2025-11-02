import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface StatsCard {
  label: string;
  value: number | string;
  format: "number" | "currency";
  icon: any;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [statsCards, setStatsCards] = useState<StatsCard[]>([]);
  const [bookingsByWeek, setBookingsByWeek] = useState<any[]>([]);
  const [bookingStatus, setBookingStatus] = useState<any[]>([]);
  const [profitTrend, setProfitTrend] = useState<any[]>([]);
  const [depositStatus, setDepositStatus] = useState<any[]>([]);
  const [attentionNeeded, setAttentionNeeded] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      // Monthly Bookings Count
      const { count: monthlyCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("start_date", startOfMonth);

      // Confirmed Bookings Count
      const { count: confirmedCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("artist_status", "confirmed");

      // Outstanding Balances
      const { data: allBookings } = await supabase
        .from("bookings")
        .select("sell_fee, deposit_amount, balance_paid")
        .eq("balance_paid", false);

      const outstandingTotal = allBookings?.reduce((sum, booking) => {
        const sellFee = booking.sell_fee || 0;
        const deposit = booking.deposit_amount || 0;
        return sum + (sellFee - deposit);
      }, 0) || 0;

      // Upcoming Events
      const { count: upcomingCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("start_date", now.toISOString())
        .lte("start_date", in7Days);

      setStatsCards([
        { label: "Total Bookings (Month)", value: monthlyCount || 0, format: "number", icon: Calendar },
        { label: "Confirmed Bookings", value: confirmedCount || 0, format: "number", icon: TrendingUp },
        { label: "Outstanding Balances (£)", value: outstandingTotal, format: "currency", icon: DollarSign },
        { label: "Upcoming Events (7 days)", value: upcomingCount || 0, format: "number", icon: AlertCircle },
      ]);

      // Fetch all bookings for aggregations
      const { data: bookings } = await supabase
        .from("bookings")
        .select("start_date, artist_status, sell_fee, artist_fee, deposit_paid");

      if (bookings) {
        // Bookings by Week
        const weeklyMap = new Map<string, number>();
        bookings.forEach(booking => {
          const date = new Date(booking.start_date);
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          const weekKey = weekStart.toISOString().split('T')[0];
          weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + 1);
        });
        const weeklyData = Array.from(weeklyMap.entries())
          .map(([week_start, total_bookings]) => ({ week_start, total_bookings }))
          .sort((a, b) => a.week_start.localeCompare(b.week_start));
        setBookingsByWeek(weeklyData);

        // Booking Status
        const statusMap = new Map<string, number>();
        bookings.forEach(booking => {
          const status = booking.artist_status || 'unknown';
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        });
        const statusData = Array.from(statusMap.entries())
          .map(([status, count]) => ({ status, count }));
        setBookingStatus(statusData);

        // Profit Trend by Month
        const profitMap = new Map<string, number>();
        bookings.forEach(booking => {
          const date = new Date(booking.start_date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const profit = (booking.sell_fee || 0) - (booking.artist_fee || 0);
          profitMap.set(monthKey, (profitMap.get(monthKey) || 0) + profit);
        });
        const profitData = Array.from(profitMap.entries())
          .map(([month, profit]) => ({ month, profit }))
          .sort((a, b) => a.month.localeCompare(b.month));
        setProfitTrend(profitData);

        // Deposit Status
        const depositPaid = bookings.filter(b => b.deposit_paid).length;
        const depositPending = bookings.length - depositPaid;
        setDepositStatus([
          { deposit_status: 'Deposit Paid', count: depositPaid },
          { deposit_status: 'Deposit Pending', count: depositPending }
        ]);
      }

      // Attention Needed
      const { data: attentionData } = await supabase
        .from("bookings")
        .select("description, start_date, artist_status, client_status, deposit_paid, invoiced")
        .or(`and(deposit_paid.eq.false,start_date.lt.${in7Days}),and(invoiced.eq.false,start_date.lt.${now.toISOString()})`)
        .order("start_date", { ascending: true })
        .limit(10);

      setAttentionNeeded(attentionData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  const getStatusBadgeVariant = (status: string): "enquiry" | "confirmed" | "cancelled" | "default" => {
    if (status === "enquiry") return "enquiry";
    if (status === "confirmed") return "confirmed";
    if (status === "cancelled") return "cancelled";
    return "default";
  };

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  if (loading) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">ShowPro Manager Dashboard</h1>
        <p className="text-muted-foreground">Key metrics and insights for your business</p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/bookings/new")} size="lg">
              ➕ Add Booking
            </Button>
            <Button onClick={() => navigate("/payments")} variant="secondary" size="lg">
              💰 Approve Payment
            </Button>
            <Button onClick={() => navigate("/invoice-batches/new")} variant="secondary" size="lg">
              🧾 Send Invoice
            </Button>
            <Button onClick={() => navigate("/emails-queue")} variant="secondary" size="lg">
              📨 Review Emails
            </Button>
            <Button onClick={() => navigate("/bookings")} variant="secondary" size="lg">
              📅 Upcoming Week
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {card.format === "currency" ? formatCurrency(Number(card.value)) : card.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bookings by Week */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings by Week</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ total_bookings: { label: "Bookings", color: "hsl(var(--chart-1))" } }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week_start" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total_bookings" fill="hsl(var(--chart-1))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Booking Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Count", color: "hsl(var(--chart-1))" } }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                    {bookingStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Profit Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Profit Trend (£)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ profit: { label: "Profit", color: "hsl(var(--chart-2))" } }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tickFormatter={(value) => new Date(value).toLocaleDateString("en-GB", { month: "short", year: "numeric" })} />
                  <YAxis tickFormatter={(value) => `£${value}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Deposits vs Balances */}
        <Card>
          <CardHeader>
            <CardTitle>Deposits vs Balances Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ count: { label: "Count", color: "hsl(var(--chart-3))" } }} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={depositStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="deposit_status" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Attention Needed */}
      <Card>
        <CardHeader>
          <CardTitle>Attention Needed</CardTitle>
        </CardHeader>
        <CardContent>
          {attentionNeeded.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">All caught up! No urgent items.</p>
          ) : (
            <div className="space-y-4">
              {attentionNeeded.map((booking, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="space-y-1 flex-1">
                    <p className="font-medium">{booking.description || "No description"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getStatusBadgeVariant(booking.artist_status)}>
                      Artist: {booking.artist_status}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(booking.client_status)}>
                      Client: {booking.client_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
