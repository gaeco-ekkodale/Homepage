// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import { useEffect, useState } from 'react'
import { CircularProgress } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

import StepRow, { Step } from '../components/StepRow'
import Dashboard from '../components/Dashboard'
import DemoDataHint from '../components/DemoDataHint'
import SetupCompleteDialog from '../components/SetupCompleteDialog'
import { StepId, usePlatformReadiness } from '../hooks/usePlatformReadiness'
import { useSetupAcknowledged } from '../hooks/useSetupAcknowledged'
import { demoDataEnabled, moduleRoutes } from '../config/env'

/**
 * The setup order of the platform. Each step builds on the one before it, which is why
 * the order is spelled out here instead of being left to the app menu.
 *
 * Creating instances is not on this list. The three steps below prepare the platform to
 * hold data; putting data in is the everyday work that follows, and the start page leads
 * into it per UseCase once the setup is done.
 */
const STEPS: Array<Step & { id: StepId }> = [
	{
		id: 'dataModel',
		index: 1,
		title: 'Define your data model',
		what: 'Upload a guideline (classifications and their properties) and an ontology (allowed relationships).',
		cta: 'Platform Config',
		route: moduleRoutes.platformConfig,
	},
	{
		id: 'useCases',
		index: 2,
		title: 'Create a UseCase',
		what: 'A context in which data is viewed and edited. Permissions and data both hang off it.',
		cta: 'UseCases',
		route: moduleRoutes.useCase,
	},
	{
		id: 'permissions',
		index: 3,
		title: 'Assign permissions',
		what: 'Per UseCase and user group, set read and write access down to the single property.',
		cta: 'Access Rights',
		route: moduleRoutes.access,
	},
]

