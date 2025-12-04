// mocks/handlers.ts
import { stat } from "fs";
import { http, HttpResponse } from "msw";

// ---------------------------
// Mock Data
// ---------------------------

let mockAgendas = [
  {
    id: 1,
    title: "Digital Transformation Workshop",
    description: "Exploring digital journeys in banking.",
    datetime: "2025-11-18T10:00:00",
    location: "Conference Room A",
    image_url: "https://placehold.co/80x60",
    status: true,
  },
  {
    id: 2,
    title: "AI in Banking",
    description: "AI use-cases and demos.",
    datetime: "2025-11-19T11:30:00",
    location: "Conference Room B",
    image_url: "https://placehold.co/80x60",
    status: false,
  },
];

let mockNews = [
  {
    id: 1,
    content: `Mocked News 1`,
    created_at: "2025-01-01T10:20:00",
    status: true,
  },
  {
    id: 2,
    content: "Mocked News 2",
    created_at: "2025-01-02T11:35:00",
    status: false,
  },
];

let mockUsers = [
  {
    id: 1,
    pf_id: 1234567,
    name: "Nithin",
    department: "Innovation Hub",
    location: "Belapur",
    mobile: 9876543210,
    status: true,
  },
  {
    id: 2,
    pf_id: 1088599,
    name: "Anurag",
    department: "IT Innovation",
    location: "Belapur",
    mobile: 9123456789,
    status: false,
  },
];

let mockVideos = [
  {
    id: 1,
    title: "Welcome to Conclave",
    speaker: "Nithin",
    category: "Onboarding",
    // ⚠️ IMPORTANT: use a real HTTP URL or a /public path, not H:\...
    // If you put video in /public/videos/intro.mp4, then use:
    // url: "/videos/intro.mp4",
    url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    status: true, // approved
  },
  {
    id: 2,
    title: "Innovation Hub Tour",
    speaker: "Anurag",
    category: "Innovation",
    // You can keep this YouTube URL if sometimes you use iframe for YouTube
    url: "https://www.youtube.com/watch?v=-YlmnPh-6rE&list=RD-YlmnPh-6rE&start_radio=1",
    status: false, // pending
  },
];

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

// ---------------------------
// Handlers
// ---------------------------

