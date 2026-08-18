# Introduction

This document guides you through the installation steps to start the Homepage module, the
start page of the gaeco Plugin Host.

# Prerequisites

- Ensure that the application `Docker Desktop` is running.
- The following services must be running:
  - `PluginHost Service`
  - `AppOrchestrator`
  - `Guideline Service`
  - `Ontology Service`
  - `UseCase Service`
  - `Access Service`
- Make sure that `Node.js` is installed if you intend to run the client in local development
  mode.

The Homepage module reads the state of the four services above to build its setup checklist.
It starts without them, but each unreachable service is reported as unavailable instead of
contributing a result.

# Technical Guide

The Homepage consists only of a microfrontend plugin — there is no backend service in this
repository.

If you start the platform with `gaeco-ext/start-gaeco.bat`, or with the `start-all` script in
`Gaeco/_docker`, the client is already included and you can skip to
[using the module](02-User-Manual.md).

## Starting the Client

There are two supported ways to run the Homepage client:

### Containerized client via AppOrchestrator

- Ensure that the `homepage-client` container is running.
- The AppOrchestrator reads the microfrontend metadata from the container labels and binds the
  client into the Plugin Host automatically.

This is the standard runtime setup. The module then appears at `/` in the Plugin Host.

### Local development mode

- Navigate to `Homepage/Client`.
- Open a command line interface in that directory. On Windows you can use `Terminal` or
  `PowerShell` by right-clicking while holding the `Shift` key.
- Execute `npm i`.
- Execute `npm run dev`.

This starts the client with the `devlocal` environment. Use this mode when you actively work
on the frontend.

# Keycloak Client

The module has a Keycloak client of its own, `app-homepage` (`VITE_KEYCLOAK_CLIENT_ID`). It ships
with the realm, so there is nothing to create.

It is a namespace for roles rather than a login: the module does not authenticate separately, it
reads the token the shell obtained and looks up its own entry under `resource_access.app-homepage`.
A `VITE_KEYCLOAK_CLIENT_ID` that names some other client therefore does not fail loudly — the
lookup simply finds nothing, and every role check comes back negative.

# Verifying

Open the Plugin Host at <http://localhost:5000> and sign in. The start page should show the
setup checklist with the current state of the platform. If it reports services as unavailable,
check that the four services listed under [Prerequisites](#prerequisites) are running.
