
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { UserInput, VideoIdea, VideoType, Storyboard } from '../types';

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

export const generateScript = async (title: string, videoType: VideoType): Promise<Storyboard> => {
    const ai = getGenAI();
    const prompt = `
        You are Orbit Write, an expert creator of viral educational YouTube videos for the channel "Pro".
        Your task is to generate a complete, second-by-second storyboard for a ${videoType} video on the topic: "${title}".
        The output MUST be a JSON object that strictly adheres to the provided schema.

        The video structure must follow this professional, engaging format:
        1.  **Preparation:** A short, clear instruction for viewers to get a pen and paper to track their score.
        2.  **Quiz Section:** Create exactly 10 high-quality, challenging questions.
            - Each question must have 4 options (A, B, C, D).
            - For each question, provide a detailed explanation for the correct answer.
            - CRITICAL: Also provide a concise explanation for WHY the other options are incorrect. This is for deeper learning.
            - Suggest a simple, relevant visual (image or short clip) for each question.
            - Classify each question's difficulty as 'easy', 'medium', or 'hard'.
        3.  **Results Section:** Create 4 tiers for scoring, from perfect to needs improvement. Include an encouraging message for lower scores. Describe a visual effect for each tier (e.g., 'sparkling diamonds', 'golden stars').
        4.  **Engagement Section:**
            - Create a "Challenge of the Week": a new, interesting question to be answered in the comments.
            - Include a call to action to find the "Pro Comment of the Week" in the next video.
        5.  **Final Call to Action:** A standard CTA mentioning the daily upload schedule (6 PM EAT) and encouraging viewers to subscribe and hit the bell icon.

        The tone should be professional, encouraging, and clear. The language must be international English.
        Ensure all content is 100% compliant with YouTube Partner Program (YPP) standards and avoids sensitive topics.
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    preparation: { type: Type.STRING, description: "Text for the preparation slide, e.g., 'Grab a pen and paper!'" },
                    questions: {
                        type: Type.ARRAY,
                        description: "An array of 10 quiz questions.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                questionText: { type: Type.STRING },
                                options: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: { key: { type: Type.STRING }, text: { type: Type.STRING } },
                                        required: ["key", "text"]
                                    }
                                },
                                correctAnswerKey: { type: Type.STRING },
                                explanation: { type: Type.STRING, description: "Detailed explanation for the correct answer." },
                                wrongAnswerExplanations: { type: Type.STRING, description: "Explanation of why other options are incorrect." },
                                visualSuggestion: { type: Type.STRING, description: "A simple visual suggestion for the question." },
                                difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] }
                            },
                            required: ["questionText", "options", "correctAnswerKey", "explanation", "wrongAnswerExplanations", "visualSuggestion", "difficulty"]
                        }
                    },
                    results: {
                        type: Type.ARRAY,
                        description: "Different result messages based on score.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                score: { type: Type.STRING, description: "e.g., 10/10 or <7/10" },
                                level: { type: Type.STRING, description: "e.g., PRO LEVEL" },
                                message: { type: Type.STRING },
                                visualEffect: { type: Type.STRING }
                            },
                            required: ["score", "level", "message", "visualEffect"]
                        }
                    },
                    challenge: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            callToAction: { type: Type.STRING }
                        },
                        required: ["question", "callToAction"]
                    },
                    callToAction: { type: Type.STRING, description: "Final call to action about daily videos." }
                },
                required: ["preparation", "questions", "results", "challenge", "callToAction"]
            },
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    
    try {
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse storyboard from Gemini response:", response.text);
        throw new Error("Could not parse the video storyboard from the AI. Please try again.");
    }
};

export const createScriptFromStoryboard = (storyboard: Storyboard): string => {
    let script = [];
    script.push(storyboard.preparation);

    storyboard.questions.forEach((q, index) => {
        script.push(`Question ${index + 1}.`);
        script.push(q.questionText);
        q.options.forEach(opt => {
            script.push(`${opt.key}. ${opt.text}`);
        });
        script.push(`The correct answer is ${q.correctAnswerKey}.`);
        script.push(q.explanation);
        script.push(q.wrongAnswerExplanations);
    });

    script.push("Time to check your score! How did you do?");
    storyboard.results.forEach(r => {
        script.push(`If you scored ${r.score}. ${r.level}! ${r.message}`);
    });

    script.push("Here's a challenge for our pros!");
    script.push(storyboard.challenge.question);
    script.push(storyboard.challenge.callToAction);
    script.push(storyboard.callToAction);

    return script.join(' \n\n');
};

export const createVideoPromptFromStoryboard = (storyboard: Storyboard): string => {
    const visualElements = storyboard.questions.map((q, i) => `Scene ${i+1}: ${q.visualSuggestion}`).join('; ');
    const resultVisuals = storyboard.results.map(r => `${r.level}: ${r.visualEffect}`).join('; ');

    return `
      Create a dynamic, professional educational quiz video. The video should be visually engaging with clear, modern text animations.
      The video has 10 questions. Key visual elements to include are: ${visualElements}.
      The results section should feature celebratory visuals like: ${resultVisuals}.
      The overall style should be cinematic, high-resolution, and suitable for an educational YouTube channel called "Pro".
    `;
};


export const generateTitleDescription = async (title: string): Promise<{ description: string; sources: { title: string; uri: string }[] }> => {
    const ai = getGenAI();
    const prompt = `
        You are Orbit About, a YouTube Marketing Specialist AI.
        Based on the video topic "${title}", generate a highly clickable, SEO-friendly Title and a detailed, keyword-rich Description.
        The title should be exciting and in a "Challenge" format, e.g., "English Grammar Challenge! | Only a PRO Can Score 10/10".
        The description should:
        1. Accurately summarize the video's quiz/challenge format.
        2. Include a call to action to comment on the "Challenge of the Week".
        3. Include a standard call to action like "Like, Share, and Subscribe!" and "See you tomorrow at 6 PM EAT for another challenge!".
        4. Be keyword-rich for YouTube SEO.
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
      prompt: prompt,
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
