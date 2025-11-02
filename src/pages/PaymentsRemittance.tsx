import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function PaymentsRemittance() {
  const queryClient = useQueryClient();
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [remittanceFilter, setRemittanceFilter] = useState<string>("all");
  const [depositFilter, setDepositFilter] = useState<string>("all");
  const [balanceFilter, setBalanceFilter] = useState<string>("all");
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["bookings-remittance", clientFilter, remittanceFilter, depositFilter, balanceFilter],
    queryFn: async () => {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          clients:client_id(id, name),
          artists:artist_id(id, name),
          contacts!bookings_accounts_contact_id_fkey(id, name)
        `)
        .order("start_date", { ascending: false });

      if (clientFilter !== "all") {
        query = query.eq("client_id", clientFilter);
      }
      if (remittanceFilter === "true") {
        query = query.eq("remittance_received", true);
      } else if (remittanceFilter === "false") {
        query = query.eq("remittance_received", false);
      }
      if (depositFilter === "true") {
        query = query.eq("deposit_paid", true);
      } else if (depositFilter === "false") {
        query = query.eq("deposit_paid", false);
      }
      if (balanceFilter === "true") {
        query = query.eq("balance_paid", true);
      } else if (balanceFilter === "false") {
        query = query.eq("balance_paid", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const updateBooking = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings-remittance"] });
      toast.success("Updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const markAllPaid = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedBookings);
      if (ids.length === 0) {
        throw new Error("No bookings selected");
      }
      const { error } = await supabase
        .from("bookings")
        .update({
          deposit_paid: true,
          balance_paid: true,
          remittance_received: true,
        })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings-remittance"] });
      setSelectedBookings(new Set());
      toast.success(`Marked ${selectedBookings.size} booking(s) as fully paid`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const toggleSelection = (bookingId: string) => {
    const newSelection = new Set(selectedBookings);
    if (newSelection.has(bookingId)) {
      newSelection.delete(bookingId);
    } else {
      newSelection.add(bookingId);
    }
    setSelectedBookings(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedBookings.size === bookings?.length) {
      setSelectedBookings(new Set());
    } else {
      setSelectedBookings(new Set(bookings?.map(b => b.id) || []));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payments & Remittance</h1>
        <Button
          onClick={() => markAllPaid.mutate()}
          disabled={selectedBookings.size === 0 || markAllPaid.isPending}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark Selected as Paid ({selectedBookings.size})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Client</label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Remittance Received</label>
              <Select value={remittanceFilter} onValueChange={setRemittanceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Received</SelectItem>
                  <SelectItem value="false">Not Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Deposit Paid</label>
              <Select value={depositFilter} onValueChange={setDepositFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Paid</SelectItem>
                  <SelectItem value="false">Not Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Balance Paid</label>
              <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Paid</SelectItem>
                  <SelectItem value="false">Not Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedBookings.size === bookings?.length && bookings?.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Booking</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Artist</TableHead>
                    <TableHead>Deposit</TableHead>
                    <TableHead>Deposit Paid</TableHead>
                    <TableHead>Balance Paid</TableHead>
                    <TableHead>Remittance</TableHead>
                    <TableHead>Remittance Date</TableHead>
                    <TableHead>Accounts Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-muted-foreground">
                        No bookings found
                      </TableCell>
                    </TableRow>
                  ) : (
                    bookings?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedBookings.has(booking.id)}
                            onCheckedChange={() => toggleSelection(booking.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/bookings/${booking.id}`}
                            className="text-primary hover:underline"
                          >
                            {booking.description || "Unnamed Booking"}
                          </Link>
                        </TableCell>
                        <TableCell>{booking.clients?.name || "-"}</TableCell>
                        <TableCell>{booking.artists?.name || "-"}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={booking.deposit_amount || ""}
                            onChange={(e) => {
                              const value = e.target.value ? parseFloat(e.target.value) : null;
                              updateBooking.mutate({
                                id: booking.id,
                                updates: { deposit_amount: value },
                              });
                            }}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={booking.deposit_paid || false}
                            onCheckedChange={(checked) => {
                              updateBooking.mutate({
                                id: booking.id,
                                updates: { deposit_paid: checked },
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={booking.balance_paid || false}
                            onCheckedChange={(checked) => {
                              updateBooking.mutate({
                                id: booking.id,
                                updates: { balance_paid: checked },
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={booking.remittance_received || false}
                            onCheckedChange={(checked) => {
                              updateBooking.mutate({
                                id: booking.id,
                                updates: { remittance_received: checked },
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={booking.remittance_date || ""}
                            onChange={(e) => {
                              updateBooking.mutate({
                                id: booking.id,
                                updates: { remittance_date: e.target.value || null },
                              });
                            }}
                            className="w-36"
                          />
                        </TableCell>
                        <TableCell>{booking.contacts?.name || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
