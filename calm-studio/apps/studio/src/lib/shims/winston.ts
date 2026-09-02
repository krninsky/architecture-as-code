// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Browser stand-in for winston. Shared `initLogger` imports winston at module
 * load; the real package touches `process` and crashes Vite with 500.
 * Studio never calls createLogger in the browser (loglevel path).
 */

const noop = (): void => {};

const stubLogger = {
	log: noop,
	debug: noop,
	info: noop,
	warn: noop,
	error: noop,
};

class ConsoleTransport {
	constructor(_opts?: unknown) {}
}

function formatPass(_opts?: unknown): object {
	return {};
}

const winston = {
	createLogger: (_opts?: unknown) => stubLogger,
	transports: { Console: ConsoleTransport },
	format: {
		combine: (..._args: unknown[]) => ({}),
		label: formatPass,
		cli: formatPass,
		errors: formatPass,
		printf: formatPass,
	},
};

export default winston;
