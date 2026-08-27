"use client";
import { useState } from "react";
import { useOrg } from "@/components/OrgProvider";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const { org, role } = useOrg();

  const [tiffinPrice, setTiffinPrice] = useState(org.tiffinPrice || 0);
  const [saving, setSaving] = useState(false);

  if (role !== "admin") {
    return <div className="p-4 text-muted-foreground">Access Denied</div>;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/organizations/${org._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiffinPrice: Number(tiffinPrice) })
      });
      if (res.ok) {
        toast.success("Settings updated successfully!");
        // Force refresh to update context (could be optimized)
        window.location.reload();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update settings");
      }
    } catch {
      toast.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Organization Profile</CardTitle>
          <CardDescription>View your organization details and invite code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 max-w-xl">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input
                type="text"
                disabled
                value={org.name}
                className="bg-muted text-muted-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Invite Code</Label>
              <Input
                type="text"
                disabled
                value={org.inviteCode}
                className="font-mono bg-muted text-muted-foreground"
              />
              <p className="text-[13px] text-muted-foreground">
                Share this code with users for them to join this organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing & Pricing</CardTitle>
          <CardDescription>Configure pricing defaults for your organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 max-w-xl">
            <div className="space-y-2">
              <Label>Default Tiffin Price (₹)</Label>
              <Input
                type="number"
                min="0"
                value={tiffinPrice}
                onChange={(e) => setTiffinPrice(Number(e.target.value))}
              />
              <p className="text-[13px] text-muted-foreground">
                This price will be used by default to calculate the total tiffin bill for members.
              </p>
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
