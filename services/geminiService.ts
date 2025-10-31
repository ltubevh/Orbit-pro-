
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { UserInput, VideoIdea } from '../types';

const getGenAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateVideoIdeas = async (input: UserInput): Promise<VideoIdea[]> => {
    const ai = getGenAI();
    const prompt = `
        You are Orbit Fast, a creative AI for the YouTube channel "Pro". Your task is to generate 3 unique, non-plagiarized video ideas based on the user's input.
        The channel produces high-quality, international English language educational videos.
        The ideas MUST be 100% compliant with YouTube Partner Program (YPP) standards.
        Strictly avoid political, religious, or racial themes.
        The output must be a JSON array of objects, where each object has a "title" and a "description".

        User Input:
        - Topic: "${input.topic}"
        - Video Type: "${input.videoType}"
        - Gemini TTS Voice Style: "${input.geminiTtsDescription}"
        - Tone.js Sound Style: "${input.toneJsDescription}"

        Generate 3 distinct and engaging ideas.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["title", "description"]
                }
            }
        }
    });

    try {
        const jsonText = response.text.trim();
        const ideas = JSON.parse(jsonText);
        return ideas;
    } catch (e) {
        console.error("Failed to parse Gemini response:", response.text);
        throw new Error("Could not parse video ideas from the AI. Please try again.");
    }
};

export const generateScript = async (title: string): Promise<string> => {
    const ai = getGenAI();
    const prompt = `
        You are Orbit Write, a master scribe AI. Your task is to write a detailed, insightful, long-form script based on the video title: "${title}".
        The tone must be conversational and authoritative. Use analogies and rich vocabulary.
        Ensure flawless English grammar, spelling, and punctuation. The output must feel human-created.
        For a quiz, create 10 questions with clever distractors and exceptionally detailed answer explanations.
        For a teaching video, create a clear, engaging, and comprehensive lesson.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};

export const generateTitleDescription = async (title: string): Promise<{ description: string; sources: { title: string; uri: string }[] }> => {
    const ai = getGenAI();
    const prompt = `
        You are Orbit About, a YouTube Marketing Specialist AI.
        Based on the video topic "${title}", generate a highly clickable, SEO-friendly Title and a detailed, keyword-rich Description.
        The description should accurately summarize the video and include relevant calls to action like "Like, Share, and Subscribe!" and "See you tomorrow at 6 PM for another challenge!".
        The response MUST be grounded in up-to-date information from Google Search.
    `;
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
        .map(chunk => chunk.web)
        .filter(web => web && web.uri && web.title)
        .map(web => ({ title: web.title!, uri: web.uri! }));

    return { description: response.text, sources };
};

export const generateThumbnails = async (title: string): Promise<string[]> => {
    const ai = getGenAI();
    const prompt = `
      You are Orbit Image, a visual marketing designer.
      Generate a visually stunning, high-impact, clickable YouTube thumbnail for a video titled: "${title}".
      The thumbnail should be vibrant, have high contrast, and clearly communicate the video's topic. Avoid text if possible, focus on strong visuals.
      Style: cinematic, dramatic lighting, epic.
    `;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 5,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });
    
    return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);
};

export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with an engaging and clear international English accent: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("Audio generation failed.");
    return `data:audio/mpeg;base64,${base64Audio}`;
};

export const generateVideo = async (prompt: string, screenSize: string): Promise<string> => {
    const ai = getGenAI();
    const aspectRatio = screenSize.toLowerCase().includes('portrait') || screenSize.toLowerCase().includes('9:16') ? '9:16' : '16:9';
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A high-resolution, cinematic, educational video about: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed to produce a download link.");

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const startChat = () => {
    const ai = getGenAI();
    return ai.chats.create({
        // Fix: Corrected model name as per coding guidelines.
        model: 'gemini-flash-lite-latest',
        config: {
            systemInstruction: 'You are a helpful assistant for the Project Orbit application. Answer questions concisely.',
        },
    });
};
