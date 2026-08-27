"use client";

import { useOrg } from "@/components/OrgProvider";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import AdminDashboard from "@/components/dashboard/AdminDashboard";
import CustomerDashboard from "@/components/dashboard/CustomerDashboard";

export default function OrgDashboard() {
  const { org, role, status } = useOrg();

  if (status === false) {
    return (
      <Alert variant="default" className="bg-yellow-50 text-yellow-900 border-yellow-200">
        <AlertCircle className="h-4 w-4 stroke-yellow-600" />
        <AlertTitle className="text-yellow-800">Approval Pending</AlertTitle>
        <AlertDescription className="text-yellow-700">
          Your request to join <strong className="font-semibold">{org.name}</strong> is currently pending. You will gain access to the dashboard once an administrator approves your request.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      {role === "admin" ? (
        <AdminDashboard org={org} />
      ) : (
        <CustomerDashboard org={org} />
      )}
    </div>
  );
}
