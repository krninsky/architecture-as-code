// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Load CALM templates from a project folder listed in `.calmrj` (R33).
 */

import type { CalmProjectConfig } from '$lib/project/types';
import { parseCalmPattern } from './patternRegistry';
import { readJsonFilesUnderDir } from './projectJsonScan';
import {
	parseCalmTemplate,
	registerTemplate,
	resetToBundledTemplates,
} from './registry';

export interface ProjectTemplateLoadResult {
	loaded: number;
	warnings: string[];
}

/**
 * Restore bundled templates, then merge project JSON from `templates.dir`.
 * Same `_template.id` overwrites a bundled entry. Invalid files are skipped.
 * CLI pattern files in the same folder are not templates — skip without warning (R41).
 */
export async function applyProjectTemplates(
	root: FileSystemDirectoryHandle | null,
	config: CalmProjectConfig | null
): Promise<ProjectTemplateLoadResult> {
	resetToBundledTemplates();
	const dir = config?.templates?.dir?.trim();
	if (!root || !dir) {
		return { loaded: 0, warnings: [] };
	}

	const warnings: string[] = [];
	let loaded = 0;

	try {
		const scanned = await readJsonFilesUnderDir(root, dir);
		warnings.push(...scanned.warnings);

		for (const file of scanned.files) {
			const template = parseCalmTemplate(file.value);
			if (template) {
				registerTemplate(template);
				loaded += 1;
				continue;
			}
			if (parseCalmPattern(file.value, file.relativePath)) {
				continue;
			}
			warnings.push(
				`Skipped ${file.relativePath}: not a template (need _template.id, name, category)`
			);
		}
	} catch {
		warnings.push(`Template folder "${dir}" could not be scanned`);
	}

	return { loaded, warnings };
}
