// Copyright (c) 2025 Ekkodale GmbH. All rights reserved.
//
// This file is part of the gaeco platform system.
//
// Use of this file is governed by the terms of the license
// in LICENSE.md at the root of this repository.
// Unauthorized copying, modification, distribution, or use of this file,
// via any medium, is strictly prohibited except as expressly permitted
// under that license.

import React, { createContext, useContext, useMemo } from "react";
import { PluginProps } from "./PluginProps";
import { SnackbarContextType, useSnackbar as useLocalSnackbar } from "./SnackbarProvider";

type PluginContextType = {
	showSnackbar: SnackbarContextType;
};

const PluginContext = createContext<PluginContextType | undefined>(undefined);

export const PluginContextProvider: React.FC<{
	pluginProps?: PluginProps;
	children: React.ReactNode;
}> = ({ pluginProps, children }) => {
	const localSnackbar = useLocalSnackbar();

	const value = useMemo<PluginContextType>(
		() => ({
			showSnackbar: pluginProps?.showSnackbar ?? localSnackbar,
		}),
		[pluginProps?.showSnackbar, localSnackbar]
	);

	return (
		<PluginContext.Provider value={value}>{children}</PluginContext.Provider>
	);
};

export const useSnackbar = (): SnackbarContextType => {
	const context = useContext(PluginContext);
	if (!context) {
		throw new Error("useSnackbar must be used within a PluginContextProvider");
	}
	return context.showSnackbar;
};
