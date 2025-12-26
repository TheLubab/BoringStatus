import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { Link, useRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { authClient } from "./lib/auth/auth-client";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60,
		},
	},
});

export function Providers({ children }: { children: ReactNode }) {
	const router = useRouter();

	return (
		<QueryClientProvider client={queryClient}>
			<AuthQueryProvider>
				<AuthUIProviderTanstack
					authClient={authClient}
					navigate={(href) => router.navigate({ href })}
					replace={(href) => router.navigate({ href, replace: true })}
					Link={({ href, ...props }) => <Link to={href} {...props} />}
					social={{
						providers: ["github", "google"],
					}}
					passkey={false}
					redirectTo="/monitors"
					organization={true}
				>
					{children}
				</AuthUIProviderTanstack>
			</AuthQueryProvider>
		</QueryClientProvider>
	);
}
