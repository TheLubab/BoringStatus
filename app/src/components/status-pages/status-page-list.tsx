import { Link } from "@tanstack/react-router";
import { ExternalLink, MoreVertical, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteStatusPage } from "@/functions/status-pages"; // Import the delete function
import { useRouter } from "@tanstack/react-router";

interface StatusPageListProps {
    statusPages: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        createdAt: Date | null;
    }[];
}

export function StatusPageList({ statusPages }: StatusPageListProps) {
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this status page?")) {
            await deleteStatusPage({ data: { id } });
            router.invalidate();
        }
    };

    if (statusPages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No status pages yet</h3>
                <p className="mt-2 mb-4 text-sm text-muted-foreground">
                    Create a status page to show off your reliability.
                </p>
                <Button asChild>
                    <Link to="/status-pages/create">Create Status Page</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {statusPages.map((page) => (
                <div
                    key={page.id}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:bg-muted/50"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-semibold leading-none tracking-tight">
                                {page.name}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {page.description || "No description"}
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <span className="sr-only">Open menu</span>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                    <Link to={`/status-pages/${page.id}`}>Edit</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(page.id)}
                                >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                                /{page.slug}
                            </span>
                        </div>
                        <Button variant="outline" size="sm" asChild className="gap-2">
                            <a
                                href={`http://localhost:3000/status/${page.slug}`} // TODO: Dynamic host
                                target="_blank"
                                rel="noreferrer"
                            >
                                View
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
}
