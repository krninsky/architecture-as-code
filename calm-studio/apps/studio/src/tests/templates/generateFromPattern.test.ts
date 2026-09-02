// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@finos/calm-shared/generate', () => {
	return {
		extractOptions: vi.fn(() => []),
		generateArchitecture: vi.fn(async () => ({
			nodes: [{ 'unique-id': 'n1', 'node-type': 'service', name: 'N', description: '' }],
			relationships: [],
		})),
		SchemaDirectory: class {
			storeDocument() {}
			async loadSchemas() {}
		},
	};
});

vi.mock('@finos/calm-shared/document-loader-types', () => ({
	DocumentLoadError: class extends Error {},
}));

describe('generateArchitectureFromPattern', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('returns architecture from shared generateArchitecture (no CLI spawn)', async () => {
		const { generateArchitectureFromPattern } = await import('$lib/templates/generateFromPattern');
		const arch = await generateArchitectureFromPattern({ $id: 'p', properties: { nodes: {} } });
		expect(arch.nodes).toHaveLength(1);
		expect(arch.nodes[0]!['unique-id']).toBe('n1');
	});
});
