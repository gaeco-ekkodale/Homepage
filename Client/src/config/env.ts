// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

/**
 * Central, defensive access to the build-time environment.
 *
 * Two things make a naive `import.meta.env.VITE_X` unsafe here:
 *
 * 1. In production builds every VITE_ key is replaced by the literal string
 *    `VITE_X_PLACEHOLDER` (see vite.config.ts). The Docker entrypoint rewrites those
 *    placeholders at container start - but only for variables that are actually set.
 *    An unset variable therefore survives into the running app as the placeholder text,
 *    not as `undefined`.
 * 2. The start page must stay useful with zero configuration, so "not configured" has to
 *    be a first-class, detectable state rather than a crash or a bogus URL.
 */

/** Reads a VITE_ variable, returning undefined for anything that is not a real value. */
const readEnv = (raw: string | undefined): string | undefined => {
	const value = raw?.trim()
	if (!value) return undefined
	// Unreplaced production placeholder => the variable was not provided.
	if (value.endsWith('_PLACEHOLDER')) return undefined
	if (value === 'undefined' || value === 'null') return undefined
	return value
}

/** Reads a base URL and strips the trailing slash so paths can be appended verbatim. */
const readBaseUrl = (raw: string | undefined): string | undefined => {
	const value = readEnv(raw)
	if (!value) return undefined
	// A hostname without scheme would silently resolve relative to the shell.
	if (!/^https?:\/\//i.test(value)) return undefined
	return value.replace(/\/+$/, '')
}

/** Reads a route, guaranteeing a leading slash, or undefined when not configured. */
const readRoute = (raw: string | undefined, fallback: string): string => {
	const value = readEnv(raw) ?? fallback
	return value.startsWith('/') ? value : `/${value}`
}

/** Base URLs of the services whose live state the checklist is derived from. */
export const serviceUrls = {
	guideline: readBaseUrl(import.meta.env.VITE_GUIDELINE_API_URL),
	ontology: readBaseUrl(import.meta.env.VITE_ONTOLOGY_API_URL),
	useCase: readBaseUrl(import.meta.env.VITE_USECASE_API_URL),
	access: readBaseUrl(import.meta.env.VITE_ACCESS_API_URL),
	instance: readBaseUrl(import.meta.env.VITE_INSTANCE_API_URL),
} as const

/** Routes the steps link to. Defaults match the platform's standard mount routes. */
export const moduleRoutes = {
	platformConfig: readRoute(import.meta.env.VITE_PLATFORMCONFIG_ROUTE, '/platform-config'),
	useCase: readRoute(import.meta.env.VITE_USECASE_ROUTE, '/usecase'),
	access: readRoute(import.meta.env.VITE_ACCESS_ROUTE, '/access'),
	instance: readRoute(import.meta.env.VITE_INSTANCE_ROUTE, '/instance'),
} as const

/**
 * Demo data is only ever loaded on a local machine, so the affordance is opt-in and
 * must not render at all otherwise.
 */
export const demoDataEnabled: boolean =
	readEnv(import.meta.env.VITE_ENABLE_DEMO_DATA)?.toLowerCase() === 'true'
