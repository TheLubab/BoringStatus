import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function slugify(input: string): string {
	return input
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

export function randomStr(length = 6) {
	return Math.random().toString(36).slice(2, 2 + length)
}

export function truncate(str: string, maxLength: number) {
	return str.length > maxLength
		? str.slice(0, maxLength - 1) + "…"
		: str;
}
