
import React, { useState, useRef, useCallback } from 'react';
// Fix: Removed LiveSession from import as it is not exported from the module.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { MicIcon } from './icons/MicIcon';
import { StopIcon } from './icons/StopIcon';

// Fix: Added local interface for LiveSession to provide type safety.
interface LiveSession {
    sendRealtimeInput(input: { media: Blob }): void;
    close(): void;
}

// Helper functions for audio processing
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const LiveConversation: React.FC = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcription, setTranscription] = useState<{ user: string, model: string }>({ user: '', model: '' });
    const [isModelSpeaking, setIsModelSpeaking] = useState(false);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    let nextStartTime = 0;
    const sources = new Set<AudioBufferSourceNode>();

    const stopConversation = useCallback(() => {
        setIsListening(false);
        setIsModelSpeaking(false);
        setTranscription({ user: '', model: ''});

        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
        
        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;
        
        inputAudioContextRef.current?.close();
        inputAudioContextRef.current = null;
        outputAudioContextRef.current?.close();
        outputAudioContextRef.current = null;
    }, []);

    const startConversation = useCallback(async () => {
        if (isListening) {
            stopConversation();
            return;
        }
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            setIsListening(true);
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            
            let currentInputTranscription = '';
            let currentOutputTranscription = '';

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcription
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscription += message.serverContent.inputTranscription.text;
                            setTranscription(prev => ({...prev, user: currentInputTranscription}));
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscription += message.serverContent.outputTranscription.text;
                            setTranscription(prev => ({...prev, model: currentOutputTranscription}));
                        }
                        if(message.serverContent?.turnComplete){
                            currentInputTranscription = '';
                            currentOutputTranscription = '';
                        }
                        
                        // Handle audio playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            setIsModelSpeaking(true);
                            nextStartTime = Math.max(nextStartTime, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const sourceNode = outputAudioContextRef.current.createBufferSource();
                            sourceNode.buffer = audioBuffer;
                            sourceNode.connect(outputAudioContextRef.current.destination);
                            
                            sourceNode.onended = () => {
                                sources.delete(sourceNode);
                                if (sources.size === 0) {
                                    setIsModelSpeaking(false);
                                }
                            };
                            
                            sourceNode.start(nextStartTime);
                            nextStartTime += audioBuffer.duration;
                            sources.add(sourceNode);
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of sources.values()) {
                                source.stop();
                            }
                            sources.clear();
                            nextStartTime = 0;
                            setIsModelSpeaking(false);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        stopConversation();
                    },
                    onclose: (e: CloseEvent) => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
            });

        } catch (error) {
            console.error("Failed to start conversation:", error);
            alert("Could not access microphone.");
            setIsListening(false);
        }
    }, [isListening, stopConversation]);

    return (
        <div className="flex flex-col items-center">
            <button onClick={startConversation} className={`p-4 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-green-500 hover:bg-green-600'}`}>
                {isListening ? <StopIcon className="h-6 w-6 text-white" /> : <MicIcon className="h-6 w-6 text-white" />}
            </button>
            {isListening && (
                <div className="mt-4 p-4 bg-gray-800/80 rounded-lg w-72 text-center backdrop-blur-sm">
                    <p className="text-sm text-gray-400">User:</p>
                    <p className="text-white min-h-[2rem]">{transcription.user || '...'}</p>
                    <p className="text-sm text-gray-400 mt-2">Model:</p>
                    <p className={`text-white min-h-[2rem] ${isModelSpeaking ? 'text-indigo-300' : ''}`}>{transcription.model || (isListening ? '...' : '')}</p>
                </div>
            )}
        </div>
    );
};

export default LiveConversation;
