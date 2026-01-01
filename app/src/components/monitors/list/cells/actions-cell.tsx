import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardMonitor } from "@/modules/monitors/monitors.zod";

interface ActionsCellProps {
    monitor: DashboardMonitor;
    onViewDetails?: (monitor: DashboardMonitor) => void;
}

export const ActionsCell = ({ monitor, onViewDetails }: ActionsCellProps) => (
    <div className="flex justify-end">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="size-6 p-0 text-muted-foreground/40 hover:text-foreground transition-colors duration-75"
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="size-3" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                    onClick={() => onViewDetails?.(monitor)}
                    className="text-[11px]"
                >
                    View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[11px]">
                    Pause Monitor
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive text-[11px]">
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);
