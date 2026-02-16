import { useState, useEffect, useRef, useCallback } from 'react';

// Type definition for Web Speech API (Safari/Chrome prefix)
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

export const useSpeech = () => {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const recognitionRef = useRef<any>(null);

    const [isSupported, setIsSupported] = useState(!!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));


    // We need to track if we *intend* to be listening, separate from if the browser *is* listening
    const shouldListenRef = useRef(false);

    useEffect(() => {
        // Initialize Speech Recognition
        const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
        const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

        if (SpeechRecognitionConstructor) {
            setIsSupported(true);
            const recognition = new SpeechRecognitionConstructor();
            recognition.continuous = false; // Keep false for better compatibility, we will manually restart
            recognition.lang = 'en-US';
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log("Speech recognition started");
                setIsListening(true);
            };

            recognition.onresult = (event: any) => {
                console.log("Speech Result:", event.results);
                const last = event.results.length - 1;
                const text = event.results[last][0].transcript;

                // If it's final, or if we just want to show progress
                setTranscript(text);
            };

            recognition.nomatch = () => {
                console.log("No speech matched");
            }

            recognition.onend = () => {
                console.log("Speech recognition ended. Should restart?", shouldListenRef.current);
                setIsListening(false);

                // Auto-restart if we still want to listen and haven't gotten a final result (handled by app)
                // Actually, the App stops listening when it gets a result.
                // But if it just times out silence, we might want to restart?
                // Let's rely on the App to call stopListening() when it's done.
                // If the engine stops on its own (silence), we check if we should still be listening.
                if (shouldListenRef.current) {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.log("Restart failed", e);
                    }
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    shouldListenRef.current = false;
                }
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
        }
    }, []);

    const speak = useCallback((text: string, onEnd?: () => void) => {
        if (!text) return;

        // Cancel any current speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        // Find a better voice if possible
        const voices = window.speechSynthesis.getVoices();
        // Try to find a female, english voice for friendliness
        const friendlyVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Female') || v.name.includes('Google US English')));
        if (friendlyVoice) utterance.voice = friendlyVoice;

        utterance.pitch = 1.2; // Slightly higher pitch for child-friendly tone
        utterance.rate = 1.0;

        // Safety timeout in case onend never fires (common browser bug)
        const contentDuration = Math.max(2000, text.split(' ').length * 500); // Est: 0.5s per word, min 2s
        const safetyTimer = setTimeout(() => {
            if (window.speechSynthesis.speaking) {
                console.warn("Speech timed out, forcing next state");
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
                if (onEnd) onEnd();
            }
        }, contentDuration + 2000); // Give it 2s buffer

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            clearTimeout(safetyTimer);
            setIsSpeaking(false);
            if (onEnd) onEnd();
        };
        utterance.onerror = (e) => {
            clearTimeout(safetyTimer);
            console.error("Speech synthesis error", e);
            setIsSpeaking(false);
            // Even on error, we should probably proceed or let the user try again?
            // Let's proceed to allow flow to continue
            if (onEnd) onEnd();
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    const startListening = useCallback(() => {
        setTranscript('');
        shouldListenRef.current = true;
        if (recognitionRef.current) {
            try {
                // Check if already started? The API throws if you start twice
                recognitionRef.current.start();
            } catch (e) {
                // If it's "invoked start on active...", just ignore
                console.warn("Recognition start called but maybe active", e);
            }
        } else {
            console.error("No recognition instance found");
        }
    }, []);

    const stopListening = useCallback(() => {
        shouldListenRef.current = false;
        if (recognitionRef.current) recognitionRef.current.stop();
    }, []);

    return { isListening, isSpeaking, speak, startListening, stopListening, transcript, isSupported };
};
