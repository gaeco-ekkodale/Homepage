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
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

import { GraphSummary, UseCaseSummary } from '../api/probe'

/** How many classifications are named before the rest is summed up as "+n more". */
const MAX_CLASSIFICATIONS_SHOWN = 3

export type UseCaseCardProps = {
	useCase: UseCaseSummary
	/**
	 * What this use case's graph holds, or undefined when it was not read: either the graph
	 * probe is still running, or this use case is beyond the probe cap, or its request
	 * failed. The card says which - a missing number must not read as a zero.
	 */
	summary: GraphSummary | undefined
	/** True while the graph probe has not answered yet. */
	isPending: boolean
	/** Base route of the instance module; the use case is appended as a search param. */
	instanceRoute: string
}

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
	`${count} ${count === 1 ? singular : pluralForm}`

/**
 * One use case as an entry point.
 *
 * The point of the card is the link, not the numbers: it opens the graph with this use
 * case already selected, so the everyday start page is one click from the data instead of
 * being a status board. The counts come out of the request that link target needs anyway.
 */
const UseCaseCard = ({ useCase, summary, isPending, instanceRoute }: UseCaseCardProps) => {
	const title = useCase.name || 'Unnamed UseCase'
	const isEmpty = summary?.instanceCount === 0
	const shown = summary?.classifications.slice(0, MAX_CLASSIFICATIONS_SHOWN) ?? []
	const hiddenCount = (summary?.classifications.length ?? 0) - shown.length

	/** The counts line. Distinguishes "empty", "not read" and "still reading". */
	const renderFacts = () => {
		if (summary) {
			if (isEmpty) return <span className='text-slate-500'>No instances yet</span>
			return (
				<span className='text-slate-600'>
					{plural(summary.instanceCount, 'instance')} ·{' '}
					{plural(summary.relationCount, 'relation')}
				</span>
			)
		}
		if (isPending) return <span className='text-slate-400'>Reading graph…</span>
		return <span className='text-slate-400'>Contents not read</span>
	}

	return (
		// Wraps rather than switching column count at a breakpoint: every micro-frontend
		// ships its own Tailwind build, and one loaded later redefines the plain utility
		// without carrying the responsive variant, which silently disables the breakpoint.
		// A min width plus grow reacts to the actual available space and has nothing to lose.
		<li className='flex min-w-72 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm'>
			<h3 className='text-base leading-snug font-semibold break-words text-slate-900'>{title}</h3>

			{useCase.description && (
				<p className='mt-1 line-clamp-2 text-sm leading-snug break-words text-slate-500'>
					{useCase.description}
				</p>
			)}

			<p className='mt-3 text-xs font-medium'>{renderFacts()}</p>

			{shown.length > 0 && (
				<ul className='mt-3 flex list-none flex-wrap gap-1.5'>
					{shown.map(classification => (
						<li
							key={classification.name}
							className='rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600'
						>
							{classification.name}
							<span className='ml-1 font-semibold text-slate-500'>{classification.count}</span>
						</li>
					))}
					{hiddenCount > 0 && (
						<li className='rounded-full px-2.5 py-0.5 text-xs text-slate-400'>
							+{hiddenCount} more
						</li>
					)}
				</ul>
			)}

			{/* Pushed to the bottom so cards of differing height keep their links aligned. */}
			<div className='mt-4 flex grow flex-wrap items-end gap-2'>
				<Link
					to={`${instanceRoute}?useCaseId=${encodeURIComponent(useCase.id)}`}
					className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
						isEmpty
							? 'bg-primary text-light hover:opacity-90'
							: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
					}`}
				>
					{isEmpty ? 'Add data' : 'Open graph'}
					<ArrowForwardRoundedIcon fontSize='inherit' aria-hidden='true' />
				</Link>
			</div>
		</li>
	)
}

export default UseCaseCard
