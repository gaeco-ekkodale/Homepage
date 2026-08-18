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
 * Minimal read-only probe client.
 *
 * The checklist performs exactly one GET per service and needs to tell three outcomes
 * apart: "reachable and empty", "reachable and populated", and "not reachable". The
 * generated OpenAPI clients used elsewhere in the platform cannot express the last case
 * cleanly (they assume a configured base URL and collapse every failure into ApiError),
 * so the probes are hand-written and deliberately tiny.
 */

/** Why a probe failed. Kept separate from "empty" on purpose - see ProbeError.reason. */
export type ProbeFailureReason = 'network' | 'unauthorized' | 'http' | 'malformed'

export class ProbeError extends Error {
	readonly reason: ProbeFailureReason
	readonly status?: number

	constructor(reason: ProbeFailureReason, message: string, status?: number) {
		super(message)
		this.name = 'ProbeError'
		this.reason = reason
		this.status = status
	}

	/** Short, user-facing explanation shown on the affected step. */
	get shortMessage(): string {
		switch (this.reason) {
			case 'network':
				return 'Service not reachable'
			case 'unauthorized':
				return 'Not authorized for this service'
			case 'malformed':
				return 'Unexpected response from service'
			case 'http':
				return `Service returned HTTP ${this.status ?? '?'}`
		}
	}
}

/** GETs a JSON document, translating every failure mode into a ProbeError. */
const getJson = async (
	baseUrl: string,
	path: string,
	token: string | undefined,
	signal?: AbortSignal
): Promise<unknown> => {
	let response: Response
	try {
		response = await fetch(`${baseUrl}${path}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			signal,
		})
	} catch (error) {
		// Connection refused, DNS failure, CORS rejection, ...
		throw new ProbeError('network', (error as Error)?.message ?? 'Request failed')
	}

	if (response.status === 401 || response.status === 403) {
		throw new ProbeError('unauthorized', 'Authentication rejected', response.status)
	}
	if (!response.ok) {
		throw new ProbeError('http', `HTTP ${response.status}`, response.status)
	}

	try {
		return await response.json()
	} catch {
		throw new ProbeError('malformed', 'Response was not valid JSON')
	}
}

/** GETs a JSON array and returns its length. Anything else is a malformed response. */
const countArray = async (
	baseUrl: string,
	path: string,
	token: string | undefined,
	signal?: AbortSignal
): Promise<number> => {
	const payload = await getJson(baseUrl, path, token, signal)
	if (!Array.isArray(payload)) {
		throw new ProbeError('malformed', 'Expected a JSON array')
	}
	return payload.length
}

export type ProbeArgs = {
	baseUrl: string
	token: string | undefined
	signal?: AbortSignal
}

/** Step 1 - number of uploaded guidelines (GuidelineService). */
export const countGuidelines = ({ baseUrl, token, signal }: ProbeArgs): Promise<number> =>
	countArray(baseUrl, '/guidelines', token, signal)

/** Step 1 - number of uploaded ontologies (OntologyService). */
export const countOntologies = ({ baseUrl, token, signal }: ProbeArgs): Promise<number> =>
	countArray(baseUrl, '/Ontologies', token, signal)

/** Step 3 - number of configured access rights (AccessService). */
export const countAccessRights = ({ baseUrl, token, signal }: ProbeArgs): Promise<number> =>
	countArray(baseUrl, '/api/AccessRights', token, signal)

export type UseCaseSummary = {
	id: string
	/** Empty when the service returned no name; the dashboard falls back to the id. */
	name: string
	description: string
}

/**
 * Step 2 - the configured use cases (UseCaseService).
 *
 * Ids feed the instance probe; name and description are what the dashboard shows. Entries
 * without a usable id are dropped rather than rendered as a card that cannot be opened.
 */
export const getUseCases = async ({
	baseUrl,
	token,
	signal,
}: ProbeArgs): Promise<UseCaseSummary[]> => {
	const payload = await getJson(baseUrl, '/api/UseCases', token, signal)
	if (!Array.isArray(payload)) {
		throw new ProbeError('malformed', 'Expected a JSON array')
	}
	const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

	return payload
		.map(entry => entry as { id?: unknown; name?: unknown; description?: unknown })
		.filter(entry => typeof entry?.id === 'string' && entry.id.length > 0)
		.map(entry => ({
			id: entry.id as string,
			name: asText(entry.name),
			description: asText(entry.description),
		}))
}

/** How many instances of one classification a use case's graph holds. */
export type ClassificationCount = { name: string; count: number }

/**
 * What one use case's graph contains. Everything here comes out of a single request, so
 * the dashboard costs no more than the plain instance count the checklist already needed.
 */
export type GraphSummary = {
	instanceCount: number
	relationCount: number
	/** Descending by count. Not truncated here - the view decides how many to show. */
	classifications: ClassificationCount[]
}

/** Classification of an instance the service did not name. */
const UNNAMED_CLASSIFICATION = 'Unclassified'

/**
 * What one use case's graph holds. Not part of the setup - this is the content the start
 * page leads into once the three setup steps are done.
 *
 * The instance graph is only addressable per use case (`GET /{useCaseId}/Instances/graph`),
 * which is why this probe depends on the use case list.
 */
export const summariseUseCaseGraph = async (
	useCaseId: string,
	{ baseUrl, token, signal }: ProbeArgs
): Promise<GraphSummary> => {
	const payload = await getJson(
		baseUrl,
		`/${encodeURIComponent(useCaseId)}/Instances/graph`,
		token,
		signal
	)
	const instances = (payload as { instances?: unknown })?.instances
	if (!Array.isArray(instances)) {
		throw new ProbeError('malformed', 'Graph response contained no instance list')
	}
	// A graph with nodes but no relations is normal, so a missing list is not an error here.
	const relations = (payload as { relations?: unknown })?.relations
	const relationCount = Array.isArray(relations) ? relations.length : 0

	const countsByClassification = new Map<string, number>()
	for (const instance of instances) {
		const rawName = (instance as { classificationName?: unknown })?.classificationName
		const name =
			typeof rawName === 'string' && rawName.trim().length > 0
				? rawName.trim()
				: UNNAMED_CLASSIFICATION
		countsByClassification.set(name, (countsByClassification.get(name) ?? 0) + 1)
	}

	const classifications = [...countsByClassification.entries()]
		.map(([name, count]) => ({ name, count }))
		.sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))

	return { instanceCount: instances.length, relationCount, classifications }
}
