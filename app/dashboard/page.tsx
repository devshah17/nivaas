"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { LogOut, User as UserIcon, Plus, UserPlus, Building, Loader2, Search, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import NivaasLogo from "@/components/NivaasLogo";

export default function Dashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [orgs, setOrgs] = useState<{ _id: string; name: string; members: { user: string; role: string; status: boolean | string }[]; [key: string]: unknown }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ _id: string; name: string; [key: string]: unknown }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await fetch("/api/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrgs(data.organizations || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSearchOrgs = useCallback(async (pageToFetch = currentPage, query = searchQuery) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/organizations/search?q=${encodeURIComponent(query)}&page=${pageToFetch}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.organizations || []);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(data.currentPage || 1);
      } else {
        toast.error("Failed to fetch organizations");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred");
    } finally {
      setIsSearching(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    const load = async () => {
      if (user) {
        await Promise.all([fetchOrgs(), fetchSearchOrgs(1, "")]);
      }
    };
    load();
  }, [user, fetchOrgs, fetchSearchOrgs]);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgName }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Organization created!");
        setOrgName("");
        fetchOrgs();
      } else {
        toast.error(data.error || "Failed to create organization");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    try {
      const res = await fetch("/api/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Join request sent!");
        setInviteCode("");
        fetchOrgs();
      } else {
        toast.error(data.error || "Failed to join organization");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsJoining(false);
    }
  };

  const handleSearchOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchSearchOrgs(1, searchQuery);
  };

  const handleJoinById = async (orgId: string) => {
    try {
      const res = await fetch("/api/organizations/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Join request sent!");
        fetchOrgs();
      } else {
        toast.error(data.error || "Failed to join organization");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <NivaasLogo size={48} />
          <Loader2 className="h-5 w-5 animate-spin text-primary mt-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center gap-4">
            <div className="flex items-center gap-2.5">
              <NivaasLogo size={30} />
              <span className="font-bold text-lg text-foreground tracking-tight">Nivaas</span>
            </div>
            <div className="flex items-center gap-1">
              <Link
                href="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome banner */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your organizations below.</p>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {/* Create */}
          <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-primary">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="h-4 w-4" />
              </div>
              <h2 className="font-semibold text-foreground">Create Organization</h2>
            </div>
            <p className="text-sm text-muted-foreground -mt-1">
              Set up a new org and become its admin.
            </p>
            <form onSubmit={handleCreateOrg} className="flex gap-2 mt-auto">
              <input
                type="text"
                required
                placeholder="Organization name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="flex-1 min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
              />
              <button
                type="submit"
                disabled={isCreating}
                className="shrink-0 rounded-xl gradient-primary px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 transition"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
              </button>
            </form>
          </div>

          {/* Join by code */}
          <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <UserPlus className="h-4 w-4" />
              </div>
              <h2 className="font-semibold text-foreground">Join via Code</h2>
            </div>
            <p className="text-sm text-muted-foreground -mt-1">
              Enter an invite code to request membership.
            </p>
            <form onSubmit={handleJoinOrg} className="flex gap-2 mt-auto">
              <input
                type="text"
                required
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="flex-1 min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm uppercase tracking-wider placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
              />
              <button
                type="submit"
                disabled={isJoining}
                className="shrink-0 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60 transition"
              >
                {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
              </button>
            </form>
          </div>

          {/* Search */}
          <div className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-violet-600">
              <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <Search className="h-4 w-4" />
              </div>
              <h2 className="font-semibold text-foreground">Discover</h2>
            </div>
            <p className="text-sm text-muted-foreground -mt-1">
              Search public organizations to join.
            </p>
            <form onSubmit={handleSearchOrg} className="flex gap-2 mt-auto">
              <input
                type="text"
                placeholder="Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="shrink-0 rounded-xl bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60 transition"
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </button>
            </form>
          </div>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="mb-10">
            <h2 className="text-base font-semibold text-foreground mb-3">Discover Organizations</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((org) => {
                const isAlreadyMember = orgs.some((myOrg) => myOrg._id === org._id);
                return (
                  <div
                    key={org._id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-foreground">{org.name}</p>
                    </div>
                    {isAlreadyMember ? (
                      <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">Joined</span>
                    ) : (
                      <button
                        onClick={() => handleJoinById(org._id)}
                        className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                      >
                        Join <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => fetchSearchOrgs(currentPage - 1)}
                  disabled={currentPage === 1 || isSearching}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition"
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </button>
                <span className="text-sm text-muted-foreground">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => fetchSearchOrgs(currentPage + 1)}
                  disabled={currentPage === totalPages || isSearching}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 transition"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Your organizations */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">Your Organizations</h2>
          {orgs.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Building className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No organizations yet</h3>
              <p className="text-sm text-muted-foreground">Create or join one to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {orgs.map((org) => {
                const myMemberData = org.members.find((m) => m.user === user?._id);
                const role = myMemberData?.role || "member";
                const status = myMemberData?.status ?? true;

                return (
                  <Link
                    key={org._id}
                    href={`/org/${org._id}`}
                    className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/40 hover:shadow-md transition-all card-hover"
                  >
                    <div className="h-11 w-11 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">{org.name}</p>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{role}</p>
                    </div>
                    <div className="shrink-0">
                      {status === false ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
