// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import { useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from 'react-oidc-context'

import {
	GraphSummary,
	ProbeError,
	UseCaseSummary,
	countAccessRights,
	countGuidelines,
	countOntologies,
	getUseCases,
	summariseUseCaseGraph,
} from '../api/probe'
import { serviceUrls } from '../config/env'

/**
 * The setup steps of the platform, in the order they build on each other.
 *
 * Creating instances is deliberately not one of them: uploading a data model, adding a
 * UseCase and granting permissions prepare the platform to hold data, and once they are
 * done the setup is over. A platform without instances is finished, just empty - so the
 * graph is still read (the start page leads into it per UseCase), but it is never a step.
 */
export type StepId = 'dataModel' | 'useCases' | 'permissions'

/**
 * - `done`        the step is satisfied by data that exists right now
 * - `open`        the service answered and holds nothing yet
 * - `unknown`     not checkable (service not configured, or a prerequisite is missing)
 * - `unreachable` configured but the request failed - a diagnostic, never "empty"
 * - `checking`    a probe is still in flight
 */
export type StepStatusKind = 'done' | 'open' | 'unknown' | 'unreachable' | 'checking'

export type StepStatus = {
	kind: StepStatusKind
	/** One short line rendered next to the badge. */
	detail: string
}

export type PlatformReadiness = {
	statuses: Record<StepId, StepStatus>
	/**
	 * Every setup step is satisfied, so the platform is ready to take data. Says nothing
	 * about whether any data exists yet. Reported as "already set up" rather than as the
	 * user's own progress - on a shared or demo stack it usually was not.
	 */
	isSetupComplete: boolean
	/** The configured use cases, in the order the service returned them. */
	useCases: UseCaseSummary[]
	/**
	 * What each probed use case's graph holds, keyed by use case id. Only the use cases in
	 * `probedUseCaseIds` appear; the rest are deliberately not requested.
	 */
	graphSummaries: Record<string, GraphSummary>
	/** The use cases the graph probe covers - see MAX_USE_CASES_PROBED. */
	probedUseCaseIds: string[]
	/** True while the graph probe has not answered yet. */
	isGraphSummaryPending: boolean
	/** At least one probe is still in flight. */
	isChecking: boolean
	/**
	 * Every step has a verdict. Until then the page must not decide what to render:
	 * "not done yet" and "not checked yet" look identical from the outside, and acting on
	 * the first would flash the checklist before the finished state appears.
	 */
	isSettled: boolean
	/** Re-runs every probe. Nothing is cached as progress, so this is the only "state". */
	refresh: () => void
}

/**
 * The instance graph is addressable per use case only, so it is read through the use cases
 * from step 2 - one request each. The cap keeps the page at a fixed request budget: without
 * it, an installation with fifty use cases would fire fifty graph requests on every mount.
 * Use cases beyond the cap are still listed, just without their counts.
 */
const MAX_USE_CASES_PROBED = 5

/** Probes are cheap but not free; a short stale time keeps navigation snappy. */
const STALE_TIME_MS = 15_000

const QUERY_ROOT = 'homepage-readiness'

const status = (kind: StepStatusKind, detail: string): StepStatus => ({ kind, detail })

const failureDetail = (error: unknown): string =>
	error instanceof ProbeError ? error.shortMessage : 'Service not reachable'

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
	`${count} ${count === 1 ? singular : pluralForm}`

/**
 * Derives the status of every checklist step from the live state of the services.
 *
 * Nothing is persisted: the page recomputes from the services on every mount, so
 * deleting a guideline or wiping a database is reflected immediately and a second person
 * on the same stack never sees a stale "you already did this".
 */
