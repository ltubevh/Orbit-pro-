
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import * as geminiService from '../services/geminiService';
import { ChatIcon } from './icons/ChatIcon';
import { CloseIcon } from './icons/CloseIcon';
import { SendIcon } from './icons/SendIcon';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && !chatRef.current) {
            chatRef.current = geminiService.startChat();
            setMessages([{ sender: 'bot', text: 'Hello! How can I help you with your video project today?' }]);
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || isLoading) return;
        
        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const botMessage: Message = { sender: 'bot', text: '' };
        setMessages(prev => [...prev, botMessage]);

        try {
            if (chatRef.current) {
                const stream = await chatRef.current.sendMessageStream({ message: input });
                let text = '';
                for await (const chunk of stream) {
                    text += chunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { sender: 'bot', text };
                        return newMessages;
                    });
                }
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { sender: 'bot', text: 'Sorry, I encountered an error.' };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading]);

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 z-50"
            >
                {isOpen ? <CloseIcon className="h-8 w-8" /> : <ChatIcon className="h-8 w-8" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 w-96 h-[32rem] bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl flex flex-col z-50 animate-in fade-in-0 slide-in-from-bottom-5">
                    <header className="p-4 border-b border-gray-700">
                        <h3 className="font-bold text-lg text-white">Orbit Assistant</h3>
                    </header>
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <footer className="p-4 border-t border-gray-700">
                        <div className="flex items-center bg-gray-900 rounded-lg">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask anything..."
                                className="flex-grow bg-transparent p-3 text-white focus:outline-none"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 text-indigo-400 hover:text-indigo-300 disabled:text-gray-600">
                                <SendIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </footer>
                </div>
            )}
        </>
    );
};

export default ChatBot;
