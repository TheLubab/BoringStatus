import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProLock } from "@/components/ui/pro-lock";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const statusPageSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
    description: z.string().optional(),
    monitorIds: z.array(z.string()).optional(),
    customDomain: z.string().optional(),
    isPrivate: z.boolean().default(false),
    password: z.string().optional(),
    themeColor: z.string().optional(),
    logoUrl: z.string().optional(),
});

type StatusPageFormValues = z.infer<typeof statusPageSchema>;

interface StatusPageFormProps {
    initialData?: StatusPageFormValues & { id?: string };
    monitors: { id: string; name: string }[];
    onSubmit: (data: StatusPageFormValues) => Promise<void>;
    isSubmitting?: boolean;
}

// MOCK PRO STATUS
const IS_PRO = false; // Toggle this to test Pro/Free states

export function StatusPageForm({
    initialData,
    monitors,
    onSubmit,
    isSubmitting,
}: StatusPageFormProps) {
    const form = useForm<StatusPageFormValues>({
        resolver: zodResolver(statusPageSchema),
        defaultValues: {
            name: initialData?.name || "",
            slug: initialData?.slug || "",
            description: initialData?.description || "",
            monitorIds: initialData?.monitorIds || [],
            customDomain: initialData?.customDomain || "",
            isPrivate: initialData?.isPrivate || false,
            password: initialData?.password || "",
            themeColor: initialData?.themeColor || "#000000",
            logoUrl: initialData?.logoUrl || "",
        },
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto bg-transparent mb-6">
                        <TabsTrigger
                            value="general"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                        >
                            General
                        </TabsTrigger>
                        <TabsTrigger
                            value="monitors"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                        >
                            Monitors
                        </TabsTrigger>
                        <TabsTrigger
                            value="customization"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                        >
                            Customization
                        </TabsTrigger>
                        <TabsTrigger
                            value="access"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
                        >
                            Access Control
                        </TabsTrigger>
                    </TabsList>

                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="space-y-6">
                        <div className="grid gap-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Status Page" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            The public name of your status page.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Slug</FormLabel>
                                        <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-input">
                                            <span className="flex select-none items-center pl-3 text-muted-foreground sm:text-sm">
                                                status.boringstatus.com/
                                            </span>
                                            <Input
                                                placeholder="my-company"
                                                className="border-0 bg-transparent pl-1 focus-visible:ring-0 shadow-none"
                                                {...field}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Optional description of this status page..."
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </TabsContent>

                    {/* MONITORS TAB */}
                    <TabsContent value="monitors" className="space-y-6">
                        <FormField
                            control={form.control}
                            name="monitorIds"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel className="text-base">Select Monitors</FormLabel>
                                        <FormDescription>
                                            Choose which monitors to display on this status page.
                                        </FormDescription>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {monitors.map((monitor) => (
                                            <FormField
                                                key={monitor.id}
                                                control={form.control}
                                                name="monitorIds"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={monitor.id}
                                                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-card"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(monitor.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...(field.value || []), monitor.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== monitor.id,
                                                                                ),
                                                                            );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <div className="space-y-1 leading-none">
                                                                <FormLabel className="text-sm font-normal cursor-pointer">
                                                                    {monitor.name}
                                                                </FormLabel>
                                                            </div>
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </TabsContent>

                    {/* CUSTOMIZATION TAB */}
                    <TabsContent value="customization" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Calculated Fields</CardTitle>
                                <CardDescription>Basic customization included in all plans.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="logoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Logo URL</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://..." {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Link to your company logo (PNG/SVG).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card className={!IS_PRO ? "border-indigo-500/20 bg-indigo-50/5" : ""}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Branding & Domains</CardTitle>
                                        <CardDescription>Advanced customization for your brand.</CardDescription>
                                    </div>
                                    {!IS_PRO && <ProLock isLocked={true} label="PRO"><div /></ProLock>}
                                    {/* Just badge if locking handled by wrap, but here we wrap fields */}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ProLock isLocked={!IS_PRO}>
                                    <FormField
                                        control={form.control}
                                        name="customDomain"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Custom Domain</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="status.mycompany.com" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Use your own domain instead of boringstatus.com.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </ProLock>

                                <ProLock isLocked={!IS_PRO}>
                                    <div className="flex flex-col gap-2">
                                        <FormField
                                            control={form.control}
                                            name="themeColor"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Theme Color</FormLabel>
                                                    <div className="flex gap-2">
                                                        <FormControl>
                                                            <Input type="color" className="w-12 p-1 h-10" {...field} />
                                                        </FormControl>
                                                        <FormControl>
                                                            <Input placeholder="#000000" {...field} />
                                                        </FormControl>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </ProLock>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ACCESS TAB */}
                    <TabsContent value="access" className="space-y-6">
                        <Card className={!IS_PRO ? "border-indigo-500/20 bg-indigo-50/5" : ""}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Private Status Pages</CardTitle>
                                        <CardDescription>Restrict access to your status page.</CardDescription>
                                    </div>
                                    {!IS_PRO && <ProLock isLocked={true} label="PRO"><div /></ProLock>}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ProLock isLocked={!IS_PRO}>
                                    <FormField
                                        control={form.control}
                                        name="isPrivate"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Password Protection
                                                    </FormLabel>
                                                    <FormDescription>
                                                        Require a password to view this page.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Checkbox
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </ProLock>

                                {form.watch("isPrivate") && (
                                    <ProLock isLocked={!IS_PRO}>
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input type="password" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </ProLock>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>

                <div className="flex justify-end gap-x-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Status Page"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
