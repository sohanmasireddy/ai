<script lang="ts">
	import { ArrowUp, Bot, FileText, Globe2, LoaderCircle, Paperclip, Sparkles, X } from 'lucide-svelte';

	type ModelId =
		| 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'
		| 'nvidia/nemotron-3.5-lightning:free'
		| 'nvidia/nemotron-3-ultra-550b-a55b:free'
		| 'nvidia/nemotron-3.5-super-vl:free';
	type Attachment = {
		name: string;
		mimeType: string;
		size: number;
		dataUrl?: string;
		text?: string;
	};
	type Source = { title: string; url: string };
	type Message = {
		role: 'user' | 'assistant';
		content: string;
		displayContent?: string;
		attachments?: Attachment[];
		sources?: Source[];
	};

	const models: { id: ModelId; label: string }[] = [
		{ id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: 'Nemotron 3 Nano Omni' },
		{ id: 'nvidia/nemotron-3.5-lightning:free', label: 'Nemotron 3.5 Lightning' },
		{ id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra' },
		{ id: 'nvidia/nemotron-3.5-super-vl:free', label: 'Nemotron 3.5 Super VL' }
	];
	const nanoOmniId: ModelId = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';
	const imageModelIds = new Set<ModelId>([
		nanoOmniId,
		'nvidia/nemotron-3.5-super-vl:free'
	]);
	const maxFileSize = 8 * 1024 * 1024;
	const maxTotalFileSize = 16 * 1024 * 1024;
	const allowedTextExtensions = new Set(['txt', 'md', 'csv', 'json', 'log']);

	let messages = $state<Message[]>([
		{
			role: 'assistant',
			content: 'Hi! I’m ready to help. What would you like to explore?'
		}
	]);
	let selectedModel = $state<ModelId>(nanoOmniId);
	let draft = $state('');
	let attachments = $state<Attachment[]>([]);
	let webSearch = $state(false);
	let sending = $state(false);
	let readingFiles = $state(false);
	let errorMessage = $state('');
	let messagesElement: HTMLDivElement;
	let fileInputElement: HTMLInputElement;

	function supportsImages(model: ModelId): boolean {
		return imageModelIds.has(model);
	}

	function readAsDataUrl(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				if (typeof reader.result === 'string') resolve(reader.result);
				else reject(new Error(`Could not read ${file.name}.`));
			};
			reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
			reader.readAsDataURL(file);
		});
	}

	async function compressImage(attachment: Attachment): Promise<Attachment> {
		if (!attachment.dataUrl) return attachment;

		const image = await createImageBitmap(await (await fetch(attachment.dataUrl)).blob());
		try {
			const maxDimension = 1600;
			const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(image.width * scale));
			canvas.height = Math.max(1, Math.round(image.height * scale));
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Image compression is unavailable in this browser.');
			context.drawImage(image, 0, 0, canvas.width, canvas.height);
			const compressed = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(
					(blob) => (blob ? resolve(blob) : reject(new Error(`Could not compress ${attachment.name}.`))),
					'image/jpeg',
					0.82
				);
			});
			if (compressed.size >= attachment.size) return attachment;
			return {
				...attachment,
				mimeType: 'image/jpeg',
				size: compressed.size,
				dataUrl: await readAsDataUrl(new File([compressed], attachment.name, { type: 'image/jpeg' }))
			};
		} finally {
			image.close();
		}
	}

	async function addFiles(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const files = Array.from(input.files ?? []);
		input.value = '';
		if (files.length === 0) return;
		if (attachments.length + files.length > 5) {
			errorMessage = 'You can attach up to 5 files per message.';
			return;
		}
		if (attachments.reduce((total, attachment) => total + attachment.size, 0) + files.reduce((total, file) => total + file.size, 0) > maxTotalFileSize) {
			errorMessage = 'Attachments must total 16 MB or less per message.';
			return;
		}

		readingFiles = true;
		errorMessage = '';
		try {
			const newAttachments = await Promise.all(
				files.map(async (file): Promise<Attachment> => {
					if (file.size > maxFileSize) {
						throw new Error(`${file.name} is too large. Files must be 8 MB or smaller.`);
					}
					if (file.type.startsWith('image/')) {
						if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
							throw new Error('Upload JPEG, PNG, or WebP images.');
						}
						if (!supportsImages(selectedModel)) {
							throw new Error('This model cannot process images. Choose Nano Omni or Super VL to attach images.');
						}
						return {
							name: file.name,
							mimeType: file.type,
							size: file.size,
							dataUrl: await readAsDataUrl(file)
						};
					}

					const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
					if (!allowedTextExtensions.has(extension) || file.size > 256 * 1024) {
						throw new Error('Upload an image or a text file (TXT, MD, CSV, JSON, or LOG) up to 256 KB.');
					}
					const text = await file.text();
					if (text.length > 80_000) {
						throw new Error(`${file.name} contains too much text. Text attachments are limited to 80,000 characters.`);
					}
					return {
						name: file.name,
						mimeType: file.type || 'text/plain',
						size: file.size,
						text
					};
				})
			);
			attachments.push(...newAttachments);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not read the selected files.';
		} finally {
			readingFiles = false;
		}
	}

	function buildWireMessage(message: Message, includeImages: boolean) {
		if (message.role === 'assistant') return { role: message.role, content: message.content };
		const parts: ({ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } })[] = [];
		let text = message.content;
		for (const attachment of message.attachments ?? []) {
			if (attachment.text !== undefined) {
				text += `${text ? '\n\n' : ''}[Attached file: ${attachment.name}]\n${attachment.text}`;
			} else if (attachment.dataUrl && !includeImages) {
				text += `${text ? '\n\n' : ''}[Image ${attachment.name} was omitted because the selected model does not support image input.]`;
			}
		}
		if (text) parts.push({ type: 'text', text });
		if (includeImages) {
			for (const attachment of message.attachments ?? []) {
				if (!attachment.dataUrl) continue;
				parts.push({ type: 'image_url', image_url: { url: attachment.dataUrl } });
			}
		}
		if (parts.length === 0) parts.push({ type: 'text', text: 'Please analyze the attached file.' });
		return { role: message.role, content: parts };
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		const content = draft.trim();
		if ((!content && attachments.length === 0) || sending || readingFiles) return;
		if (webSearch && !content) {
			errorMessage = 'Add a text question to search DuckDuckGo.';
			return;
		}
		if (!supportsImages(selectedModel) && attachments.some((attachment) => attachment.dataUrl)) {
			errorMessage = 'This model cannot process images. Choose Nano Omni or Super VL to send this image.';
			return;
		}

		errorMessage = '';
		sending = true;

		try {
			const outgoingAttachments =
				selectedModel === nanoOmniId
					? await Promise.all(attachments.map((attachment) => compressImage(attachment)))
					: attachments;
			const userMessage: Message = {
				role: 'user',
				content,
				displayContent: content,
				attachments: outgoingAttachments
			};
			messages.push(userMessage);
			draft = '';
			attachments = [];
			messages.push({ role: 'assistant', content: '' });
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					model: selectedModel,
					webSearch,
					messages: messages.slice(0, -1).map((message) => buildWireMessage(message, supportsImages(selectedModel)))
				})
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
			const sourcesHeader = response.headers.get('x-web-sources');
			if (sourcesHeader) {
				messages[messages.length - 1].sources = JSON.parse(decodeURIComponent(sourcesHeader)) as Source[];
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
			if (messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1].content) {
				messages.pop();
			}
		} finally {
			sending = false;
		}
	}

	function removeAttachment(index: number) {
		attachments.splice(index, 1);
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
		<label class="model-picker">
			<span class="status-dot"></span>
			<span class="sr-only">Choose a model</span>
			<select bind:value={selectedModel} disabled={sending}>
				{#each models as model}
					<option value={model.id}>{model.label}</option>
				{/each}
			</select>
		</label>
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
						{#if message.displayContent ?? message.content}
							<p>{message.displayContent ?? message.content}</p>
						{:else if sending && index === messages.length - 1}
							<div class="thinking" aria-label="Thinking">
								<span></span><span></span><span></span>
							</div>
						{/if}
						{#if message.attachments?.length}
							<div class="message-attachments">
								{#each message.attachments as attachment}
									{#if attachment.dataUrl}
										<img src={attachment.dataUrl} alt={attachment.name} />
									{:else}
										<span><FileText size={14} /> {attachment.name}</span>
									{/if}
								{/each}
							</div>
						{/if}
						{#if message.sources?.length}
							<div class="source-list">
								<span>DuckDuckGo sources</span>
								{#each message.sources as source}
									<a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
								{/each}
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
			{#if attachments.length}
				<div class="attachment-list">
					{#each attachments as attachment, index}
						<div class="attachment-chip">
							{#if attachment.dataUrl}
								<img src={attachment.dataUrl} alt="" />
							{:else}
								<FileText size={14} />
							{/if}
							<span>{attachment.name}</span>
							<button type="button" aria-label={`Remove ${attachment.name}`} onclick={() => removeAttachment(index)}>
								<X size={14} />
							</button>
						</div>
					{/each}
				</div>
			{/if}
			<textarea
				id="prompt"
				bind:value={draft}
				onkeydown={handleKeydown}
				placeholder="Message orbit..."
				rows="1"
				disabled={sending}
			></textarea>
			<div class="composer-footer">
				<div class="composer-actions">
					<input
						bind:this={fileInputElement}
						class="sr-only"
						type="file"
						accept="image/jpeg,image/png,image/webp,.txt,.md,.csv,.json,.log"
						multiple
						onchange={addFiles}
					/>
					<button
						class="tool-button"
						type="button"
						disabled={sending || readingFiles || attachments.length >= 5}
						aria-label="Attach files or images"
						onclick={() => fileInputElement.click()}
					>
						{#if readingFiles}
							<LoaderCircle size={16} class="spinner" />
						{:else}
							<Paperclip size={16} />
						{/if}
					</button>
					<button
						class:active={webSearch}
						class="tool-button search-toggle"
						type="button"
						disabled={sending}
						aria-pressed={webSearch}
						onclick={() => (webSearch = !webSearch)}
					>
						<Globe2 size={15} /> Search web
					</button>
				</div>
				<div class="composer-actions">
					<p class="keyboard-hint"><span>↵</span> to send <span class="shortcut-separator">·</span> shift + ↵ for a new line</p>
					<button
						class="send-button"
						type="submit"
						disabled={sending || readingFiles || (!draft.trim() && attachments.length === 0)}
						aria-label={sending ? 'Waiting for response' : 'Send message'}
					>
						{#if sending}
							<LoaderCircle size={18} class="spinner" />
						{:else}
							<ArrowUp size={19} strokeWidth={2.4} />
						{/if}
					</button>
				</div>
			</div>
			{#if !supportsImages(selectedModel)}
				<p class="model-hint">Image uploads are available with Nano Omni and Super VL.</p>
			{/if}
		</form>
		<p class="disclaimer">AI can make mistakes. Check important information.</p>
	</section>
</main>
