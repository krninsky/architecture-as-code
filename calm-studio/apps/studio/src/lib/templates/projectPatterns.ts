// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import type { CalmProjectConfig } from '$lib/project/types';
import { clearPatternRegistry, parseCalmPattern, registerPattern } from './patternRegistry';
import { patternScanDirs, readJsonFilesUnderDir } from './projectJsonScan';
import { parseCalmTemplate } from './registry';

export interface ProjectPatternLoadResult {
	loaded: number;
	warnings: string[];
}

/**
 * Load CALM CLI patterns from `patterns.dir` and from `templates.dir` when
 * pattern files are co-located with `_template` JSON (R41).
 */
export async function applyProjectPatterns(
	root: FileSystemDirectoryHandle | null,
	config: CalmProjectConfig | null
): Promise<ProjectPatternLoadResult> {
	clearPatternRegistry();
	const dirs = patternScanDirs(config?.templates?.dir, config?.patterns?.dir);
	if (!root || dirs.length === 0) {
		return { loaded: 0, warnings: [] };
	}

	const warnings: string[] = [];
	let loaded = 0;
	const seenIds = new Set<string>();

	for (const { dir, warnUnknown } of dirs) {
		try {
			const scanned = await readJsonFilesUnderDir(root, dir);
			warnings.push(...scanned.warnings);

			for (const file of scanned.files) {
				const card = parseCalmPattern(file.value, file.relativePath);
				if (card) {
					if (seenIds.has(card.id)) continue;
					seenIds.add(card.id);
					registerPattern(card);
					loaded += 1;
					continue;
				}
				if (parseCalmTemplate(file.value)) {
					continue;
				}
				if (warnUnknown) {
					warnings.push(
						`Skipped ${file.relativePath}: not a CALM CLI pattern (need $schema/$id and properties.nodes)`
					);
				}
			}
		} catch {
			warnings.push(`Pattern folder "${dir}" could not be scanned`);
		}
	}

	return { loaded, warnings };
}
