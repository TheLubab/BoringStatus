import { Plus, X } from "lucide-react";
import { useFieldArray, useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { InsertMonitor } from "@/modules/monitors/monitors.zod";

const METRICS = [
    { value: "status", label: "Status", httpOnly: false, proOnly: false },
    { value: "response_time", label: "Response Time", httpOnly: false, proOnly: false },
    { value: "body", label: "Response Body", httpOnly: true, proOnly: true },
    { value: "ssl_days", label: "SSL Expiry", httpOnly: true, proOnly: true },
] as const;

const OPERATORS = [
    { value: "eq", label: "is" },
    { value: "neq", label: "is not" },
    { value: "gt", label: "above" },
    { value: "lt", label: "below" },
    { value: "contains", label: "contains" },
    { value: "not_contains", label: "not contains" },
] as const;

const STATUS_VALUES = [
    { value: "up", label: "Up" },
    { value: "down", label: "Down" },
] as const;

interface MonitorAlertRulesProps {
    maxRules?: number;
    allowBodyRules?: boolean;
    allowSslRules?: boolean;
    description?: string;
}

export function MonitorAlertRules({
    maxRules = 10,
    allowBodyRules = false,
    allowSslRules = false,
    description = "Define conditions that will trigger an alert",
}: MonitorAlertRulesProps) {
    const form = useFormContext<InsertMonitor>();
    const type = useWatch({ control: form.control, name: "type" });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "alertRules",
    });

    const canAddMore = maxRules === undefined || fields.length < maxRules;
    const rulesRemaining =
        maxRules !== undefined ? maxRules - fields.length : undefined;

    const getValidOperators = (metric: string) => {
        if (metric === "status") {
            return OPERATORS.filter((op) => ["eq", "neq"].includes(op.value));
        }
        if (metric === "response_time" || metric === "ssl_days") {
            return OPERATORS.filter((op) => ["gt", "lt"].includes(op.value));
        }
        if (metric === "body") {
            return OPERATORS.filter((op) =>
                ["contains", "not_contains"].includes(op.value),
            );
        }
        return OPERATORS;
    };

    const getDefaultValue = (metric: string) => {
        if (metric === "status") return "up";
        if (metric === "response_time") return "1000";
        if (metric === "ssl_days") return "30";
        if (metric === "body") return "";
        return "";
    };

    const getDefaultOperator = (metric: string) => {
        if (metric === "status") return "neq";
        if (metric === "response_time") return "gt";
        if (metric === "ssl_days") return "lt";
        if (metric === "body") return "contains";
        return "eq";
    };

    const getAvailableMetrics = () => {
        let metrics = METRICS.map((m) => ({
            ...m,
            disabled: false,
            showPro: false,
        }));

        // Filter by monitor type (completely hide non-http metrics for non-http monitors)
        if (type !== "http") {
            metrics = metrics.filter((m) => !m.httpOnly);
        }

        // Mark Pro features as disabled with label
        return metrics.map((m) => {
            if (m.value === "body" && !allowBodyRules) {
                return { ...m, disabled: true, showPro: true };
            }
            if (m.value === "ssl_days" && !allowSslRules) {
                return { ...m, disabled: true, showPro: true };
            }
            return m;
        });
    };

    const handleAddRule = () => {
        if (!canAddMore) return;

        append({
            metric: "status",
            operator: "neq",
            value: "up",
        });
    };

    return (
        <div className="space-y-2 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <FormLabel>Alert Rules</FormLabel>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddRule}
                    disabled={!canAddMore}
                >
                    <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
            </div>

            <FormDescription>
                {description}
                {maxRules !== undefined && (
                    <span className="text-muted-foreground"> (max {maxRules})</span>
                )}
            </FormDescription>

            {/* Show form-level error for alertRules */}
            <FormField
                control={form.control}
                name="alertRules"
                render={() => <FormMessage />}
            />

            {fields.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                    No alert rules configured
                </div>
            ) : (
                <div className="space-y-4">
                    {fields.map((field, index) => {
                        const currentMetric = form.watch(`alertRules.${index}.metric`);
                        const validOperators = getValidOperators(currentMetric);

                        return (
                            <div
                                key={field.id}
                                className="flex flex-col sm:flex-row gap-2 sm:items-center animate-in fade-in"
                            >
                                {/* Metric */}
                                <FormField
                                    control={form.control}
                                    name={`alertRules.${index}.metric`}
                                    render={({ field }) => (
                                        <FormItem className="sm:w-36">
                                            <Select
                                                value={field.value}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    form.setValue(
                                                        `alertRules.${index}.operator`,
                                                        getDefaultOperator(value),
                                                        { shouldValidate: true, shouldDirty: true },
                                                    );
                                                    form.setValue(
                                                        `alertRules.${index}.value`,
                                                        getDefaultValue(value),
                                                        { shouldValidate: true, shouldDirty: true },
                                                    );
                                                }}
                                            >
                                                <FormControl>
                                                    <SelectTrigger size="sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {getAvailableMetrics().map((m) => (
                                                        <SelectItem
                                                            key={m.value}
                                                            value={m.value}
                                                            disabled={m.disabled}
                                                        >
                                                            {m.label}
                                                            {m.showPro && (
                                                                <span className="ml-1 text-xs text-muted-foreground">
                                                                    (Pro)
                                                                </span>
                                                            )}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Operator */}
                                <FormField
                                    control={form.control}
                                    name={`alertRules.${index}.operator`}
                                    render={({ field }) => (
                                        <FormItem className="sm:w-32">
                                            <Select
                                                value={field.value}
                                                onValueChange={field.onChange}
                                            >
                                                <FormControl>
                                                    <SelectTrigger size="sm">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {validOperators.map((op) => (
                                                        <SelectItem key={op.value} value={op.value}>
                                                            {op.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Value */}
                                <FormField
                                    control={form.control}
                                    name={`alertRules.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormControl>
                                                {currentMetric === "status" ? (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger size="sm">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {STATUS_VALUES.map((s) => (
                                                                <SelectItem key={s.value} value={s.value}>
                                                                    {s.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : currentMetric === "body" ? (
                                                    <Input
                                                        {...field}
                                                        placeholder="keyword"
                                                        className="h-8 text-sm"
                                                    />
                                                ) : (
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        placeholder={
                                                            currentMetric === "response_time" ? "ms" : "days"
                                                        }
                                                        className="h-8 font-mono text-sm"
                                                    />
                                                )}
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Remove */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 self-end sm:self-auto"
                                    onClick={() => remove(index)}
                                >
                                    <X className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
