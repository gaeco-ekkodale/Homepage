// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	ThemeProvider,
	Typography,
	createTheme,
} from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'

/** Same pinned appearance as the module tours, so dialogs match across the platform. */
const dialogTheme = createTheme({
	palette: {
		primary: { main: '#1d4ed8' },
		text: { primary: '#0f172a', secondary: '#475569' },
	},
	typography: {
		fontFamily: ['Inter', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'].join(','),
	},
	components: {
		MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
	},
})

/**
 * Shown once every setup step is satisfied - one line, then out of the way.
 *
 * Deliberately says nothing about the app menu or the module tours: by the time anyone
 * gets here they have been through three modules, each of which opened its own tour.
 *
 * Also deliberately does not congratulate the user: on a demo or shared stack the setup
 * was done by the seed script or by whoever came before them.
 */
const SetupCompleteDialog = ({ open, onAcknowledge }: { open: boolean; onAcknowledge: () => void }) => (
	<ThemeProvider theme={dialogTheme}>
		<Dialog
			open={open}
			onClose={onAcknowledge}
			maxWidth='xs'
			fullWidth
			PaperProps={{ sx: { borderRadius: 3 } }}
		>
			<DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
				<CheckCircleRoundedIcon sx={{ color: '#059666' }} />
				<Typography component='span' sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
					Setup complete
				</Typography>
			</DialogTitle>
			<DialogContent>
				<Typography sx={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.65 }}>
					The platform is ready — you can start creating data now.
				</Typography>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button
					variant='contained'
					disableElevation
					onClick={onAcknowledge}
					sx={{ bgcolor: '#1d4ed8', '&:hover': { bgcolor: '#1a43b8' } }}
				>
					OK
				</Button>
			</DialogActions>
		</Dialog>
	</ThemeProvider>
)

export default SetupCompleteDialog
