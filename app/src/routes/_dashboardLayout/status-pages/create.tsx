import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createStatusPage, getMockMonitors } from "@/functions/status-pages";
import { StatusPageForm } from "@/components/status-pages/status-page-form";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_dashboardLayout/status-pages/create")({
    component: StatusPageCreate,
    loader: async () => {
        const monitors = await getMockMonitors();
        return { monitors };
    },
});

function StatusPageCreate() {
    const { monitors } = Route.useLoaderData();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await createStatusPage({ data });
            toast.success("Status page created successfully");
            router.navigate({ to: "/status-pages" });
        } catch (error) {
            console.error("Failed to create status page:", error);
            toast.error("Failed to create status page");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                        <Link to="/status-pages">
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <span className="text-sm">Back to Status Pages</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                    Create Status Page
                </h1>
                <p className="text-sm text-muted-foreground">
                    Configure your public status page.
                </p>
            </div>

            <StatusPageForm
                monitors={monitors}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
