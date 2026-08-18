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
 * The everyday start page, shown once the setup is complete and acknowledged.
 *
 * Matches the shell's own fallback page on purpose: whichever of the two renders, the
 * start page must look the same.
 */
const WelcomeView = () => (
	<div className='flex min-h-full w-full flex-col items-center justify-center bg-slate-50 px-6 text-center'>
		<h1 className='text-3xl font-bold text-slate-900'>Welcome to gaeco</h1>
		<h2 className='max-w-xl pt-4 text-xl text-slate-600'>
			Please choose an application from the menu in the top right to get started.
		</h2>
	</div>
)

export default WelcomeView
