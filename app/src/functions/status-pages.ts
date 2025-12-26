import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ----------------------------------------------------------------------
// MOCK DATA STORE
// ----------------------------------------------------------------------
let MOCK_PAGES = [
    {
        id: "mock-page-1",
        userId: "mock-user-1",
        name: "Main Production Status",
        slug: "status",
        description: "Official status page for our main services.",
        customDomain: "status.example.com",
        isPrivate: false,
        themeColor: "#000000",
        createdAt: new Date(),
        updatedAt: new Date(),
        monitors: [
            { monitorId: "monitor-1", monitor: { id: "monitor-1", name: "API Server", status: "up" } },
            { monitorId: "monitor-2", monitor: { id: "monitor-2", name: "Database", status: "up" } },
        ],
    },
    {
        id: "mock-page-2",
        userId: "mock-user-1",
        name: "Internal Tools",
        slug: "internal",
        description: "Status of internal developer tools.",
        customDomain: null,
        isPrivate: true,
        password: "secretpassword",
        themeColor: "#3b82f6",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        updatedAt: new Date(),
        monitors: [],
    },
];

// ----------------------------------------------------------------------
// GET ALL STATUS PAGES
// ----------------------------------------------------------------------
export const getStatusPages = createServerFn({ method: "GET" }).handler(
    async () => {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return MOCK_PAGES.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description,
            createdAt: p.createdAt,
        }));
    },
);

// ----------------------------------------------------------------------
// CREATE STATUS PAGE
// ----------------------------------------------------------------------
const CreateStatusPageSchema = z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    monitorIds: z.array(z.string()).optional(),
    // New fields
    customDomain: z.string().optional(),
    isPrivate: z.boolean().default(false),
    password: z.string().optional(),
    themeColor: z.string().optional(),
    customCss: z.string().optional(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
});

export const createStatusPage = createServerFn({ method: "POST" })
    .inputValidator((data: z.infer<typeof CreateStatusPageSchema>) => data)
    .handler(async ({ data }) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const newPage = {
            id: `mock-page-${Date.now()}`,
            userId: "mock-user-1",
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            customDomain: data.customDomain || null,
            isPrivate: data.isPrivate || false,
            password: data.password || null,
            themeColor: data.themeColor || "#000000",
            createdAt: new Date(),
            updatedAt: new Date(),
            monitors: (data.monitorIds || []).map((id) => ({
                monitorId: id,
                monitor: { id, name: "Mock Monitor", status: "up" }, // Simplified for mock
            })),
        };
        MOCK_PAGES.push(newPage);
        return newPage;
    });

// ----------------------------------------------------------------------
// GET STATUS PAGE (BY ID)
// ----------------------------------------------------------------------
export const getStatusPage = createServerFn({ method: "GET" })
    .inputValidator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const page = MOCK_PAGES.find((p) => p.id === data.id);
        if (!page) return null;
        return page;
    });

// ----------------------------------------------------------------------
// DELETE STATUS PAGE
// ----------------------------------------------------------------------
export const deleteStatusPage = createServerFn({ method: "POST" })
    .inputValidator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        MOCK_PAGES = MOCK_PAGES.filter((p) => p.id !== data.id);
        return { success: true };
    });

// ----------------------------------------------------------------------
// UPDATE STATUS PAGE
// ----------------------------------------------------------------------
const UpdateStatusPageSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional(),
    monitorIds: z.array(z.string()).optional(),
    // New Fields
    customDomain: z.string().optional(),
    isPrivate: z.boolean().default(false),
    password: z.string().optional(),
    themeColor: z.string().optional(),
    customCss: z.string().optional(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
});

export const updateStatusPage = createServerFn({ method: "POST" })
    .inputValidator((data: z.infer<typeof UpdateStatusPageSchema>) => data)
    .handler(async ({ data }) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const pageIndex = MOCK_PAGES.findIndex((p) => p.id === data.id);
        if (pageIndex === -1) throw new Error("Not found");

        const updatedPage = {
            ...MOCK_PAGES[pageIndex],
            ...data,
            updatedAt: new Date(),
            monitors: (data.monitorIds || []).map((id) => ({
                monitorId: id,
                monitor: { id, name: "Mock Monitor", status: "up" },
            })),
        };

        MOCK_PAGES[pageIndex] = updatedPage;
        return updatedPage;
    });

// ----------------------------------------------------------------------
// GET MOCK MONITORS (FOR DEMO)
// ----------------------------------------------------------------------
export const getMockMonitors = createServerFn({ method: "GET" }).handler(
    async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return [
            { id: "monitor-1", name: "API Server", status: "up" },
            { id: "monitor-2", name: "Database", status: "up" },
            { id: "monitor-3", name: "Redis Cache", status: "down" },
            { id: "monitor-4", name: "Frontend", status: "up" },
        ];
    },
);

// ----------------------------------------------------------------------
// GET PUBLIC STATUS PAGE (BY SLUG)
// ----------------------------------------------------------------------
export const getPublicStatusPage = createServerFn({ method: "GET" })
    .inputValidator((data: { slug: string }) => data)
    .handler(async ({ data }) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const page = MOCK_PAGES.find(p => p.slug === data.slug);

        if (!page) return null;

        // In a real app, we would NOT return sensitive settings like config or password here
        // But for mock/demo simplicity we return mostly everything needed for rendering
        return {
            id: page.id,
            name: page.name,
            description: page.description,
            themeColor: page.themeColor,
            isPrivate: page.isPrivate,
            // Don't return password
            monitors: page.monitors,
            updatedAt: page.updatedAt,
        };
    });
