// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import HomePage from './pages/HomePage'
import { PluginContextProvider } from './context/PluginContext'
import { PluginProps } from './context/PluginProps'
import './index.css'

/**
 * Federated entry point (exposed as "./App").
 *
 * Note that PluginHost renders the start page plugin without passing plugin props, so
 * everything here has to work with an empty props object - PluginContextProvider already
 * falls back to a local implementation.
 *
 * Service base URLs are read from the environment in src/config/env.ts; there is no
 * OpenAPI client to configure because the readiness probes are plain GETs.
 */
function App(pluginProps: PluginProps) {
	// One client per mount - recreating it on every render would drop the probe cache.
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						// The checklist is a live view of the services, so re-derive it when the
						// user comes back to the tab. Never trust a remembered "done".
						refetchOnWindowFocus: true,
					},
				},
			})
	)

	return (
		<QueryClientProvider client={queryClient}>
			<PluginContextProvider pluginProps={pluginProps}>
				<Routes>
					<Route path='/*' element={<HomePage />} />
				</Routes>
			</PluginContextProvider>
		</QueryClientProvider>
	)
}

export default App
