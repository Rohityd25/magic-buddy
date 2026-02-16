import OpenAI from 'openai';

let openai: OpenAI | null = null;

export const initializeOpenAI = (apiKey: string) => {
    openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Client-side demo
    });
};

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string | Array<any>;
}

const SYSTEM_PROMPT = `
You are a friendly, enthusiastic, and kind AI companion for a 5-7 year old child.
Your goal is to have a 1-minute fun conversation about the image shown.
- Speak simply and clearly.
- Keep your responses short (1-2 sentences maximum).
- Ask engaging questions about the image or the child's imagination.
- If the child or the conversation suggests a color change (e.g. "It's sunny!", "I like blue"), use the 'change_background' tool.
- Always be encouraging.
`;

export const analyzeImageAndStart = async (base64Image: string): Promise<{ text: string; toolCall?: { color: string }, initialUserMessage: ChatMessage }> => {
    if (!openai) throw new Error("OpenAI not initialized");

    const initialUserMessage: ChatMessage = {
        role: "user",
        content: [
            { type: "text", text: "What is in this image? Start a conversation with a child about it. Say hello and ask a fun question!" },
            {
                type: "image_url",
                image_url: {
                    "url": base64Image,
                },
            },
        ],
    };

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            initialUserMessage as any
        ],
        tools: [
            {
                type: "function",
                function: {
                    name: "change_background",
                    description: "Change the background color of the app.",
                    parameters: {
                        type: "object",
                        properties: {
                            color: { type: "string", description: "A valid CSS color." }
                        },
                        required: ["color"]
                    }
                }
            }
        ]
    });

    const message = response.choices[0].message;
    let toolCall = undefined;

    if (message.tool_calls && message.tool_calls.length > 0) {
        const call = message.tool_calls[0];
        if (call.function.name === 'change_background') {
            try {
                const args = JSON.parse(call.function.arguments);
                toolCall = { color: args.color };
            } catch (e) {
                console.error("Failed to parse tool args", e);
            }
        }
    }

    return {
        text: message.content || "Hello! I see something fun!",
        toolCall,
        initialUserMessage
    };
};

export const continueConversation = async (history: ChatMessage[]): Promise<{ text: string; toolCall?: { color: string } }> => {
    if (!openai) throw new Error("OpenAI not initialized");

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...history as any
        ],
        tools: [
            {
                type: "function",
                function: {
                    name: "change_background",
                    description: "Change the background color of the app.",
                    parameters: {
                        type: "object",
                        properties: {
                            color: { type: "string", description: "A valid CSS color." }
                        },
                        required: ["color"]
                    }
                }
            }
        ]
    });

    const message = response.choices[0].message;
    let toolCall = undefined;

    if (message.tool_calls && message.tool_calls.length > 0) {
        const call = message.tool_calls[0];
        if (call.function.name === 'change_background') {
            try {
                const args = JSON.parse(call.function.arguments);
                toolCall = { color: args.color };
            } catch (e) {
                console.error("Failed to parse tool args", e);
            }
        }
    }

    return {
        text: message.content || "That's interesting! Tell me more.",
        toolCall
    };
};

// --- Mock / Demo Mode ---

export const mockAnalyzeImageAndStart = async (): Promise<{ text: string; toolCall?: { color: string }, initialUserMessage: ChatMessage }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const initialUserMessage: ChatMessage = {
        role: "user",
        content: "Image Analysis Request"
    };

    return {
        text: "Wow! That looks like a super happy dinosaur! Is he going on an adventure?",
        toolCall: { color: "#e3fded" }, // Light green
        initialUserMessage
    };
};

export const mockContinueConversation = async (history: ChatMessage[]): Promise<{ text: string; toolCall?: { color: string } }> => {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lastUserMsg = history[history.length - 1];
    const userText = typeof lastUserMsg.content === 'string' ? lastUserMsg.content.toLowerCase() : '';

    let responseText = "That sounds like so much fun! What else can he do?";
    let toolCall = undefined;

    if (userText.includes('red') || userText.includes('fire') || userText.includes('hot')) {
        responseText = "Oh wow! Red like a volcano! Is it hot?";
        toolCall = { color: "#ffe5e5" };
    } else if (userText.includes('blue') || userText.includes('water') || userText.includes('swim')) {
        responseText = "Splash! Blue like the ocean. Can he swim?";
        toolCall = { color: "#e0f7fa" };
    } else if (userText.includes('green') || userText.includes('grass') || userText.includes('leaf')) {
        responseText = "Yum! Green like fresh leaves. Is he hungry?";
        toolCall = { color: "#e3fded" };
    } else if (userText.includes('fly') || userText.includes('wings')) {
        responseText = "Zoom! Flying high in the sky! Where is he going?";
        toolCall = { color: "#e1f5fe" };
    } else if (userText.includes('eat') || userText.includes('food') || userText.includes('hungry')) {
        responseText = "Crunch crunch! He loves eating big leaves and fruits. What is your favorite food?";
        toolCall = { color: "#fff3e0" }; // Orange/Warm
    } else if (userText.includes('roar') || userText.includes('loud')) {
        responseText = "ROAAAR! He has a big loud voice! Can you roar like a dinosaur?";
        toolCall = { color: "#ffecb3" }; // Yellow/Bold
    } else if (userText.includes('friend') || userText.includes('play')) {
        responseText = "Friends are the best! Does he play tag or hide-and-seek?";
        toolCall = { color: "#f3e5f5" }; // Purple/Playful
    } else if (userText.includes('sleep') || userText.includes('tired') || userText.includes('bed')) {
        responseText = "Shhh... tight sleep. Maybe he dreams of flying?";
        toolCall = { color: "#cfd8dc" }; // Grey/Night
    } else if (userText.includes('yes') || userText.includes('yeah')) {
        responseText = "Yay! I knew it! Tell me more!";
    } else if (userText.includes('no') || userText.includes('nope')) {
        responseText = "Oh really? What mistakes did I make? Tell me the secret!";
    }

    return {
        text: responseText,
        toolCall
    };
};
