<!-- SPDX-FileCopyrightText: 2026 CalmStudio Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

<script lang="ts">
	import NodePalette from '$lib/palette/NodePalette.svelte';
	import FileExplorerPanel from '$lib/explorer/FileExplorerPanel.svelte';

	type LeftPanelTab = 'palette' | 'files';

	const TAB_STORAGE_KEY = 'calm-studio-left-panel-tab';

	interface Props {
		onplacenode?: (type: string) => void;
		currentFileRelativePath?: string | null;
		onopenexplorerfile?: (
			content: string,
			name: string,
			relativePath: string,
			handle: FileSystemFileHandle
		) => void;
	}

	let { onplacenode, currentFileRelativePath = null, onopenexplorerfile }: Props = $props();

	function loadInitialTab(): LeftPanelTab {
		if (typeof sessionStorage === 'undefined') return 'palette';
		const stored = sessionStorage.getItem(TAB_STORAGE_KEY);
		return stored === 'files' ? 'files' : 'palette';
	}

	let activeTab = $state<LeftPanelTab>(loadInitialTab());

	function setTab(tab: LeftPanelTab) {
		activeTab = tab;
		sessionStorage.setItem(TAB_STORAGE_KEY, tab);
	}
</script>

<div class="left-sidebar">
	<div class="tab-bar" role="tablist">
		<button
			type="button"
			role="tab"
			class="tab"
			class:active={activeTab === 'palette'}
			aria-selected={activeTab === 'palette'}
			onclick={() => setTab('palette')}
		>
			Palette
		</button>
		<button
			type="button"
			role="tab"
			class="tab"
			class:active={activeTab === 'files'}
			aria-selected={activeTab === 'files'}
			onclick={() => setTab('files')}
		>
			Files
		</button>
	</div>

	<div class="panel-body" role="tabpanel">
		{#if activeTab === 'palette'}
			<NodePalette {onplacenode} />
		{:else}
			<FileExplorerPanel {currentFileRelativePath} onopenfile={onopenexplorerfile} />
		{/if}
	</div>
</div>

<style>
	.left-sidebar {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-width: 0;
		height: 100%;
		overflow: hidden;
	}

	.tab-bar {
		display: flex;
		gap: 2px;
		padding: 6px 8px 0;
		border-bottom: 1px solid var(--color-border);
		flex-shrink: 0;
	}

	.tab {
		flex: 1;
		padding: 6px 8px;
		font-size: 11.5px;
		font-weight: 500;
		border: none;
		border-radius: 6px 6px 0 0;
		background: transparent;
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.tab.active {
		background: var(--color-surface);
		color: var(--color-text-primary);
		box-shadow: inset 0 -2px 0 var(--color-accent, #3b82f6);
	}

	.panel-body {
		flex: 1;
		min-height: 0;
		min-width: 0;
		width: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
</style>
