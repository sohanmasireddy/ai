import OpenAI from 'openai';

const MODEL = 'nvidia/nemotron-3.5-super-vl:free';
const MAX_MESSAGES = 40;
const MAX_MESSAGE_LENGTH = 12_000;

type ChatMessage = {
	role: 'user' | 'assistant';
	content: string;
};

type Env = {
	OPENROUTER_API_KEY?: string;
};

type PagesContext = {
	request: Request;
	env: Env;
};

function isChatMessage(value: unknown): value is ChatMessage {
	if (!value || typeof value !== 'object') return false;
	const message = value as Record<string, unknown>;
	return (
		(message.role === 'user' || message.role === 'assistant') &&
		typeof message.content === 'string' &&
		message.content.length > 0 &&
		message.content.length <= MAX_MESSAGE_LENGTH
	);
}

export async function onRequestPost({ request, env }: PagesContext): Promise<Response> {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return Response.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
	}

	const messages = (body as { messages?: unknown } | null)?.messages;
	if (
		!Array.isArray(messages) ||
		messages.length === 0 ||
		messages.length > MAX_MESSAGES ||
		!messages.every(isChatMessage) ||
		messages[messages.length - 1].role !== 'user'
	) {
		return Response.json(
			{ error: 'Provide up to 40 valid chat messages, ending with a user message.' },
			{ status: 400 }
		);
	}

	if (!env.OPENROUTER_API_KEY) {
		return Response.json(
			{ error: 'OpenRouter is not configured. Add the OPENROUTER_API_KEY secret.' },
			{ status: 500 }
		);
	}

	try {
		const client = new OpenAI({
			baseURL: 'https://openrouter.ai/api/v1',
			apiKey: env.OPENROUTER_API_KEY
		});
		const completion = await client.chat.completions.create({
			model: MODEL,
			messages,
			stream: true
		});
		const encoder = new TextEncoder();
		const stream = new ReadableStream<Uint8Array>({
			async start(controller) {
				try {
					for await (const chunk of completion) {
						const content = chunk.choices[0]?.delta?.content;
						if (typeof content === 'string') controller.enqueue(encoder.encode(content));
					}
					controller.close();
				} catch (error) {
					controller.error(error);
				}
			}
		});

		return new Response(stream, {
			headers: {
				'content-type': 'text/plain; charset=utf-8',
				'cache-control': 'no-cache, no-transform',
				'x-content-type-options': 'nosniff'
			}
		});
	} catch (error) {
		console.error('OpenRouter request failed:', error);
		return Response.json({ error: 'OpenRouter could not complete the request.' }, { status: 502 });
	}
}
