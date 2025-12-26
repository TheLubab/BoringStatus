import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getMockMonitors, getStatusPage, updateStatusPage } from "@/functions/status-pages";
import { StatusPageForm } from "@/components/status-pages/status-page-form";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_dashboardLayout/status-pages/$statusPageId")(
    {
        component: StatusPageEdit,
        loader: async ({ params }) => {
            const [statusPage, monitors] = await Promise.all([
                getStatusPage({ data: { id: params.statusPageId } }),
                getMockMonitors(),
            ]);

            if (!statusPage) {
                throw new Error("Status page not found");
            }

            return { statusPage, monitors };
        },
    },
);

function StatusPageEdit() {
    const { statusPage, monitors } = Route.useLoaderData();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await updateStatusPage({
                data: {
                    ...data,
                    id: statusPage.id,
                },
            });
            toast.success("Status page updated successfully");
            router.navigate({ to: "/status-pages" });
        } catch (error) {
            console.error("Failed to update status page:", error);
            toast.error("Failed to update status page");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Transform statusPage.monitors relation to array of IDs
    const initialData = {
        ...statusPage,
        monitorIds: statusPage.monitors.map((m: any) => m.monitorId),
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
                    Edit Status Page
                </h1>
                <p className="text-sm text-muted-foreground">
                    Update your status page configuration.
                </p>
            </div>

            <StatusPageForm
                initialData={initialData}
                monitors={monitors}
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
