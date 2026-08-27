"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { LogOut, User as UserIcon, Plus, UserPlus, Building, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";

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
        toast.success("Join request sent successfully!");
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
        toast.success("Join request sent successfully!");
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="shrink-0 flex items-center">
              <span className="font-bold text-xl text-blue-600">Nivaas</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="text-gray-600 hover:text-gray-900 flex items-center space-x-1"
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:inline-block">Profile</span>
              </Link>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-red-600 flex items-center space-x-1"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden sm:inline-block">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Organizations
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                Create Organization
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Create a new organization to manage your tiffins and rentals as an admin.
              </p>
            </div>
            <form onSubmit={handleCreateOrg} className="mt-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Organization Name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70 shrink-0"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-green-600" />
                Join Organization
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Join an existing organization as a customer using an invite code.
              </p>
            </div>
            <form onSubmit={handleJoinOrg} className="mt-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Invite Code (e.g. A1B2C3)"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 uppercase"
                />
                <button
                  type="submit"
                  disabled={isJoining}
                  className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-70 shrink-0"
                >
                  {isJoining ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <Search className="h-5 w-5 mr-2 text-indigo-600" />
                Search Organizations
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Find organizations to join by name.
              </p>
            </div>
            <form onSubmit={handleSearchOrg} className="mt-auto">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Organization Name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 shrink-0"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Explore Organizations</h2>
          {searchResults.length === 0 ? (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No organizations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search query.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((org) => {
                  const isAlreadyMember = orgs.some((myOrg) => myOrg._id === org._id);
                  
                  return (
                    <div
                      key={org._id}
                      className="relative flex items-center justify-between rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {org.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{org.name}</p>
                        </div>
                      </div>
                      <div>
                        {isAlreadyMember ? (
                          <span className="text-xs text-gray-500 font-medium">Joined / Pending</span>
                        ) : (
                          <button
                            onClick={() => handleJoinById(org._id)}
                            className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                          >
                            Join
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => fetchSearchOrgs(currentPage - 1)}
                    disabled={currentPage === 1 || isSearching}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => fetchSearchOrgs(currentPage + 1)}
                    disabled={currentPage === totalPages || isSearching}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Your Organizations</h2>
        
        {orgs.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <Building className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No organizations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new organization or joining an existing one.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orgs.map((org) => {
              const myMemberData = org.members.find((m) => m.user === user?._id);
              const role = myMemberData?.role || "member";
              const status = myMemberData?.status ?? true;
              
              return (
                <Link
                  key={org._id}
                  href={`/org/${org._id}`}
                  className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:border-gray-400 transition-colors"
                >
                  <div className="shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">{org.name}</p>
                    <p className="truncate text-sm text-gray-500 capitalize">
                      Role: {role}
                    </p>
                  </div>
                  <div>
                    {status === false ? (
                      <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                        Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Active
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
