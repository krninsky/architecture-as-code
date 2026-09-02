// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

import { scanDirectoryTree } from '$lib/explorer/folderScan';
import { isPathUnderSearchRoots, listJsonFiles } from '$lib/neighbors/findNeighbors';

export interface ProjectJsonFile {
	relativePath: string;
	value: unknown;
}

export interface ProjectJsonScanResult {
	files: ProjectJsonFile[];
	warnings: string[];
}

function normalizeDir(dir: string): string {
	return dir.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
}

export async function readJsonFilesUnderDir(
	root: FileSystemDirectoryHandle,
	dir: string
): Promise<ProjectJsonScanResult> {
	const warnings: string[] = [];
	const files: ProjectJsonFile[] = [];
	const tree = await scanDirectoryTree(root);
	const matches = listJsonFiles(tree).filter((f) => isPathUnderSearchRoots(f.relativePath, [dir]));

	for (const file of matches) {
		try {
			const text = await (await file.handle.getFile()).text();
			try {
				files.push({ relativePath: file.relativePath, value: JSON.parse(text) });
			} catch {
				warnings.push(`Skipped ${file.relativePath}: invalid JSON`);
			}
		} catch {
			warnings.push(`Skipped ${file.relativePath}: unreadable`);
		}
	}

	return { files, warnings };
}

/** Unique project-relative dirs to scan for CLI patterns (R41). */
export function patternScanDirs(
	templatesDir: string | undefined,
	patternsDir: string | undefined
): Array<{ dir: string; warnUnknown: boolean }> {
	const patterns = patternsDir?.trim() ?? '';
	const templates = templatesDir?.trim() ?? '';
	if (patterns && templates && normalizeDir(patterns) === normalizeDir(templates)) {
		return [{ dir: patterns, warnUnknown: false }];
	}
	const out: Array<{ dir: string; warnUnknown: boolean }> = [];
	if (patterns) out.push({ dir: patterns, warnUnknown: true });
	if (templates) out.push({ dir: templates, warnUnknown: false });
	return out;
}
