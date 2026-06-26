<!-- SPDX-FileCopyrightText: 2026 CalmStudio Contributors -->
<!-- SPDX-License-Identifier: Apache-2.0 -->

<!--
  GemaraSections.svelte — the "Decorators" area of the inspector for an element
  (a node, a relationship, or the whole architecture). This is now scoped to
  free-form CALM decorators only — Gemara guidance and control attachments are
  managed in the Governance tab (the connected AIGF + CCC flow), so they are no
  longer duplicated here.
-->
<script lang="ts">
	import DecoratorSection from './DecoratorSection.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import { getModel } from '$lib/stores/calmModel.svelte';
	import { isGemaraDecorator } from '@calmstudio/calm-core';

	let {
		elementId,
		onmutate,
	}: {
		elementId: string;
		onmutate?: () => void;
	} = $props();

	// Custom (non-Gemara) decorators bound to this element — Gemara links live in
	// the Governance tab.
	const total = $derived(
		(getModel().decorators ?? []).filter(
			(d) => d['applies-to'].includes(elementId) && !isGemaraDecorator(d),
		).length,
	);
</script>

<CollapsibleSection label="Decorators" count={total}>
	<div class="group-body">
		<DecoratorSection {elementId} {onmutate} />
	</div>
</CollapsibleSection>

<style>
	/* Nest the sub-sections under the group with a subtle indent. */
	.group-body {
		padding-left: 10px;
	}
</style>
