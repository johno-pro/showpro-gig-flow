import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Check, X, Users, Settings, Eye, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

type Role = {
  name: string;
  description: string;
  variant: "destructive" | "default" | "secondary" | "outline";
  icon: typeof Shield;
  userCount?: number;
};

type Permission = {
  category: string;
  actions: {
    name: string;
    admin: boolean;
    manager: boolean;
    artist: boolean;
    front_desk: boolean;
    view_only: boolean;
  }[];
};

const roles: Role[] = [
  {
    name: "Admin",
    description: "Full system access with user management and configuration capabilities",
    variant: "destructive",
    icon: Shield,
  },
  {
    name: "Manager",
    description: "Manage bookings, clients, artists, and all operational data",
    variant: "default",
    icon: Settings,
  },
  {
    name: "Artist",
    description: "View and manage own bookings and profile information",
    variant: "secondary",
    icon: Users,
  },
  {
    name: "Front Desk",
    description: "Limited access for reception staff to view schedules and basic information",
    variant: "outline",
    icon: Eye,
  },
  {
    name: "View Only",
    description: "Read-only access to bookings and schedules for reporting purposes",
    variant: "outline",
    icon: Eye,
  },
];

const permissions: Permission[] = [
  {
    category: "User Management",
    actions: [
      { name: "Assign roles", admin: true, manager: false, artist: false, front_desk: false, view_only: false },
      { name: "Remove roles", admin: true, manager: false, artist: false, front_desk: false, view_only: false },
      { name: "View users", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
    ],
  },
  {
    category: "Bookings",
    actions: [
      { name: "Create bookings", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Edit bookings", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Delete bookings", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "View all bookings", admin: true, manager: true, artist: false, front_desk: true, view_only: true },
      { name: "View own bookings", admin: true, manager: true, artist: true, front_desk: false, view_only: false },
    ],
  },
  {
    category: "Artists",
    actions: [
      { name: "Create artists", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Edit artists", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Delete artists", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "View artists", admin: true, manager: true, artist: true, front_desk: true, view_only: true },
    ],
  },
  {
    category: "Clients & Locations",
    actions: [
      { name: "Create/Edit clients", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Create/Edit locations", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "View clients", admin: true, manager: true, artist: false, front_desk: true, view_only: true },
      { name: "View locations", admin: true, manager: true, artist: false, front_desk: true, view_only: true },
    ],
  },
  {
    category: "Financial",
    actions: [
      { name: "View payments", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Create payments", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "View invoices", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Manage invoice batches", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
    ],
  },
  {
    category: "Data Management",
    actions: [
      { name: "Import data", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Export data", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
      { name: "Delete records", admin: true, manager: true, artist: false, front_desk: false, view_only: false },
    ],
  },
];

export default function RolesPermissions() {
  const { user } = useAuth();

  // Check if current user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Get role counts
  const { data: roleCounts } = useQuery({
    queryKey: ["role-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role");
      
      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((r) => {
        counts[r.role] = (counts[r.role] || 0) + 1;
      });
      
      return counts;
    },
    enabled: isAdmin === true,
  });

  if (checkingAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Only administrators can access roles and permissions settings.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-muted-foreground">
            Configure access control and manage user permissions
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/users">
            <Users className="mr-2 h-4 w-4" />
            Manage Users
          </Link>
        </Button>
      </div>

      {/* Role Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => {
          const roleKey = role.name.toLowerCase().replace(" ", "_");
          const count = roleCounts?.[roleKey] || 0;
          
          return (
            <Card key={role.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <role.icon className="h-5 w-5" />
                    <CardTitle className="text-xl">{role.name}</CardTitle>
                  </div>
                  <Badge variant={role.variant}>{count} users</Badge>
                </div>
                <CardDescription className="text-sm">
                  {role.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Matrix</CardTitle>
          <CardDescription>
            Detailed breakdown of what each role can do in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Permission</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                  <TableHead className="text-center">Manager</TableHead>
                  <TableHead className="text-center">Artist</TableHead>
                  <TableHead className="text-center">Front Desk</TableHead>
                  <TableHead className="text-center">View Only</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((section) => (
                  <>
                    <TableRow key={section.category} className="bg-muted/50">
                      <TableCell colSpan={6} className="font-semibold">
                        {section.category}
                      </TableCell>
                    </TableRow>
                    {section.actions.map((action) => (
                      <TableRow key={`${section.category}-${action.name}`}>
                        <TableCell className="pl-8">{action.name}</TableCell>
                        <TableCell className="text-center">
                          {action.admin ? (
                            <Check className="mx-auto h-5 w-5 text-green-600" />
                          ) : (
                            <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {action.manager ? (
                            <Check className="mx-auto h-5 w-5 text-green-600" />
                          ) : (
                            <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {action.artist ? (
                            <Check className="mx-auto h-5 w-5 text-green-600" />
                          ) : (
                            <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {action.front_desk ? (
                            <Check className="mx-auto h-5 w-5 text-green-600" />
                          ) : (
                            <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {action.view_only ? (
                            <Check className="mx-auto h-5 w-5 text-green-600" />
                          ) : (
                            <X className="mx-auto h-5 w-5 text-muted-foreground/30" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400">
            About Roles
          </CardTitle>
          <CardDescription className="text-blue-600 dark:text-blue-300">
            <ul className="mt-2 space-y-2 text-sm">
              <li>• <strong>Admin:</strong> Complete system control - use sparingly</li>
              <li>• <strong>Manager:</strong> Day-to-day operations and data management</li>
              <li>• <strong>Artist:</strong> Self-service access to own bookings</li>
              <li>• <strong>Front Desk:</strong> Reception staff with limited viewing capabilities</li>
              <li>• <strong>View Only:</strong> Read-only access for reporting and monitoring</li>
            </ul>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
