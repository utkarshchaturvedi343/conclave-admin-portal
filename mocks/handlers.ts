// mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // ---------------------------
  // LOGIN
  // ---------------------------
  http.post("http://127.0.0.1:8000/admin/login", async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const username = params.get("username");
    const password = params.get("password");

    if (username === "admin" && password === "admin") {
      return HttpResponse.json(
        { message: "Login success" },
        {
          status: 200,
          headers: {
            // mock cookie
            // "Set-Cookie": "sessionid=mock-session-token; Path=/;",
            "Set-Cookie": "sessionid=mock-super; Path=/;",
          },
        }
      );
    }

    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  // ---------------------------
  // LOGOUT
  // ---------------------------
  http.post("http://127.0.0.1:8000/admin/logout", () => {
    return HttpResponse.json(
      { ok: true },
      {
        status: 200,
        headers: {
          // expire cookie
          "Set-Cookie": "sessionid=; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        },
      }
    );
  }),

  // ---------------------------
  // GET NEWS LIST
  // ---------------------------
  http.get("http://127.0.0.1:8000/admin/news", () => {
    return HttpResponse.json([
      { id: 1, content: "Mocked News 1", created_at: "2025-01-01T10:20:00", status: true },
      { id: 2, content: "Mocked News 2", created_at: "2025-01-02T11:35:00", status: false },
    ]);
  }),

  // ---------------------------
  // ADD NEWS
  // ---------------------------
  http.post("http://127.0.0.1:8000/admin/news/add", async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const content = params.get("content") || "";

    return HttpResponse.json({
      id: Math.floor(Math.random() * 10000),
      content,
      created_at: new Date().toISOString(),
    });
  }),

  // ---------------------------
  // DELETE NEWS
  // ---------------------------
  http.post("http://127.0.0.1:8000/admin/news/delete/:id", () => {
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),

  // ...existing handlers

  // USERS LIST
  http.get("http://127.0.0.1:8000/admin/users", () => {
    return HttpResponse.json([
      { id: 1, pf_id: 1234567, name: "Nithin", department: "Innovation Hub", location: "Belapur", mobile: 9876543210, status: true },
      { id: 2, pf_id: 1088599, name: "Anurag", department: "IT Innovation", location: "Belapur", mobile: 9123456789, status: false },
    ]);
  }),

  // ADD USER
  http.post("http://127.0.0.1:8000/admin/users/add", async ({ request }) => {
    const txt = await request.text();
    const params = new URLSearchParams(txt);
    const pf_id = params.get("pf_id") || "";
    const name = params.get("name") || "";
    return HttpResponse.json({
      id: Math.floor(Math.random() * 10000),
      pf_id,
      name,
      department: params.get("department") || "",
      location: params.get("location") || "",
      mobile: params.get("mobile") || "",
      registered: "Yes",
    });
  }),

  // UPLOAD CSV
  http.post("http://127.0.0.1:8000/admin/users/upload_csv", async ({ request }) => {
    // We cannot read multi-part form easily, just return success and maybe echo filename
    return HttpResponse.json({ ok: true, message: "CSV processed (mock)", imported: 3 });
  }),
];



// inside mocks/handlers.ts (merge into handlers array)



// ---------------------------
// VIDEOS (mock storage)
// ---------------------------
let mockVideos = [
  {
    id: 1,
    title: "Welcome to Conclave",
    speaker: "Nithin",
    category: "Onboarding",
    url: "https://example.com/video1",
    status: true, // approved
  },
  {
    id: 2,
    title: "Innovation Hub Tour",
    speaker: "Anurag",
    category: "Innovation",
    url: "https://example.com/video2",
    status: false, // pending
  },
];

// ---------------------------
// GET VIDEOS LIST
// ---------------------------
handlers.push(
  http.get("http://127.0.0.1:8000/admin/videos", () => {
    return HttpResponse.json(mockVideos);
  })
);

// ---------------------------
// ADD VIDEO
// matches addVideo() which sends JSON
// ---------------------------
handlers.push(
  http.post("http://127.0.0.1:8000/admin/videos/add", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;

    const newVideo = {
      id: Math.floor(Math.random() * 100000),
      title: body.title || "",
      speaker: body.speaker || "",
      category: body.category || "",
      url: body.url || "",
      // new videos start as pending
      status: false,
    };

    mockVideos.push(newVideo);

    return HttpResponse.json(newVideo, { status: 201 });
  })
);

// ---------------------------
// UPDATE VIDEO STATUS (TOGGLE)
// matches updateVideoStatus(id) which sends JSON { id }
// backend "negates" current status
// ---------------------------
handlers.push(
  http.post(
    "http://127.0.0.1:8000/admin/videos/updateStatus",
    async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as any;
      const id = Number(body.id);

      if (!id) {
        return HttpResponse.json(
          { error: "Missing or invalid id" },
          { status: 400 }
        );
      }

      const idx = mockVideos.findIndex((v) => v.id === id);
      if (idx === -1) {
        return HttpResponse.json({ error: "Video not found" }, { status: 404 });
      }

      // TOGGLE (negate) status here
      mockVideos[idx] = {
        ...mockVideos[idx],
        status: !mockVideos[idx].status,
      };

      return HttpResponse.json(mockVideos[idx], { status: 200 });
    }
  )
);

// ---------------------------
// PRODUCTS MOCK STORAGE
// ---------------------------
let mockProducts = [
  {
    id: 1,
    name: "YONO SBI",
    image_url: "https://placehold.co/80x60",
    attachment_url: "https://example.com/yono.pdf",
    created_at: "2025-10-31T10:19:31",
    status: true,
  },
  {
    id: 2,
    name: "SBI Gold Loan",
    image_url: "https://placehold.co/80x60",
    attachment_url: "https://example.com/gold.pdf",
    created_at: "2025-11-02T12:45:00",
    status: false,
  },
];

// GET PRODUCTS
handlers.push(
  http.get("http://127.0.0.1:8000/admin/products", () => {
    return HttpResponse.json(mockProducts);
  })
);

// ADD PRODUCT (FormData)
handlers.push(
  http.post("http://127.0.0.1:8000/admin/products/add", async ({ request }) => {
    const fd = await request.formData();
    const name = fd.get("name")?.toString() || "";

    const img = fd.get("image") as File | null;
    const att = fd.get("attachment") as File | null;

    const newProduct = {
      id: Math.floor(Math.random() * 10000),
      name,
      image_url: img ? URL.createObjectURL(img) : "",
      attachment_url: att ? URL.createObjectURL(att) : "",
      created_at: new Date().toISOString(),
      status: false, // start as pending
    };

    mockProducts.push(newProduct);

    return HttpResponse.json(newProduct, { status: 201 });
  })
);

// UPDATE STATUS (toggle)
handlers.push(
  http.post("http://127.0.0.1:8000/admin/products/updateStatus", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;
    const id = Number(body?.id ?? NaN);

    if (!id || isNaN(id)) {
      return HttpResponse.json({ error: "Missing or invalid id" }, { status: 400 });
    }

    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }

    mockProducts[idx].status = !mockProducts[idx].status;
    return HttpResponse.json(mockProducts[idx], { status: 200 });
  })
);
