export const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const ENDPOINTS = {
    LOGIN: "/admin/login",
    LOGOUT: "/admin/logout",
    NEWS_LIST: "/admin/news",
    NEWS_ADD: "/admin/news/add",
    NEWS_DELETE: (id: number | string) => `/admin/news/delete/${id}`,
    NEWS_UPDATE_STATUS: "/admin/news/updateStatus",
    USERS_LIST: "/admin/users",
    USERS_ADD: "/admin/users/add",
    USERS_UPLOAD_CSV: "/admin/users/upload_csv",
    USERS_UPDATE_STATUS: "/admin/users/updateStatus",
    VIDEO_LIST: "/admin/videos",
    VIDEO_ADD: "/admin/videos/add",
    VIDEO_UPDATE_STATUS: "/admin/videos/updateStatus",
    PRODUCTS_LIST: "/admin/products",
    PRODUCTS_ADD: "/admin/products/add",
    PRODUCTS_UPDATE_STATUS: "/admin/products/updateStatus",
};

export async function apiRequest(path: string, options: RequestInit = {}) {
    const url = `${API_BASE}${path}`;

    const req: RequestInit = {
        credentials: "include",
        mode: "cors",
        ...options,
    };

    const res = await fetch(url, req);

    if ((res.status === 401 || res.status === 403) && path !== ENDPOINTS.LOGIN) {
        const maybeText = await res.text().catch(() => "");
        if (typeof window !== "undefined") {
            window.location.href = "/admin/login";
        }
        const err = new Error(maybeText || `Unauthorized (${res.status})`);
        (err as any).status = res.status;
        throw err;
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const error = new Error(text || `HTTP ${res.status}`);
        (error as any).status = res.status;
        throw error;
    }

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && (data.error || data.errors || data.success === false)) {
            const msg =
                data.error ||
                (Array.isArray(data.errors) ? data.errors.join(", ") : JSON.stringify(data.errors));
            const err = new Error(msg || "Server returned error payload");
            (err as any).status = res.status;
            throw err;
        }
        return data;
    }

    return res.text();
}

export async function loginForm(username: string, password: string) {
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const result = await apiRequest(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    return result;
}

export async function logout() {
    // call the endpoint; apiRequest will throw on errors and redirect on 401/403 (not expected)
    return apiRequest(ENDPOINTS.LOGOUT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
}

export async function getNews() {
    return apiRequest(ENDPOINTS.NEWS_LIST, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
}

// export async function addNews(content: string) {
//     const body = new URLSearchParams();
//     body.append("content", content);

//     return apiRequest(ENDPOINTS.NEWS_ADD, {
//         method: "POST",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: body.toString(),
//     });
// }

export async function addNews(content: string) {
    return apiRequest(ENDPOINTS.NEWS_ADD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });
}

export async function deleteNews(id: number) {
    return apiRequest(ENDPOINTS.NEWS_DELETE(id), {
        method: "POST",
    });
}

export async function updateNewsStatus(id: number) {
    return apiRequest(ENDPOINTS.NEWS_UPDATE_STATUS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
    });
}

export async function getUsers() {
    return apiRequest(ENDPOINTS.USERS_LIST, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
}

export async function addUser(payload: {
    pf_id?: number;
    name?: string;
    department?: string;
    location?: string;
    mobile?: number;
}) {
    return apiRequest(ENDPOINTS.USERS_ADD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function uploadUsersCSV(file: File) {
    // If backend expects form-data:
    const form = new FormData();
    form.append("file", file);

    return apiRequest(ENDPOINTS.USERS_UPLOAD_CSV, {
        method: "POST",
        body: form,
        // DO NOT set Content-Type manually when sending FormData — the browser will set boundary
    });
}

export async function updateUserStatus(id: number) {
    return apiRequest(ENDPOINTS.USERS_UPDATE_STATUS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
    });
}

export async function getVideos() {
    return apiRequest(ENDPOINTS.VIDEO_LIST, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
}

export async function addVideo(payload: {
    title: string;
    speaker?: string;
    category?: string;
    url: string;
}) {
    return apiRequest(ENDPOINTS.VIDEO_ADD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
}

export async function updateVideoStatus(id: number) {
    return apiRequest(ENDPOINTS.VIDEO_UPDATE_STATUS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
    });
}

export async function getProducts() {
    return apiRequest(ENDPOINTS.PRODUCTS_LIST, {
        method: "GET",
        headers: { Accept: "application/json" },
    });
}

export async function addProduct(form: FormData) {
    return apiRequest(ENDPOINTS.PRODUCTS_ADD, {
        method: "POST",
        body: form,
    });
}

export async function updateProductStatus(id: number) {
    return apiRequest(ENDPOINTS.PRODUCTS_UPDATE_STATUS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
    });
}