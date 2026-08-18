// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Snackbar, Alert } from '@mui/material'

/**
 * Type definition for a snackbar item
 */
type SnackbarItem = {
	id: string
	message: string
	severity: 'info' | 'success' | 'warning' | 'error'
}

/**
 * Type definition for the snackbar context function
 * @param message - The message to display
 * @param severity - Optional severity level of the snackbar
 */
export type SnackbarContextType = (
	message: string,
	severity?: 'info' | 'success' | 'warning' | 'error'
) => void

/**
 * Context that provides a function to show snackbars
 */
const SnackbarContext = createContext<SnackbarContextType>(() => {})

/**
 * Custom hook for easy access to the snackbar system
 * @returns A function to display snackbars
 */
export function useSnackbar() {
	return useContext(SnackbarContext)
}

/**
 * Provider component that manages the snackbar queue system
 * @param children - React children components
 */
export function SnackbarProvider({ children }: { children: React.ReactNode }) {
	// State for the currently displayed snackbar
	const [currentSnackbar, setCurrentSnackbar] = useState<SnackbarItem | null>(
		null
	)

	// State for the snackbar queue
	const [snackbarQueue, setSnackbarQueue] = useState<SnackbarItem[]>([])

	// State to track if the Snackbar is open
	const [open, setOpen] = useState(false)

	/**
	 * Adds a new snackbar to the queue
	 * @param message - The message to display
	 * @param severity - The severity level of the snackbar
	 */
	const showSnackbar = (
		message: string,
		severity: 'info' | 'success' | 'warning' | 'error' = 'info'
	) => {
		const newSnackbar = {
			id: Date.now().toString(),
			message,
			severity,
		}

		setSnackbarQueue(prev => [...prev, newSnackbar])
	}

	/**
	 * Handles closing the current snackbar
	 * @param _event - The event that triggered the close
	 * @param reason - The reason for closing
	 */
	const handleClose = (
		_event?: React.SyntheticEvent | Event,
		reason?: string
	) => {
		if (reason === 'clickaway') {
			return
		}

		setOpen(false)

		// Set a timeout to allow the exit animation to complete
		setTimeout(() => {
			setCurrentSnackbar(null)
		}, 300)
	}

	/**
	 * Effect that processes the snackbar queue
	 */
	useEffect(() => {
		if (snackbarQueue.length > 0 && !currentSnackbar) {
			// Take the first snackbar from the queue
			const [next, ...rest] = snackbarQueue
			setSnackbarQueue(rest)
			setCurrentSnackbar(next)
			setOpen(true)
		}
	}, [snackbarQueue, currentSnackbar, open])

	return (
		<SnackbarContext.Provider value={showSnackbar}>
			{children}
			{currentSnackbar && (
				<Snackbar
					open={open}
					onClose={handleClose}
					autoHideDuration={6000}
					anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
					key={currentSnackbar.id}
				>
					<Alert
						onClose={handleClose}
						severity={currentSnackbar.severity}
						sx={{ width: '100%' }}
						variant='filled'
					>
						{currentSnackbar.message}
					</Alert>
				</Snackbar>
			)}
		</SnackbarContext.Provider>
	)
}