const HomePage = () => {
	const {
		statuses,
		isSetupComplete,
		useCases,
		graphSummaries,
		probedUseCaseIds,
		isGraphSummaryPending,
		isChecking,
		isSettled,
		refresh,
	} = usePlatformReadiness()
	const { acknowledged, acknowledge, reset } = useSetupAcknowledged()
	const [hasSettledOnce, setHasSettledOnce] = useState(false)
	// The user asked to see the checklist again although the setup is finished. Kept in
	// component state on purpose: revisiting is a one-off look, not a preference, so a
	// reload lands on the start page again rather than on a checklist with nothing to do.
	const [isChecklistRequested, setIsChecklistRequested] = useState(false)

	useEffect(() => {
		if (isSettled) setHasSettledOnce(true)
	}, [isSettled])

	// A step the services answered for and that genuinely holds nothing. Deliberately not
	// "anything other than done": an unreachable or uncheckable step says nothing about the
	// setup, and treating it as undone would re-arm the dialog on every network blip.
	const hasOpenStep = STEPS.some(step => statuses[step.id].kind === 'open')

	// Re-arm the completion dialog once the platform is demonstrably not set up any more, so
	// that finishing the setup always ends with it - not only the very first time.
	// Gated on isSettled: while probes are in flight nothing is decided yet.
	useEffect(() => {
		if (isSettled && hasOpenStep && acknowledged) reset()
	}, [isSettled, hasOpenStep, acknowledged, reset])

	const doneCount = STEPS.filter(step => statuses[step.id].kind === 'done').length
	const progressPercent = Math.round((doneCount / STEPS.length) * 100)

	// Hold everything back until the first round of probes has a verdict. Rendering the
	// checklist while steps are still "checking" would show it for a few frames and then
	// replace it with the finished state - visible as a flicker on every reload.
	if (!hasSettledOnce) {
		return (
			<div className='flex min-h-full w-full items-center justify-center bg-slate-50'>
				<CircularProgress />
			</div>
		)
	}

	// The setup is finished and confirmed, so the checklist has nothing left to say and the
	// page turns into an entry point to the data instead - unless it was asked for again.
	const isSetupFinished = isSetupComplete && acknowledged

	if (isSetupFinished && !isChecklistRequested) {
		return (
			<Dashboard
				useCases={useCases}
				graphSummaries={graphSummaries}
				probedUseCaseIds={probedUseCaseIds}
				isGraphSummaryPending={isGraphSummaryPending}
				statuses={statuses}
				isChecking={isChecking}
				refresh={refresh}
				onShowChecklist={() => setIsChecklistRequested(true)}
			/>
		)
	}

	return (
		// The typography is pinned here on purpose. This page renders inside the shell
		// alongside other micro-frontends, each of which ships its own global CSS reset
		// (Tailwind preflight, MUI CssBaseline). Inheriting the base font or size would
		// make the layout shift depending on which module was opened before.
		//
		// min-h-full fills everything below the nav bar: the shell hands the plugin a
		// flex-1 container inside a screen-height column, so 100% resolves - and min-,
		// not fixed height, lets a long checklist keep growing into the container's scroll.
		<div className='box-border min-h-full w-full bg-slate-50 font-sans text-base leading-normal text-slate-900 antialiased'>
			<SetupCompleteDialog open={isSetupComplete && !acknowledged} onAcknowledge={acknowledge} />

			<div className='mx-auto max-w-4xl px-6 py-10'>
				{/* Wraps instead of switching direction at a breakpoint. A base utility
				    overridden by a responsive variant (flex-col + sm:flex-row) is not safe
				    here: every micro-frontend ships its own Tailwind build, and one loaded
				    later redefines the plain utility while not containing the variant, so
				    the breakpoint stops working. Single-direction + flex-wrap has nothing
				    to override, and reacts to the actual available width. */}
				<header className='flex flex-wrap items-start justify-between gap-4'>
					<div className='min-w-60 flex-1'>
						<h1 className='text-3xl leading-tight font-bold tracking-tight text-slate-900'>
							{isSetupFinished ? 'Setup checklist' : 'Welcome to gaeco'}
						</h1>
						<p className='mt-2 max-w-2xl text-sm text-slate-600'>
							{isSetupFinished
								? 'The three steps that prepare this platform, and what each of them holds right now.'
								: 'gaeco manages building and process information as a connected graph. Three steps prepare an empty platform to take your data — they build on each other.'}
						</p>
					</div>
					<div className='flex shrink-0 flex-wrap gap-2'>
						{/* Only offered on a revisit - while the setup is unfinished there is no
						    start page to go back to, the checklist is it. */}
						{isSetupFinished && (
							<button
								type='button'
								onClick={() => setIsChecklistRequested(false)}
								className='inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'
							>
								<ArrowBackRoundedIcon fontSize='small' aria-hidden='true' />
								Start page
							</button>
						)}
						<button
							type='button'
							onClick={refresh}
							className='inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100'
						>
							<RefreshRoundedIcon
								fontSize='small'
								className={isChecking ? 'animate-spin' : undefined}
								aria-hidden='true'
							/>
							{isChecking ? 'Checking…' : 'Re-check'}
						</button>
					</div>
				</header>

				{/* ---- The checklist ------------------------------------------------ */}
				<section className='mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
					<div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-3'>
						<h2 className='text-sm font-semibold tracking-wide text-slate-700 uppercase'>
							Setup checklist
						</h2>
						<div className='flex items-center gap-3'>
							<span className='text-xs font-medium text-slate-500'>
								{doneCount} of {STEPS.length} done
							</span>
							<div
								className='h-1.5 w-28 overflow-hidden rounded-full bg-slate-200'
								role='progressbar'
								aria-valuenow={doneCount}
								aria-valuemin={0}
								aria-valuemax={STEPS.length}
							>
								<div
									className='h-full rounded-full bg-emerald-500 transition-all duration-500'
									style={{ width: `${progressPercent}%` }}
								/>
							</div>
						</div>
					</div>

					<ol className='list-none'>
						{STEPS.map((step, position) => (
							<StepRow
								key={step.id}
								step={step}
								status={statuses[step.id]}
								isLast={position === STEPS.length - 1}
							/>
						))}
					</ol>
				</section>

					{/* Not on a revisit: the hint offers the demo data "instead of doing the steps
					    by hand", which makes no sense once they are all done. */}
					{demoDataEnabled && !isSetupFinished && <DemoDataHint />}
			</div>
		</div>
	)
}

export default HomePage
