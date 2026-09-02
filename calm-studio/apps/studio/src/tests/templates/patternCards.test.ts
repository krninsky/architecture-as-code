// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { parseCalmPattern } from '$lib/templates/patternRegistry';

const pattern = {
	$schema: 'https://calm.finos.org/release/1.0/meta/calm.json',
	$id: 'https://example.com/patterns/trades',
	title: 'Trades API Pattern',
	description: 'REST API',
	type: 'object',
	properties: {
		nodes: {
			type: 'array',
			prefixItems: [{ properties: { 'unique-id': { const: 'api' } } }],
		},
	},
};

describe('parseCalmPattern', () => {
	it('accepts JSON Schema patterns with prefixItems', () => {
		const card = parseCalmPattern(pattern, 'patterns/trades.pattern.json');
		expect(card).not.toBeNull();
		expect(card?.name).toBe('Trades API Pattern');
		expect(card?.id).toBe('https://example.com/patterns/trades');
	});

	it('rejects _template architecture JSON', () => {
		expect(
			parseCalmPattern(
				{ nodes: [], relationships: [], _template: { id: 'x', name: 'x', category: 'y' } },
				't.json'
			)
		).toBeNull();
	});

	it('rejects objects without nodes prefixItems or const', () => {
		expect(
			parseCalmPattern(
				{ $id: 'https://x', type: 'object', properties: { nodes: { type: 'array' } } },
				'x.json'
			)
		).toBeNull();
	});

	it('accepts CALM 1.0 pattern files named *.pattern.json', () => {
		const card = parseCalmPattern(
			{
				$schema: 'https://calm.finos.org/release/1.0/meta/calm.json',
				$id: 'https://calm.finos.org/calm/namespaces/qcon/patterns/trades-api/versions/1.0.0',
				title: 'Trades API Pattern',
				type: 'object',
				properties: {
					nodes: {
						type: 'array',
						minItems: 1,
						prefixItems: [{ properties: { 'unique-id': { const: 'trades-api' } } }],
					},
				},
			},
			'templates/trades-api.pattern.json'
		);
		expect(card?.name).toBe('Trades API Pattern');
	});
});
