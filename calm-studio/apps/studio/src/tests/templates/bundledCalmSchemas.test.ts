// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { bundledCalmSchemas, schemaIdAliases } from '$lib/templates/bundledCalmSchemas';

function externalSchemaIds(doc: object, baseId: string): string[] {
	const ids = new Set<string>();
	const walk = (node: unknown) => {
		if (!node || typeof node !== 'object') return;
		if (Array.isArray(node)) {
			for (const item of node) walk(item);
			return;
		}
		const record = node as Record<string, unknown>;
		if (typeof record.$ref === 'string' && !record.$ref.startsWith('#')) {
			ids.add(new URL(record.$ref, baseId).href.split('#')[0] ?? '');
		}
		for (const value of Object.values(record)) walk(value);
	};
	walk(doc);
	return [...ids];
}

describe('bundled CALM schemas', () => {
	it('aliases Hub 2025-03 published URLs onto the draft meta files', () => {
		expect(schemaIdAliases('https://calm.finos.org/draft/2025-03/meta/core.json')).toContain(
			'https://calm.finos.org/calm/schemas/2025-03/meta/core.json'
		);
		const map = bundledCalmSchemas();
		expect(map.has('https://calm.finos.org/calm/schemas/2025-03/meta/calm.json')).toBe(true);
		expect(map.has('https://calm.finos.org/calm/schemas/2025-03/meta/core.json')).toBe(true);
		expect(map.has('https://calm.finos.org/calm/schemas/2025-03/meta/interface.json')).toBe(true);
	});

	it('resolves every external $ref from CALM core, including flow.json', () => {
		const map = bundledCalmSchemas();
		const bases = [
			'https://calm.finos.org/release/1.0/meta/core.json',
			'https://calm.finos.org/release/1.1/meta/core.json',
			'https://calm.finos.org/release/1.2/meta/core.json',
			'https://calm.finos.org/draft/2025-03/meta/core.json',
		];
		for (const base of bases) {
			const core = map.get(base);
			expect(core, base).toBeTruthy();
			const refs = externalSchemaIds(core as object, base);
			expect(refs).toContain(new URL('flow.json', base).href);
			for (const ref of refs) {
				expect(map.has(ref), `${base} → ${ref}`).toBe(true);
			}
		}
	});

	it('bundles JSON Schema 2020-12 without a network fetch', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const map = bundledCalmSchemas();
		expect(map.has('https://json-schema.org/draft/2020-12/schema')).toBe(true);
		expect(map.has('http://json-schema.org/draft/2020-12/schema')).toBe(true);
		expect(map.has('https://json-schema.org/draft/2020-12/meta/core')).toBe(true);
		const { BundledCalmDocumentLoader } = await import('$lib/templates/bundledCalmSchemas');
		const loader = new BundledCalmDocumentLoader();
		const doc = await loader.loadMissingDocument(
			'https://json-schema.org/draft/2020-12/schema',
			'schema'
		);
		expect((doc as { $id?: string }).$id).toBe('https://json-schema.org/draft/2020-12/schema');
		expect(fetchSpy).not.toHaveBeenCalled();
		fetchSpy.mockRestore();
	});

	it('does not fetch unmapped http schema URLs (R75)', async () => {
		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const { BundledCalmDocumentLoader } = await import('$lib/templates/bundledCalmSchemas');
		const loader = new BundledCalmDocumentLoader();
		await expect(
			loader.loadMissingDocument('https://schemas.difa.creditas.cz/calm/standards/difa-standard.json', 'schema')
		).rejects.toMatchObject({ name: 'OPERATION_NOT_IMPLEMENTED' });
		expect(fetchSpy).not.toHaveBeenCalled();
		fetchSpy.mockRestore();
	});
});
