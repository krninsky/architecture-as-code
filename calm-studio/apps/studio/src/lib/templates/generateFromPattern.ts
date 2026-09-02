// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * In-memory CALM generate via @finos/calm-shared (R41 / #42).
 * Does not spawn the CLI and does not reimplement instantiate.
 */

import type { CalmArchitecture } from '@calmstudio/calm-core';
import {
	DocumentLoadError,
	type DocumentLoader,
} from '@finos/calm-shared/document-loader-types';
import {
	extractOptions,
	generateArchitecture,
	SchemaDirectory,
	type CalmChoice,
	type CalmOption,
} from '@finos/calm-shared/generate';
import type { CalmDocumentType } from '@finos/calm-models/types';

import core10 from '$calm-release/1.0/meta/core.json';
import calm10 from '$calm-release/1.0/meta/calm.json';
import iface10 from '$calm-release/1.0/meta/interface.json';
import control10 from '$calm-release/1.0/meta/control.json';
import core11 from '$calm-release/1.1/meta/core.json';
import calm11 from '$calm-release/1.1/meta/calm.json';
import iface11 from '$calm-release/1.1/meta/interface.json';
import control11 from '$calm-release/1.1/meta/control.json';
import core12 from '$calm-release/1.2/meta/core.json';
import calm12 from '$calm-release/1.2/meta/calm.json';
import iface12 from '$calm-release/1.2/meta/interface.json';
import control12 from '$calm-release/1.2/meta/control.json';

function schemaId(doc: object): string | undefined {
	const id = (doc as { $id?: unknown }).$id;
	return typeof id === 'string' ? id : undefined;
}

function bundledSchemas(): Map<string, object> {
	const map = new Map<string, object>();
	for (const doc of [
		core10, calm10, iface10, control10,
		core11, calm11, iface11, control11,
		core12, calm12, iface12, control12,
	] as object[]) {
		const id = schemaId(doc);
		if (id) map.set(id, doc);
	}
	return map;
}

class BundledCalmDocumentLoader implements DocumentLoader {
	constructor(private readonly schemas: Map<string, object>) {}

	async initialise(schemaDirectory: SchemaDirectory): Promise<void> {
		for (const [id, doc] of this.schemas) {
			schemaDirectory.storeDocument(id, 'schema', doc);
		}
	}

	async loadMissingDocument(documentId: string, _type: CalmDocumentType): Promise<object> {
		const local = this.schemas.get(documentId);
		if (local) return local;
		if (/^https?:\/\//.test(documentId)) {
			const res = await fetch(documentId);
			if (!res.ok) {
				throw new DocumentLoadError({
					name: 'UNKNOWN',
					message: `Failed to fetch schema ${documentId}`,
					recoverable: false,
				});
			}
			return res.json() as Promise<object>;
		}
		throw new DocumentLoadError({
			name: 'OPERATION_NOT_IMPLEMENTED',
			message: `Schema not bundled: ${documentId}`,
		});
	}

	resolvePath(): string | undefined {
		return undefined;
	}
}

export function patternGenerateOptions(pattern: object): CalmOption[] {
	return extractOptions(pattern);
}

export async function generateArchitectureFromPattern(
	pattern: object,
	choices?: CalmChoice[]
): Promise<CalmArchitecture> {
	const loader = new BundledCalmDocumentLoader(bundledSchemas());
	const schemaDirectory = new SchemaDirectory(loader, false);
	const result = await generateArchitecture(pattern, false, schemaDirectory, choices);
	if (!result || typeof result !== 'object') {
		throw new Error('Generate did not return an architecture object');
	}
	const rec = result as Record<string, unknown>;
	if (!Array.isArray(rec['nodes'])) {
		throw new Error('Generated document is missing a nodes array');
	}
	return result as CalmArchitecture;
}
