// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import winston from '$lib/shims/winston';

describe('winston browser shim', () => {
	it('loads without touching Node process and exposes createLogger', () => {
		const logger = winston.createLogger({
			level: 'info',
			transports: [new winston.transports.Console({ stderrLevels: ['error'] })],
			format: winston.format.combine(
				winston.format.label({ label: 'test' }),
				winston.format.cli(),
				winston.format.errors({ stack: true }),
				winston.format.printf(({ message }) => String(message))
			),
		});
		expect(() => {
			logger.debug('d');
			logger.info('i');
			logger.warn('w');
			logger.error('e');
			logger.log({ level: 'info', message: 'm' });
		}).not.toThrow();
	});
});
