// Thin wrapper around the backend API. Requests go to /api/... on the same
// origin (Vite proxies them in development); set VITE_API_URL to call a
// backend on another origin.
const BASE = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let onUnauthorized = () => {};
/** Called when any request (other than the session check) gets a 401. */
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(method, path, body, { quiet401 = false } = {}) {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      credentials: "include",
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?");
  }
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }
  if (!res.ok) {
    if (res.status === 401 && !quiet401) onUnauthorized();
    throw new ApiError(res.status, json.message || res.statusText || "Request failed", json);
  }
  return json;
}

const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return s ? `?${s}` : "";
};

export const api = {
  // auth
  me: () => request("GET", "/api/auth/me", undefined, { quiet401: true }).then((r) => r.data),
  signIn: (email, password) => request("POST", "/api/auth/signin", { email, password }, { quiet401: true }),
  signUp: (data) => request("POST", "/api/auth/signup", data),
  signOut: () => request("POST", "/api/auth/signout"),

  // organizations
  organizations: () => request("GET", "/api/organization/get-companies").then((r) => r.data),
  createOrganization: (data) => request("POST", "/api/organization/create", data).then((r) => r.data),

  // frameworks
  frameworks: () => request("GET", "/api/framework/get-frameworks").then((r) => r.data),
  createFramework: (data) => request("POST", "/api/framework/create", data),
  reindexFramework: (id) => request("POST", `/api/framework/${id}/index`),

  // products
  products: (company) => request("GET", `/api/product${qs({ company })}`).then((r) => r.data),
  product: (id) => request("GET", `/api/product/${id}`).then((r) => r.data),
  createProduct: (formData) => request("POST", "/api/product/create", formData).then((r) => r.data),
  addEvidence: (id, evidence) => request("POST", `/api/product/${id}/evidence`, { evidence }).then((r) => r.data),
  removeEvidence: (id, evidenceId) =>
    request("DELETE", `/api/product/${id}/evidence/${evidenceId}`).then((r) => r.data),

  // compliance
  analyze: (productId, frameworkIds) =>
    request("POST", `/api/compliance/analyze/${productId}`, frameworkIds?.length ? { frameworkIds } : {}).then(
      (r) => r.data,
    ),
  reports: (productId) => request("GET", `/api/compliance/reports${qs({ productId })}`).then((r) => r.data),
  report: (id) => request("GET", `/api/compliance/reports/${id}`).then((r) => r.data),
};
