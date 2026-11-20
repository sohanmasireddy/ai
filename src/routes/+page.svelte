<script lang="ts">
	import { ArrowUp, Bot, LoaderCircle, Sparkles } from 'lucide-svelte';

	type Message = {
		role: 'user' | 'assistant';
		content: string;
	};

	let messages = $state<Message[]>([
		{
			role: 'assistant',
			content: 'Hi! I’m ready to help. What would you like to explore?'
		}
	]);
	let draft = $state('');
	let sending = $state(false);
	let errorMessage = $state('');
	let messagesElement: HTMLDivElement;

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const content = draft.trim();
		if (!content || sending) return;

		errorMessage = '';
		draft = '';
		messages.push({ role: 'user', content });
		messages.push({ role: 'assistant', content: '' });
		sending = true;

		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ messages: messages.slice(0, -1) })
			});

			if (!response.ok) {
				const result = (await response.json().catch(() => null)) as
					| { error?: string }
					| null;
				throw new Error(result?.error ?? 'The request could not be completed.');
			}

			if (!response.body) {
				throw new Error('The response did not include a readable stream.');
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				messages[messages.length - 1].content += decoder.decode(value, { stream: true });
			}
			messages[messages.length - 1].content += decoder.decode();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Something went wrong.';
			if (!messages[messages.length - 1].content) messages.pop();
		} finally {
			sending = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			const form = event.currentTarget as HTMLTextAreaElement;
			form.form?.requestSubmit();
		}
	}

	$effect(() => {
		messages.length;
		messages[messages.length - 1]?.content;
		if (messagesElement) messagesElement.scrollTop = messagesElement.scrollHeight;
	});
</script>

<svelte:head>
	<title>OpenRouter Chat</title>
	<meta
		name="description"
		content="A streaming AI chat powered by OpenRouter and deployed on Cloudflare Pages."
	/>
</svelte:head>

<main class="chat-shell">
	<header class="topbar">
		<a class="brand" href="/" aria-label="OpenRouter Chat home">
			<span class="brand-mark"><Sparkles size={18} strokeWidth={2.2} /></span>
			<span>orbit<span class="brand-dot">.</span></span>
		</a>
		<div class="model-badge"><span class="status-dot"></span> Nemotron 3.5 Super VL</div>
	</header>

	<section class="conversation" aria-label="Chat conversation">
		<div class="conversation-heading">
			<p class="eyebrow">YOUR AI COMPANION</p>
			<h1>A little clarity,<br />one message away.</h1>
			<p class="intro">Ask a question, explore an idea, or just get started.</p>
		</div>

		<div class="messages" bind:this={messagesElement} aria-live="polite">
			{#each messages as message, index}
				<div class:from-user={message.role === 'user'} class="message-row">
					{#if message.role === 'assistant'}
						<div class="avatar"><Bot size={17} /></div>
					{/if}
					<div class="message-content">
						{#if message.content}
							<p>{message.content}</p>
						{:else if sending && index === messages.length - 1}
							<div class="thinking" aria-label="Thinking">
								<span></span><span></span><span></span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if errorMessage}
			<p class="error-message" role="alert">{errorMessage}</p>
		{/if}

		<form class="composer" onsubmit={submit}>
			<label class="sr-only" for="prompt">Message</label>
			<textarea
				id="prompt"
				bind:value={draft}
				onkeydown={handleKeydown}
				placeholder="Message orbit..."
				rows="1"
				disabled={sending}
			></textarea>
			<div class="composer-footer">
				<p><span>↵</span> to send <span class="shortcut-separator">·</span> shift + ↵ for a new line</p>
				<button
					class="send-button"
					type="submit"
					disabled={sending || !draft.trim()}
					aria-label={sending ? 'Waiting for response' : 'Send message'}
				>
					{#if sending}
						<LoaderCircle size={18} class="spinner" />
					{:else}
						<ArrowUp size={19} strokeWidth={2.4} />
					{/if}
				</button>
			</div>
		</form>
		<p class="disclaimer">AI can make mistakes. Check important information.</p>
	</section>
</main>