export const usePlatformReadiness = (): PlatformReadiness => {
	const auth = useAuth()
	const queryClient = useQueryClient()
	const token = auth.user?.access_token
	// In the key, not the value: flips false -> true once the shell has a token and makes
	// every probe re-run, instead of leaving a start-up 401 on screen.
	const hasToken = !!token

	const guidelines = useQuery({
		queryKey: [QUERY_ROOT, 'guidelines', hasToken],
		queryFn: ({ signal }) =>
			countGuidelines({ baseUrl: serviceUrls.guideline!, token, signal }),
		enabled: !!serviceUrls.guideline,
		retry: false,
		staleTime: STALE_TIME_MS,
	})

	const ontologies = useQuery({
		queryKey: [QUERY_ROOT, 'ontologies', hasToken],
		queryFn: ({ signal }) => countOntologies({ baseUrl: serviceUrls.ontology!, token, signal }),
		enabled: !!serviceUrls.ontology,
		retry: false,
		staleTime: STALE_TIME_MS,
	})

	const useCases = useQuery({
		queryKey: [QUERY_ROOT, 'usecases', hasToken],
		queryFn: ({ signal }) => getUseCases({ baseUrl: serviceUrls.useCase!, token, signal }),
		enabled: !!serviceUrls.useCase,
		retry: false,
		staleTime: STALE_TIME_MS,
	})

	const accessRights = useQuery({
		queryKey: [QUERY_ROOT, 'accessrights', hasToken],
		queryFn: ({ signal }) => countAccessRights({ baseUrl: serviceUrls.access!, token, signal }),
		enabled: !!serviceUrls.access,
		retry: false,
		staleTime: STALE_TIME_MS,
	})

	const probedUseCaseIds = useMemo(
		() => (useCases.data ?? []).slice(0, MAX_USE_CASES_PROBED).map(useCase => useCase.id),
		[useCases.data]
	)

	const instances = useQuery({
		queryKey: [QUERY_ROOT, 'instances', hasToken, probedUseCaseIds],
		queryFn: async ({ signal }) => {
			const results = await Promise.allSettled(
				probedUseCaseIds.map(id =>
					summariseUseCaseGraph(id, { baseUrl: serviceUrls.instance!, token, signal })
				)
			)

			// Keyed by use case: the start page shows each graph on its own card, so the
			// per-use-case shape is what is needed, not a total.
			const summaries: Record<string, GraphSummary> = {}
			results.forEach((result, index) => {
				if (result.status === 'fulfilled') summaries[probedUseCaseIds[index]] = result.value
			})

			// Every use case failed => report it as unreachable rather than as "no data".
			if (Object.keys(summaries).length === 0) {
				const firstRejection = results.find(
					(result): result is PromiseRejectedResult => result.status === 'rejected'
				)
				throw firstRejection?.reason ??
					new ProbeError('network', 'Instance graph could not be read')
			}

			return summaries
		},
		enabled: !!serviceUrls.instance && probedUseCaseIds.length > 0,
		retry: false,
		staleTime: STALE_TIME_MS,
	})

	const statuses = useMemo<Record<StepId, StepStatus>>(() => {
		// ---- Step 1: data model (guideline + ontology) --------------------------------
		const dataModel = ((): StepStatus => {
			const guidelineConfigured = !!serviceUrls.guideline
			const ontologyConfigured = !!serviceUrls.ontology

			if (!guidelineConfigured && !ontologyConfigured)
				return status('unknown', 'Guideline and Ontology service not configured')

			if (guidelines.error)
				return status('unreachable', `Guideline service: ${failureDetail(guidelines.error)}`)
			if (ontologies.error)
				return status('unreachable', `Ontology service: ${failureDetail(ontologies.error)}`)

			if (guidelines.isPending && guidelineConfigured) return status('checking', 'Checking…')
			if (ontologies.isPending && ontologyConfigured) return status('checking', 'Checking…')

			const guidelineCount = guidelines.data
			const ontologyCount = ontologies.data

			if (guidelineCount === undefined)
				return status(
					'unknown',
					`Guideline service not configured; ${plural(ontologyCount ?? 0, 'ontology', 'ontologies')}`
				)
			if (ontologyCount === undefined)
				return status(
					'unknown',
					`Ontology service not configured; ${plural(guidelineCount, 'guideline')}`
				)

			if (guidelineCount > 0 && ontologyCount > 0)
				return status(
					'done',
					`${plural(guidelineCount, 'guideline')}, ${plural(ontologyCount, 'ontology', 'ontologies')}`
				)
			if (guidelineCount === 0 && ontologyCount === 0)
				return status('open', 'No guideline and no ontology yet')
			return guidelineCount === 0
				? status('open', 'Ontology present, guideline missing')
				: status('open', 'Guideline present, ontology missing')
		})()

		// ---- Step 2: use cases ---------------------------------------------------------
		const useCasesStatus = ((): StepStatus => {
			if (!serviceUrls.useCase) return status('unknown', 'UseCase service not configured')
			if (useCases.error)
				return status('unreachable', `UseCase service: ${failureDetail(useCases.error)}`)
			if (useCases.isPending) return status('checking', 'Checking…')

			const count = useCases.data?.length ?? 0
			return count > 0
				? status('done', plural(count, 'UseCase'))
				: status('open', 'No UseCase yet')
		})()

		// ---- Step 3: permissions -------------------------------------------------------
		const permissions = ((): StepStatus => {
			if (!serviceUrls.access) return status('unknown', 'Access service not configured')
			if (accessRights.error)
				return status('unreachable', `Access service: ${failureDetail(accessRights.error)}`)
			if (accessRights.isPending) return status('checking', 'Checking…')

			const count = accessRights.data ?? 0
			return count > 0
				? status('done', plural(count, 'access right'))
				: status('open', 'No access right configured yet')
		})()

		return { dataModel, useCases: useCasesStatus, permissions }
	}, [
		guidelines.data,
		guidelines.error,
		guidelines.isPending,
		ontologies.data,
		ontologies.error,
		ontologies.isPending,
		useCases.data,
		useCases.error,
		useCases.isPending,
		accessRights.data,
		accessRights.error,
		accessRights.isPending,
	])

	const refresh = useCallback(() => {
		void queryClient.invalidateQueries({ queryKey: [QUERY_ROOT] })
	}, [queryClient])

	const stepStatuses = Object.values(statuses)

	const isSetupChecking = stepStatuses.some(step => step.kind === 'checking')

	// A disabled query reports isPending forever, so the fetch status has to be checked as
	// well - otherwise a card would show "reading" for a request that never starts.
	const isGraphSummaryPending = instances.isPending && instances.fetchStatus !== 'idle'

	return {
		statuses,
		isSetupComplete: stepStatuses.every(step => step.kind === 'done'),
		useCases: useCases.data ?? [],
		graphSummaries: instances.data ?? {},
		probedUseCaseIds,
		isGraphSummaryPending,
		// Counts the graph probe too, so the refresh button keeps spinning while the cards
		// are still filling in.
		isChecking: isSetupChecking || isGraphSummaryPending,
		// Deliberately not waiting for the graph probe: what it returns decides how the
		// cards look, never whether the setup is done, and the cards carry their own
		// loading state. Waiting for it would delay the whole page for nothing.
		isSettled: !isSetupChecking,
		refresh,
	}
}
