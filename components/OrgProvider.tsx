"use client";

import React, { createContext, useContext } from "react";

type OrgContextType = {
  org: { _id: string; name: string; logoUrl?: string; tiffinPrice?: number; inviteCode?: string; [key: string]: unknown };
  role: string;
  status: boolean;
};

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ 
  children, 
  org, 
  role, 
  status 
}: { 
  children: React.ReactNode, 
  org: { _id: string; name: string; logoUrl?: string; tiffinPrice?: number; inviteCode?: string; [key: string]: unknown }, 
  role: string, 
  status: boolean 
}) {
  const value = React.useMemo(() => ({ org, role, status }), [org, role, status]);

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
}
