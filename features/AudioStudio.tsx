
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from '../components/Header';
import { Loader } from '../components/Loader';
import { FileUploader } from '../components/FileUploader';
import { getLiveGenAIClient, generateSpeech, transcribeAudio } from '../services/geminiService';
import { blobToBase64, decode, encode, decodeAudioData } from '../utils';
import { AudioIcon, MicIcon, StopIcon, PlayIcon } from '../components/icons';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';

type AudioTab = 'Live' | 'TTS' | 'Transcribe';

// --- Live Conversation Component ---
const LiveConversation = () => {
  const [isLive, setIsLive] = useState(false);
  const [status, setStatus] = useState('Not connected');
  const sessionRef = useRef<LiveSession | null>(null);

  // Refs for audio processing
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startConversation = async () => {
    try {
      setIsLive(true);
      setStatus('Connecting...');
      const ai = getLiveGenAIClient();
      
      // Fix: Use `(window as any).webkitAudioContext` to support Safari and older browsers, resolving TypeScript error.
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      nextStartTimeRef.current = 0;
      sourcesRef.current.clear();

      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('Connected. Start talking!');
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            // Fix: Use ScriptProcessorNode to get raw PCM audio data instead of MediaRecorder with webm.
            mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
            const outputAudioContext = outputAudioContextRef.current;
            if (audioData && outputAudioContext) {
                nextStartTimeRef.current = Math.max(
                    nextStartTimeRef.current,
                    outputAudioContext.currentTime
                );
                const audioBytes = decode(audioData);
                const audioBuffer = await decodeAudioData(audioBytes, outputAudioContext, 24000, 1);

                const source = outputAudioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContext.destination);
                
                source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                });
                
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current = nextStartTimeRef.current + audioBuffer.duration;
                sourcesRef.current.add(source);
            }
             const interrupted = message.serverContent?.interrupted;
              if (interrupted) {
                for (const source of sourcesRef.current.values()) {
                  source.stop();
                  sourcesRef.current.delete(source);
                }
                nextStartTimeRef.current = 0;
              }
          },
          onerror: (e: ErrorEvent) => {
            console.error(e);
            setStatus(`Error: ${e.message}`);
            stopConversation();
          },
          onclose: () => {
            setStatus('Connection closed.');
            setIsLive(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }
        }
      });
      sessionRef.current = await sessionPromise;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus(`Failed to start: ${msg}`);
      setIsLive(false);
    }
  };

  const stopConversation = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }

    for (const source of sourcesRef.current.values()) {
        source.stop();
    }
    sourcesRef.current.clear();
    
    sessionRef.current?.close();
    sessionRef.current = null;

    inputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;
    outputAudioContextRef.current?.close();
    outputAudioContextRef.current = null;
    
    setIsLive(false);
    setStatus('Not connected');
  };
  
  return (
    <div className="text-center">
      <p className="mb-4 text-brand-text">Have a real-time voice conversation with Gemini.</p>
      <button
        onClick={isLive ? stopConversation : startConversation}
        className={`px-6 py-3 font-semibold rounded-lg text-white flex items-center justify-center gap-2 mx-auto ${isLive ? 'bg-red-600 hover:bg-red-500' : 'bg-brand-accent hover:bg-indigo-500'}`}
      >
        {isLive ? <><StopIcon className="w-5 h-5" /> Stop Conversation</> : <><MicIcon className="w-5 h-5" /> Start Conversation</>}
      </button>
      <p className="mt-4 text-lg font-semibold text-brand-light">{status}</p>
    </div>
  );
};


// --- TTS Component ---
const TextToSpeech = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        return () => {
            audioContextRef.current?.close();
        }
    }, []);

    const handleGenerateSpeech = async () => {
        if (!text.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const base64Audio = await generateSpeech(text);
            const audioBytes = decode(base64Audio);
            
            // Fix: Actually play the generated raw PCM audio instead of showing an error.
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioCtx = audioContextRef.current;

            const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);
            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.start();

        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate speech");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <p className="text-center text-brand-text">Convert text into natural-sounding speech.</p>
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Enter text to generate speech..." className="w-full h-32 p-4 bg-brand-secondary rounded-lg focus:ring-2 focus:ring-brand-accent outline-none" />
            <button onClick={handleGenerateSpeech} disabled={isLoading} className="w-full py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
                {isLoading ? "Generating..." : "Generate and Play Speech"}
            </button>
            {error && <p className="text-center text-red-400">{error}</p>}
        </div>
    );
}

// --- Transcription Component ---
const Transcription = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [transcription, setTranscription] = useState('');

    const handleTranscribe = async () => {
        if (!file) return;
        setIsLoading(true);
        setError('');
        setTranscription('');
        try {
            const base64 = await blobToBase64(file);
            const result = await transcribeAudio(base64, file.type);
            setTranscription(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to transcribe audio");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
         <div className="space-y-4">
            <p className="text-center text-brand-text">Upload an audio file to transcribe it to text.</p>
            <FileUploader onFileUpload={setFile} accept={{'audio/*': []}} title="Upload an audio file" />
            <button onClick={handleTranscribe} disabled={isLoading || !file} className="w-full py-3 bg-brand-accent text-white font-semibold rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
                {isLoading ? "Transcribing..." : "Transcribe"}
            </button>
            {error && <p className="text-center text-red-400">{error}</p>}
            {transcription && <div className="p-4 bg-brand-secondary rounded-lg"><p className="whitespace-pre-wrap">{transcription}</p></div>}
         </div>
    )
}


const AudioStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AudioTab>('Live');

  const TabButton: React.FC<{ tabName: AudioTab }> = ({ tabName }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium rounded-md ${
        activeTab === tabName ? 'bg-brand-accent text-white' : 'text-gray-300 hover:bg-brand-secondary'
      }`}
    >
      {tabName}
    </button>
  );

  return (
    <>
      <Header title="Audio Studio" icon={<AudioIcon />} />
      <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center gap-2 mb-6 p-1 bg-brand-primary rounded-lg">
            <TabButton tabName="Live" />
            <TabButton tabName="TTS" />
            <TabButton tabName="Transcribe" />
          </div>
          {activeTab === 'Live' && <LiveConversation />}
          {activeTab === 'TTS' && <TextToSpeech />}
          {activeTab === 'Transcribe' && <Transcription />}
        </div>
      </div>
    </>
  );
};

export default AudioStudio;
