import { ExternalLink } from "lucide-react";

interface MonitorNameCellProps {
	name: string;
	url: string;
}

export const MonitorNameCell = ({ name, url }: MonitorNameCellProps) => {
	let link: URL | undefined;
	try {
		link = new URL(url);
	} catch {}

	const displayUrl = url.length > 40 ? `${url.slice(0, 38)}…` : url;

	return (
		<div className="flex flex-col gap-0.5 min-w-0">
			<span className="font-semibold text-[12px] text-foreground tracking-tight leading-none truncate">
				{name}
			</span>
			{link ? (
				<a
					href={link.toString()}
					target="_blank"
					rel="noopener noreferrer nofollow"
					onClick={(e) => e.stopPropagation()}
					title={url}
					className="group/link inline-flex items-center gap-1 text-[9px] font-mono text-muted-foreground/50 hover:text-primary transition-colors duration-100 w-fit leading-none max-w-full"
				>
					<span className="truncate">{displayUrl}</span>
					<ExternalLink className="size-2.5 shrink-0 opacity-0 group-hover/link:opacity-60 transition-opacity" />
				</a>
			) : (
				<span
					className="text-[9px] font-mono text-muted-foreground/50 leading-none truncate"
					title={url}
				>
					{displayUrl}
				</span>
			)}
		</div>
	);
};