export const handlers = [
  // LOGIN
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
            "Set-Cookie": "sessionid=mock-super; Path=/;",
          },
        }
      );
    }

    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  // LOGOUT
  http.post("http://127.0.0.1:8000/admin/logout", () => {
    return HttpResponse.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "Set-Cookie": "sessionid=; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
        },
      }
    );
  }),

  // ---------------------------
  // NEWS
  // ---------------------------

  // GET NEWS LIST
  http.get("http://127.0.0.1:8000/admin/news", () => {
    return HttpResponse.json(mockNews);
  }),

  // ADD NEWS
  http.post("http://127.0.0.1:8000/admin/news/add", async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);

    const content = params.get("content") || "";

    const newItem = {
      id: Math.floor(Math.random() * 10000),
      content,
      created_at: new Date().toISOString(),
      status: false,
    };

    mockNews.push(newItem);

    return HttpResponse.json(newItem, { status: 201 });
  }),

  // DELETE NEWS
  http.post(
    "http://127.0.0.1:8000/admin/news/delete/:id",
    async ({ params }) => {
      const id = Number((params as any).id);
      if (!id) {
        return HttpResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      mockNews = mockNews.filter((n) => n.id !== id);
      return HttpResponse.json({ ok: true }, { status: 200 });
    }
  ),

  // ---------------------------
  // USERS
  // ---------------------------

  // USERS LIST
  http.get("http://127.0.0.1:8000/admin/users", () => {
    return HttpResponse.json(mockUsers);
  }),

  // ADD USER
  http.post("http://127.0.0.1:8000/admin/users/add", async ({ request }) => {
    const txt = await request.text();
    const params = new URLSearchParams(txt);

    const newUser = {
      id: Math.floor(Math.random() * 10000),
      pf_id: Number(params.get("pf_id") || 0),
      name: params.get("name") || "",
      department: params.get("department") || "",
      location: params.get("location") || "",
      mobile: Number(params.get("mobile") || 0),
      status: false,
    };

    mockUsers.push(newUser);

    return HttpResponse.json(newUser, { status: 201 });
  }),

  // UPLOAD CSV
  http.post(
    "http://127.0.0.1:8000/admin/users/upload_csv",
    async () => {
      // Just return success (mock)
      return HttpResponse.json(
        { ok: true, message: "CSV processed (mock)", imported: 3 },
        { status: 200 }
      );
    }
  ),

  // ---------------------------
  // VIDEOS
  // ---------------------------

  // GET VIDEOS LIST
  http.get("http://127.0.0.1:8000/admin/videos", () => {
    return HttpResponse.json(mockVideos);
  }),

  // ADD VIDEO (expects JSON: { title, speaker, category, url })
  http.post("http://127.0.0.1:8000/admin/videos/add", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as any;

    const newVideo = {
      id: Math.floor(Math.random() * 100000),
      title: body.title || "",
      speaker: body.speaker || "",
      category: body.category || "",
      url: body.url || "", // e.g. "/videos/intro.mp4" or "https://..."
      status: false, // new videos start as pending
    };

    mockVideos.push(newVideo);

    return HttpResponse.json(newVideo, { status: 201 });
  }),

  // UPDATE VIDEO STATUS (TOGGLE)
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

      mockVideos[idx] = {
        ...mockVideos[idx],
        status: !mockVideos[idx].status,
      };

      return HttpResponse.json(mockVideos[idx], { status: 200 });
    }
  ),

  // ---------------------------
  // PRODUCTS
  // ---------------------------

  // GET PRODUCTS
  http.get("http://127.0.0.1:8000/admin/products", () => {
    return HttpResponse.json(mockProducts);
  }),

  // ADD PRODUCT (FormData)
  http.post(
    "http://127.0.0.1:8000/admin/products/add",
    async ({ request }) => {
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
    }
  ),

  // UPDATE PRODUCT STATUS (toggle)
  http.post(
    "http://127.0.0.1:8000/admin/products/updateStatus",
    async ({ request }) => {
      const body = (await request.json().catch(() => ({}))) as any;
      const id = Number(body?.id ?? NaN);

      if (!id || isNaN(id)) {
        return HttpResponse.json(
          { error: "Missing or invalid id" },
          { status: 400 }
        );
      }

      const idx = mockProducts.findIndex((p) => p.id === id);
      if (idx === -1) {
        return HttpResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      mockProducts[idx].status = !mockProducts[idx].status;

      return HttpResponse.json(mockProducts[idx], { status: 200 });
    }
  ),




  // ---------------------------
  // AGENDAS
  // ---------------------------

  // GET AGENDAS
  http.get("http://127.0.0.1:8000/admin/agendas", () => {
    return HttpResponse.json(mockAgendas);
  }),

  // ADD AGENDA (FormData)
  http.post(
    "http://127.0.0.1:8000/admin/agendas/add",
    async ({ request }) => {
      const fd = await request.formData();

      const title = fd.get("title")?.toString() || "";
      const description = fd.get("description")?.toString() || "";
      const datetime = fd.get("datetime")?.toString() || "";
      const location = fd.get("location")?.toString() || "";
      const img = fd.get("image") as File | null;

      const newAgenda = {
        id: Math.floor(Math.random() * 10000),
        title,
        description,
        datetime,
        location,
        image_url: img ? URL.createObjectURL(img) : "",
        status: false, // start as inactive
      };

      mockAgendas.push(newAgenda);

      return HttpResponse.json(newAgenda, { status: 201 });
    }
  ),

  // DELETE AGENDA
  http.post(
    "http://127.0.0.1:8000/admin/agendas/delete/:id",
    async ({ params }) => {
      const id = Number((params as any).id);
      if (!id) {
        return HttpResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      mockAgendas = mockAgendas.filter((a) => a.id !== id);
      return HttpResponse.json({ ok: true }, { status: 200 });
    }
  ),

  http.get("http://127.0.0.1:8000/menu/appconfig", () => {
    const mockTabs = [
      { key: "agendas", label: "Agenda List" },
      { key: "products", label: "Product Items" },
      { key: "news", label: "Latest News" },
      { key: "videos", label: "Video Library" },
      { key: "users", label: "User Management" },
      { key: "feedback", label: "Feedback Center" },
    ];

    return HttpResponse.json({ tabs: mockTabs });
  })
];