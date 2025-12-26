import { Link } from "@tanstack/react-router";
import { Tally4 } from "lucide-react";

export function BrandLogo() {
	return (
		<Link to="/" className="flex items-center gap-2 group outline-none">
			<Tally4 className="text-primary size-6" />
			<span className="hidden sm:flex md:hidden lg:flex">Boring Status</span>
		</Link>
	);
}
