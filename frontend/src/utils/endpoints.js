export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },
  CUSTOMERS: {
    LIST: "/customers",
    DETAIL: (id) => `/customers/${id}`,
    CREATE: "/customers",
    UPDATE: (id) => `/customers/${id}`,
    DELETE: (id) => `/customers/${id}`,
  },
  MEDICAL_RECORDS: {
    LIST: "/medical-records",
    CREATE: "/medical-records",
    UPDATE: (id) => `/medical-records/${id}`,
    DELETE: (id) => `/medical-records/${id}`,
  },
  CATEGORIES: {
    LIST: "/categories",
    CREATE: "/categories",
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },
  TREATMENTS: {
    LIST: "/treatments",
    DETAIL: (id) => `/treatments/${id}`,
    CREATE: "/treatments",
    UPDATE: (id) => `/treatments/${id}`,
    DELETE: (id) => `/treatments/${id}`,
  },
  BOOKINGS: {
    LIST: "/bookings",
    DETAIL: (id) => `/bookings/${id}`,
    CREATE: "/bookings",
    UPDATE: (id) => `/bookings/${id}`,
    DELETE: (id) => `/bookings/${id}`,
    SETTLE_PAYMENT: (id) => `/bookings/${id}/settle-payment`,
  },
  EXPENSES: {
    LIST: "/expenses",
    CREATE: "/expenses",
    UPDATE: (id) => `/expenses/${id}`,
    DELETE: (id) => `/expenses/${id}`,
  },
  REPORTS: {
    DASHBOARD: "/reports/dashboard",
    MONTHLY_FINANCIAL: "/reports/monthly-financial",
  },
  SETTINGS: {
    GET: "/settings",
    UPDATE: "/settings",
  },
  UPLOAD: "/upload",
};
