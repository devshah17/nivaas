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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your organization's configuration.</p>
      </div>
      
      <Card className="border-border rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/10 border-b border-border pb-4">
          <CardTitle className="text-xl font-bold text-foreground">Organization Profile</CardTitle>
          <CardDescription className="font-medium text-muted-foreground mt-1">View your organization details and invite code.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-6 max-w-xl">
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Organization Name</Label>
              <Input
                type="text"
                disabled
                value={org.name}
                className="bg-muted text-muted-foreground rounded-xl h-11 border-border font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Invite Code</Label>
              <Input
                type="text"
                disabled
                value={org.inviteCode}
                className="font-mono bg-muted text-primary rounded-xl h-11 border-border font-bold tracking-widest text-center"
              />
              <p className="text-[13px] text-muted-foreground font-medium mt-1.5">
                Share this code with users for them to join this organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="bg-muted/10 border-b border-border pb-4">
          <CardTitle className="text-xl font-bold text-foreground">Billing & Pricing</CardTitle>
          <CardDescription className="font-medium text-muted-foreground mt-1">Configure pricing defaults for your organization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-6 max-w-xl">
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Default Tiffin Price (₹)</Label>
              <Input
                type="number"
                min="0"
                value={tiffinPrice}
                onChange={(e) => setTiffinPrice(Number(e.target.value))}
                className="rounded-xl h-11"
              />
              <p className="text-[13px] text-muted-foreground font-medium mt-1.5">
                This price will be used by default to calculate the total tiffin bill for members.
              </p>
            </div>

            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving} className="gradient-primary border-0 rounded-xl h-11 px-8 text-sm font-semibold shadow-md text-white transition-all hover:opacity-90">
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
