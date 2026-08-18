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
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import QuestionMarkRoundedIcon from '@mui/icons-material/QuestionMarkRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'

import { StepStatus } from '../hooks/usePlatformReadiness'

export type Step = {
	/** Position in the setup order, shown in the checkbox while the step is open. */
	index: number
	title: string
	/** What the user does here - one line. */
	what: string
	cta: string
	route: string
}

/**
 * The checkbox marker. Done gets a tick, problems get their own glyph, and an open step
 * keeps its number so the reading order stays obvious.
 */
const Marker = ({ status, index }: { status: StepStatus; index: number }) => {
	const base =
		'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 text-xs font-bold'

	switch (status.kind) {
		case 'done':
			return (
				<span className={`${base} border-emerald-600 bg-emerald-600 text-white`} aria-hidden='true'>
					<CheckRoundedIcon fontSize='inherit' />
				</span>
			)
		case 'unreachable':
			return (
				<span className={`${base} border-rose-500 bg-rose-500 text-white`} aria-hidden='true'>
					<PriorityHighRoundedIcon fontSize='inherit' />
				</span>
			)
		case 'unknown':
			return (
				<span className={`${base} border-amber-400 bg-amber-400 text-white`} aria-hidden='true'>
					<QuestionMarkRoundedIcon fontSize='inherit' />
				</span>
			)
		case 'checking':
			return (
				<span
					className={`${base} animate-pulse border-slate-300 bg-white text-slate-400`}
					aria-hidden='true'
				>
					{index}
				</span>
			)
		default:
			return (
				<span className={`${base} border-slate-300 bg-white text-slate-500`} aria-hidden='true'>
					{index}
				</span>
			)
	}
}

const DETAIL_TONE: Record<StepStatus['kind'], string> = {
	done: 'text-emerald-700',
	open: 'text-slate-500',
	unknown: 'text-amber-700',
	unreachable: 'text-rose-700',
	checking: 'text-slate-400',
}

/**
 * One line of the checklist. Rows sit inside a single bordered list rather than in
 * separate cards, so the whole thing reads as one list to work through.
 */
const StepRow = ({
	step,
	status,
	isLast,
}: {
	step: Step
	status: StepStatus
	isLast: boolean
}) => {
	const isDone = status.kind === 'done'

	return (
		<li className={`relative flex gap-4 px-5 py-4 ${isLast ? '' : 'border-b border-slate-200'}`}>
			{/* Connector, so the markers read as one vertical checklist spine. */}
			{!isLast && (
				<span
					className='absolute top-11 left-[2.1rem] h-[calc(100%-1.75rem)] w-px bg-slate-200'
					aria-hidden='true'
				/>
			)}

			<Marker status={status} index={step.index} />

			{/* Wraps instead of switching direction at a breakpoint - see the note in
			    HomePage on why a base utility plus a responsive override is unsafe in a
			    Module Federation shell. */}
			<div className='flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2'>
				<div className='min-w-60 flex-1'>
					<h3
						className={`text-sm leading-snug font-semibold ${
							isDone ? 'text-slate-500' : 'text-slate-900'
						}`}
					>
						{step.title}
					</h3>
					<p className='mt-0.5 text-sm leading-snug break-words text-slate-500'>{step.what}</p>
					<p className={`mt-1 text-xs leading-snug break-words ${DETAIL_TONE[status.kind]}`}>
						{status.detail}
					</p>
				</div>

				<Link
					to={step.route}
					className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
						isDone
							? 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
							: 'bg-primary text-light hover:opacity-90'
					}`}
				>
					{step.cta}
					<ArrowForwardRoundedIcon fontSize='inherit' aria-hidden='true' />
				</Link>
			</div>
		</li>
	)
}

export default StepRow
