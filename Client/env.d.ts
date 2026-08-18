// ============================================================================
// Environment Variables
// ============================================================================
// Add new variables here.

// Variables required in production/Docker. Will be injected as placeholders
// at build time and replaced at Docker runtime via docker-compose.yml.
// All variables must have the VITE_ prefix.
//
// IMPORTANT: only entries with the value `null` are *required* - the Docker
// entrypoint refuses to start the container when one of them is unset.
// Everything the start page can live without therefore carries a default (a
// plain string), so the checklist degrades to "status unknown" for a service
// that was not configured instead of taking the container down with it.
export const ENV_SCHEMA = {
	VITE_MOUNT_PATH: null,

	// Service APIs the readiness checklist probes. Optional by design.
	VITE_GUIDELINE_API_URL: '',
	VITE_ONTOLOGY_API_URL: '',
	VITE_USECASE_API_URL: '',
	VITE_ACCESS_API_URL: '',
	VITE_INSTANCE_API_URL: '',

	// Routes the steps link to. Must match each module's own mount route.
	VITE_PLATFORMCONFIG_ROUTE: '/platform-config',
	VITE_USECASE_ROUTE: '/usecase',
	VITE_ACCESS_ROUTE: '/access',
	VITE_INSTANCE_ROUTE: '/instance',

	// Demo data is only meaningful for local deployments. Any value other than
	// "true" hides every demo-data affordance completely.
	VITE_ENABLE_DEMO_DATA: 'false',
} as const

// Variables only used in StandaloneApp (local development / standalone mode).
// StandaloneApp is NOT exported via module federation and therefore these
// variables do NOT need to be provided in Docker. Set them in .env.
export const DEV_ONLY_ENV_SCHEMA = {
	VITE_KEYCLOAK_AUTHORITY: null, // Must be set
	VITE_KEYCLOAK_CLIENT_ID: null, // Must be set
} as const

// ============================================================================
// Auto-generated TypeScript Types (Do not modify below this line)
// ============================================================================

export const ENV_KEYS = Object.keys(ENV_SCHEMA) as Array<keyof typeof ENV_SCHEMA>

type GeneratedEnv = {
	readonly [K in keyof typeof ENV_SCHEMA]: string
} & {
	readonly [K in keyof typeof DEV_ONLY_ENV_SCHEMA]: string
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface ImportMetaEnv extends GeneratedEnv {}
	interface ImportMeta {
		readonly env: ImportMetaEnv
	}
}

export {}
