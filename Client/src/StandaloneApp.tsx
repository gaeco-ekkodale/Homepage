// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import { UserManager, WebStorageStateStore } from 'oidc-client-ts'
import React, { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from 'react-oidc-context'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import App from './App'
import MockHostNavigation from './components/MockHostNavigation'
import { SnackbarProvider } from './context/SnackbarProvider'

// TODO: Set to true to enable authentication if the probed services are secured by Keycloak.
const test_with_auth = false

/**
 * StandaloneApp - entry point for local development of this micro-frontend.
 *
 * It is NOT exposed through module federation; in the platform the plugin is mounted by
 * PluginHost, which renders it as the start page at "/". Because this plugin *is* the
 * start page, the standalone shell mounts it at "/" as well as at the configured mount
 * path, so `npm run dev` lands straight on it.
 */
const userManager = new UserManager({
	authority: import.meta.env.VITE_KEYCLOAK_AUTHORITY,
	client_id: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
	scope: 'groups openid profile email',
	redirect_uri: `${window.location.origin}/${import.meta.env.VITE_MOUNT_PATH}`,
	post_logout_redirect_uri: window.location.origin,
	userStore: new WebStorageStateStore({ store: window.sessionStorage }),
	monitorSession: true,
})

const MockHostLayout = ({ children }: { children: React.ReactNode }) => (
	<div className='flex h-screen flex-col overflow-hidden'>
		<MockHostNavigation />
		<div className='w-full flex-1 overflow-auto'>{children}</div>
	</div>
)

const Loading = () => (
	<div className='flex h-64 items-center justify-center'>
		<div className='text-center'>
			<div
				className='spinner-border inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-r-transparent'
				role='status'
			></div>
			<h2 className='mt-4 text-xl font-semibold'>Loading…</h2>
			<p className='text-gray-500'>Authenticating user…</p>
		</div>
	</div>
)

const AuthenticatedApp = () => {
	const auth = useAuth()
	const [hasTriedSignin, setHasTriedSignin] = useState(false)

	useEffect(() => {
		if (
			test_with_auth &&
			!(auth.isAuthenticated || auth.activeNavigator || auth.isLoading || hasTriedSignin)
		) {
			void auth.signinRedirect()
			setHasTriedSignin(true)
		}
	}, [auth, hasTriedSignin])

	const ready = (auth.isAuthenticated && !!auth.user?.access_token) || !test_with_auth
	const element = (
		<MockHostLayout>
			{ready ? (
				<SnackbarProvider>
					<App />
				</SnackbarProvider>
			) : (
				<Loading />
			)}
		</MockHostLayout>
	)

	return (
		<Routes>
			<Route path='/' element={element} />
			<Route path={`/${import.meta.env.VITE_MOUNT_PATH}/*`} element={element} />
		</Routes>
	)
}

const StandaloneApp = () => (
	<BrowserRouter>
		<AuthProvider
			userManager={userManager}
			onSigninCallback={() => {
				window.history.replaceState({}, document.title, window.location.pathname)
			}}
		>
			<AuthenticatedApp />
		</AuthProvider>
	</BrowserRouter>
)

export default StandaloneApp
