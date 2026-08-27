import axios from "axios";

export const apiClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add interceptors for token handling or global error toasts here
// apiClient.interceptors.response.use(res => res, error => { ... });

export const API_URLS = {
  auth: {
    me: "/api/auth/me",
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
  },
  org: {
    list: "/api/organizations",
    search: (query: string, page: number) => `/api/organizations/search?q=${encodeURIComponent(query)}&page=${page}&limit=10`,
    create: "/api/organizations",
    join: "/api/organizations/join",
    get: (orgId: string) => `/api/organizations/${orgId}`,
    updateSettings: (orgId: string) => `/api/organizations/${orgId}`,
    dashboard: (orgId: string) => `/api/organizations/${orgId}/dashboard`,
  },
  members: {
    update: (orgId: string, userId: string) => `/api/organizations/${orgId}/members/${userId}`,
    add: (orgId: string) => `/api/organizations/${orgId}/members/add`,
  },
  tiffins: {
    get: (orgId: string, date: string) => `/api/organizations/${orgId}/tiffins?date=${date}`,
    update: (orgId: string) => `/api/organizations/${orgId}/tiffins`,
  },
  bills: {
    get: (orgId: string, periodName: string) => `/api/organizations/${orgId}/bills?periodName=${periodName}`,
    generate: (orgId: string) => `/api/organizations/${orgId}/bills/generate`,
    updateStatus: (orgId: string, billId: string) => `/api/organizations/${orgId}/bills/${billId}`,
    updateCharges: (orgId: string, billId: string) => `/api/organizations/${orgId}/bills/${billId}`,
  },
  rentals: {
    list: (orgId: string) => `/api/organizations/${orgId}/rentals`,
    create: (orgId: string) => `/api/organizations/${orgId}/rentals`,
    assign: (orgId: string, unitId: string) => `/api/organizations/${orgId}/rentals/${unitId}`,
    remove: (orgId: string, unitId: string) => `/api/organizations/${orgId}/rentals/${unitId}`,
    delete: (orgId: string, unitId: string) => `/api/organizations/${orgId}/rentals/${unitId}`,
  },
};

export const api = {
  auth: {
    me: () => apiClient.get(API_URLS.auth.me).then((res) => res.data),
    login: (data: unknown) => apiClient.post(API_URLS.auth.login, data).then((res) => res.data),
    register: (data: unknown) => apiClient.post(API_URLS.auth.register, data).then((res) => res.data),
    logout: () => apiClient.post(API_URLS.auth.logout).then((res) => res.data),
  },
  org: {
    list: () => apiClient.get(API_URLS.org.list).then((res) => res.data),
    search: (query: string, page: number) => apiClient.get(API_URLS.org.search(query, page)).then((res) => res.data),
    create: (data: unknown) => apiClient.post(API_URLS.org.create, data).then((res) => res.data),
    join: (data: unknown) => apiClient.post(API_URLS.org.join, data).then((res) => res.data),
    get: (orgId: string) => apiClient.get(API_URLS.org.get(orgId)).then((res) => res.data),
    updateSettings: (orgId: string, data: unknown) => apiClient.put(API_URLS.org.updateSettings(orgId), data).then((res) => res.data),
    dashboard: (orgId: string) => apiClient.get(API_URLS.org.dashboard(orgId)).then((res) => res.data),
  },
  members: {
    update: (orgId: string, userId: string, data: unknown) => apiClient.put(API_URLS.members.update(orgId, userId), data).then((res) => res.data),
    add: (orgId: string, data: unknown) => apiClient.post(API_URLS.members.add(orgId), data).then((res) => res.data),
  },
  tiffins: {
    get: (orgId: string, date: string) => apiClient.get(API_URLS.tiffins.get(orgId, date)).then((res) => res.data),
    update: (orgId: string, data: unknown) => apiClient.put(API_URLS.tiffins.update(orgId), data).then((res) => res.data),
  },
  bills: {
    get: (orgId: string, periodName: string) => apiClient.get(API_URLS.bills.get(orgId, periodName)).then((res) => res.data),
    generate: (orgId: string, data: unknown) => apiClient.post(API_URLS.bills.generate(orgId), data).then((res) => res.data),
    updateStatus: (orgId: string, billId: string, data: unknown) => apiClient.patch(API_URLS.bills.updateStatus(orgId, billId), data).then((res) => res.data),
    updateCharges: (orgId: string, billId: string, data: unknown) => apiClient.patch(API_URLS.bills.updateCharges(orgId, billId), data).then((res) => res.data),
  },
  rentals: {
    list: (orgId: string) => apiClient.get(API_URLS.rentals.list(orgId)).then((res) => res.data),
    create: (orgId: string, data: unknown) => apiClient.post(API_URLS.rentals.create(orgId), data).then((res) => res.data),
    assign: (orgId: string, unitId: string, data: unknown) => apiClient.patch(API_URLS.rentals.assign(orgId, unitId), data).then((res) => res.data),
    remove: (orgId: string, unitId: string, data: unknown) => apiClient.patch(API_URLS.rentals.remove(orgId, unitId), data).then((res) => res.data),
    delete: (orgId: string, unitId: string) => apiClient.delete(API_URLS.rentals.delete(orgId, unitId)).then((res) => res.data),
  },
};
