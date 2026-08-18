// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import { useCallback, useEffect, useState } from 'react'

/**
 * Bump when the completion dialog changes enough that people should see it again.
 */
const VERSION = 1
const STORAGE_KEY = `gaeco.homepage.setupAcknowledged.v${VERSION}`

const read = (): boolean => {
	try {
		return window.localStorage.getItem(STORAGE_KEY) === 'true'
	} catch {
		return false
	}
}

/**
 * Whether the user has confirmed the "everything is set up" dialog.
 *
 * Only this confirmation is stored - never the setup progress itself, which is always
 * derived from the live state of the services. If a step later falls back to open, the
 * checklist returns on its own even though the dialog was acknowledged once.
 */
export const useSetupAcknowledged = () => {
	// Assume acknowledged until localStorage has been read, so the dialog cannot flash
	// for someone who dismissed it long ago.
	const [acknowledged, setAcknowledged] = useState(true)

	useEffect(() => {
		setAcknowledged(read())
	}, [])

	const acknowledge = useCallback(() => {
		setAcknowledged(true)
		try {
			window.localStorage.setItem(STORAGE_KEY, 'true')
		} catch {
			// Not being able to remember is acceptable - the dialog is a one-liner.
		}
	}, [])

	/**
	 * Forgets the confirmation, so finishing the setup ends with the dialog again.
	 *
	 * Called when the platform is no longer fully set up: without this, someone who
	 * confirmed once and then cleared a service would silently land on the start page the
	 * next time everything is in place, with nothing marking the setup as finished.
	 */
	const reset = useCallback(() => {
		setAcknowledged(false)
		try {
			window.localStorage.removeItem(STORAGE_KEY)
		} catch {
			// Same as above - losing the stored flag only costs one extra dialog.
		}
	}, [])

	return { acknowledged, acknowledge, reset }
}
