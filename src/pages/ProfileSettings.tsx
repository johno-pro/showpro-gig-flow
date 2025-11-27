import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, RotateCcw } from "lucide-react";

interface ProfileData {
  full_name: string;
  email_preferences: {
    marketing: boolean;
    bookings: boolean;
    reminders: boolean;
  };
  notification_settings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export default function ProfileSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    email_preferences: {
      marketing: false,
      bookings: true,
      reminders: true,
    },
    notification_settings: {
      email: true,
      sms: false,
      push: false,
    },
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email_preferences, notification_settings")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email_preferences: (data.email_preferences as any) || profile.email_preferences,
          notification_settings: (data.notification_settings as any) || profile.notification_settings,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          email_preferences: profile.email_preferences,
          notification_settings: profile.notification_settings,
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearTabStates = () => {
    try {
      // Get all localStorage keys
      const keys = Object.keys(localStorage);
      
      // Filter and remove only tab-related keys
      const tabKeys = keys.filter(key => key.includes("-tab"));
      tabKeys.forEach(key => localStorage.removeItem(key));

      toast({
        title: "Success",
        description: `Cleared ${tabKeys.length} saved tab preference(s)`,
      });
    } catch (error) {
      console.error("Error clearing tab states:", error);
      toast({
        title: "Error",
        description: "Failed to clear tab preferences",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your display name and basic information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Display Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) =>
                setProfile({ ...profile, full_name: e.target.value })
              }
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email Address</Label>
            <Input value={user?.email || ""} disabled />
            <p className="text-sm text-muted-foreground">
              Contact support to change your email address
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Choose what emails you'd like to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bookings">Booking Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about booking changes
              </p>
            </div>
            <Switch
              id="bookings"
              checked={profile.email_preferences.bookings}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  email_preferences: { ...profile.email_preferences, bookings: checked },
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminders">Event Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminders for upcoming events
              </p>
            </div>
            <Switch
              id="reminders"
              checked={profile.email_preferences.reminders}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  email_preferences: { ...profile.email_preferences, reminders: checked },
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing">Marketing & Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive news, tips, and product updates
              </p>
            </div>
            <Switch
              id="marketing"
              checked={profile.email_preferences.marketing}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  email_preferences: { ...profile.email_preferences, marketing: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notif"
              checked={profile.notification_settings.email}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  notification_settings: { ...profile.notification_settings, email: checked },
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notif">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via text message
              </p>
            </div>
            <Switch
              id="sms-notif"
              checked={profile.notification_settings.sms}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  notification_settings: { ...profile.notification_settings, sms: checked },
                })
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notif">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive browser push notifications
              </p>
            </div>
            <Switch
              id="push-notif"
              checked={profile.notification_settings.push}
              onCheckedChange={(checked) =>
                setProfile({
                  ...profile,
                  notification_settings: { ...profile.notification_settings, push: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application Preferences</CardTitle>
          <CardDescription>Reset your saved interface preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tab Preferences</Label>
              <p className="text-sm text-muted-foreground">
                Clear all saved tab states across the application
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearTabStates}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Tab States
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
