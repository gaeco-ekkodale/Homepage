// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import { Link } from 'react-router-dom'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

import UseCaseCard from './UseCaseCard'
import WelcomeView from './WelcomeView'
import { GraphSummary, UseCaseSummary } from '../api/probe'
import { StepId, StepStatus } from '../hooks/usePlatformReadiness'
import { moduleRoutes } from '../config/env'

export type DashboardProps = {
	useCases: UseCaseSummary[]
	graphSummaries: Record<string, GraphSummary>
	/** Which use cases the graph probe covers; the rest are shown without counts. */
	probedUseCaseIds: string[]
	isGraphSummaryPending: boolean
	statuses: Record<StepId, StepStatus>
	isChecking: boolean
	refresh: () => void
	/** Brings the setup checklist back, which is otherwise gone once it is finished. */
	onShowChecklist: () => void
}

/** A one-line fact about the platform, linking to the module that owns it. */
const SummaryTile = ({
	label,
	value,
	cta,
	route,
}: {
	label: string
	value: string
	cta: string
	route: string
}) => (
	<div className='min-w-56 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm'>
		<p className='text-xs font-semibold tracking-wide text-slate-500 uppercase'>{label}</p>
		<p className='mt-1 text-sm break-words text-slate-800'>{value}</p>
		<Link
			to={route}
			className='mt-2 inline-block text-xs font-medium text-slate-500 underline hover:text-slate-800'
		>
			{cta}
		</Link>
	</div>
)

/**
 * The everyday start page, shown once the setup is complete and acknowledged.
 *
 * Deliberately not a metrics page. Counting things the user already knows about would be
 * decoration; what earns the space is that every use case is a link straight into its own
 * graph, which the app menu cannot offer - it only knows modules, not content.
 */
const Dashboard = ({
	useCases,
	graphSummaries,
	probedUseCaseIds,
	isGraphSummaryPending,
	statuses,
	isChecking,
	refresh,
	onShowChecklist,
}: DashboardProps) => {
	// Without a single use case there is nothing to lead into, and the plain welcome page
	// is the honest answer. Reachable when the setup was completed and then torn down.
	if (useCases.length === 0) return <WelcomeView />

	const probed = new Set(probedUseCaseIds)

	return (
		// Typography pinned and min-h-full for the same reasons as on the checklist page:
		// this renders inside the shell next to other micro-frontends, each shipping its own
		// CSS reset, and the shell's plugin container is what the full height resolves against.
		<div className='box-border min-h-full w-full bg-slate-50 font-sans text-base leading-normal text-slate-900 antialiased'>
			<div className='mx-auto max-w-4xl px-6 py-10'>
				<header className='flex flex-wrap items-start justify-between gap-4'>
					<div className='min-w-60 flex-1'>
						<h1 className='text-3xl leading-tight font-bold tracking-tight text-slate-900'>
							Welcome to gaeco
						</h1>
						<p className='mt-2 max-w-2xl text-sm text-slate-600'>
							Pick up where your data is, or choose an application from the menu in the top right.
						</p>
					</div>
					<div className='flex shrink-0 flex-wrap gap-2'>
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
							{isChecking ? 'Checking…' : 'Refresh'}
						</button>
					</div>
				</header>

				{/* ---- UseCases: the actual entry points ----------------------------- */}
				<section className='mt-8'>
					<div className='flex flex-wrap items-center justify-between gap-3'>
						<h2 className='text-sm font-semibold tracking-wide text-slate-700 uppercase'>
							Your UseCases
						</h2>
						<Link
							to={moduleRoutes.useCase}
							className='inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500 underline hover:text-slate-800'
						>
							<AddRoundedIcon fontSize='inherit' aria-hidden='true' />
							Manage UseCases
						</Link>
					</div>

					<ul className='mt-3 flex list-none flex-wrap gap-4'>
						{useCases.map(useCase => (
							<UseCaseCard
								key={useCase.id}
								useCase={useCase}
								summary={graphSummaries[useCase.id]}
								// Only the probed use cases are ever loading. For the others the
								// counts are not coming at all, and the card must say so instead
								// of spinning forever.
								isPending={isGraphSummaryPending && probed.has(useCase.id)}
								instanceRoute={moduleRoutes.instance}
							/>
						))}
					</ul>

					{useCases.length > probedUseCaseIds.length && (
						<p className='mt-3 text-xs text-slate-500'>
							Contents are read for the first {probedUseCaseIds.length} UseCases only — each one
							costs a separate request. Open a UseCase to see everything it holds.
						</p>
					)}
				</section>

				{/* ---- What the data rests on --------------------------------------- */}
				<section className='mt-8'>
					<h2 className='text-sm font-semibold tracking-wide text-slate-700 uppercase'>
						Platform
					</h2>
					<div className='mt-3 flex flex-wrap gap-4'>
						<SummaryTile
							label='Data model'
							value={statuses.dataModel.detail}
							cta='Platform Config'
							route={moduleRoutes.platformConfig}
						/>
						<SummaryTile
							label='Permissions'
							value={statuses.permissions.detail}
							cta='Access Rights'
							route={moduleRoutes.access}
						/>
					</div>
				</section>

				{/* Kept quiet and out of the way: needed rarely, and never by someone who just
				    wants to get to their data. */}
				<p className='mt-8 text-xs text-slate-500'>
					<button
						type='button'
						onClick={onShowChecklist}
						className='inline-flex items-center gap-1 underline transition hover:text-slate-800'
					>
						<ChecklistRoundedIcon fontSize='inherit' aria-hidden='true' />
						Show the setup checklist
					</button>
				</p>
			</div>
		</div>
	)
}

export default Dashboard
