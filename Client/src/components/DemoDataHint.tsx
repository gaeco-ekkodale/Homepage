// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'

/**
 * How to load the demo portfolio instead of setting the platform up by hand.
 *
 * Rendered only when VITE_ENABLE_DEMO_DATA is "true" - the loader script talks to
 * services on localhost, so the affordance is meaningless anywhere but a local stack
 * and must not appear there at all.
 */
const DemoDataHint = () => (
	<section className='mt-8 rounded-xl border border-indigo-200 bg-indigo-50 p-5'>
		<h2 className='flex items-center gap-2 font-semibold text-indigo-900'>
			<ScienceRoundedIcon fontSize='small' aria-hidden='true' />
			Just trying it out?
		</h2>
		<p className='mt-1 text-sm text-indigo-900'>
			Load a complete demo portfolio - data model, UseCases, permissions and a filled graph -
			in one go instead of doing the steps by hand.
		</p>
		<pre className='mt-3 overflow-x-auto rounded-md bg-white/70 px-3 py-2 text-xs text-indigo-950'>
			<code>cd _docker &amp;&amp; python setup-demo-data.py</code>
		</pre>
		<p className='mt-2 text-xs text-indigo-800'>
			Details in <code>_docker/setup-demo-data.md</code> of the deployment repository. Reload
			this page afterwards - the checklist re-reads the services, it stores nothing.
		</p>
	</section>
)

export default DemoDataHint
