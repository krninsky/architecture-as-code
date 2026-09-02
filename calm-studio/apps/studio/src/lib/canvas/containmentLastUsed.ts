// SPDX-FileCopyrightText: 2026 CalmStudio Contributors
//
// SPDX-License-Identifier: Apache-2.0

/** Session-only last-used containment variant per container (R39 / #36). */

export type ContainmentVariant = 'composed-of' | 'deployed-in';

const lastUsed = new Map<string, ContainmentVariant>();

export function getLastUsedContainment(containerId: string): ContainmentVariant | undefined {
	return lastUsed.get(containerId);
}

export function setLastUsedContainment(containerId: string, variant: ContainmentVariant): void {
	lastUsed.set(containerId, variant);
}

export function clearLastUsedContainment(): void {
	lastUsed.clear();
}

export function containmentVariantsOnParent(
	parentId: string,
	edges: Array<{ source: string; type?: string }>
): ContainmentVariant[] {
	const found = new Set<ContainmentVariant>();
	for (const e of edges) {
		if (e.source !== parentId) continue;
		if (e.type === 'composed-of' || e.type === 'deployed-in') {
			found.add(e.type);
		}
	}
	return [...found];
}
