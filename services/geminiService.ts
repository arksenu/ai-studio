
import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import type { AspectRatio } from "../types";

function getGenAIClient() {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) {
      throw new Error("API_KEY environment variable not set");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
}

// === STORYBOARD ===
export const generatePromptsFromScript = async (script: string): Promise<string[]> => {
  const ai = getGenAIClient();
  const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Analyze the following script and break it down into a sequence of key visual scenes for a storyboard. For each scene, create a detailed, concise prompt that an image generation AI can use. The prompt should describe setting, characters, actions, camera angle, and mood.
      Script:
      ---
      ${script}
      ---`,
      config: {
          systemInstruction: "You are a professional storyboard artist. Your task is to interpret a script and generate descriptive prompts for an AI image generator. Output only a JSON array of strings.",
          responseMimeType: "application/json",
          responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
          thinkingConfig: { thinkingBudget: 32768 }
      },
  });
  const prompts = JSON.parse(response.text.trim());
  if (!Array.isArray(prompts) || !prompts.every(p => typeof p === 'string')) {
      throw new Error("AI response was not a valid array of strings.");
  }
  return prompts;
};

// === IMAGE STUDIO ===
export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const ai = getGenAIClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio,
            outputMimeType: 'image/jpeg'
        }
    });
    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("API did not return any images.");
    }
    return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [
            { inlineData: { data: imageBase64, mimeType: mimeType } },
            { text: prompt },
        ]},
        config: { responseModalities: [Modality.IMAGE] },
    });
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) {
        return part.inlineData.data;
    }
    throw new Error("Could not edit the image.");
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [
            { text: prompt },
            { inlineData: { data: imageBase64, mimeType: mimeType } },
        ]},
    });
    return response.text;
};

// === CHAT ===
export const createChat = (systemInstruction: string): Chat => {
    const ai = getGenAIClient();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction },
    });
}

export const generateGroundedContent = async (prompt: string, useSearch: boolean, useMaps: boolean, location: GeolocationPosition | null) => {
    const ai = getGenAIClient();
    const tools: any[] = [];
    if (useSearch) tools.push({googleSearch: {}});
    if (useMaps) tools.push({googleMaps: {}});

    const toolConfig: any = {};
    if (useMaps && location) {
        toolConfig.retrievalConfig = {
            latLng: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }
        };
    }

    return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools,
            ...(Object.keys(toolConfig).length > 0 && { toolConfig })
        }
    });
}

export const generateComplexContent = async (prompt: string) => {
    const ai = getGenAIClient();
    return await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
}


// === VIDEO STUDIO ===
export const generateVideo = async (prompt: string, image?: {data: string, mimeType: string}) => {
    const ai = getGenAIClient();
    const imagePayload = image ? { imageBytes: image.data, mimeType: image.mimeType } : undefined;

    return await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      ...(imagePayload && { image: imagePayload }),
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });
};

export const getVideosOperation = async (operation: any) => {
    const ai = getGenAIClient();
    return await ai.operations.getVideosOperation({ operation });
}

export const fetchVideo = async (uri: string) => {
    const API_KEY = process.env.API_KEY;
    const response = await fetch(`${uri}&key=${API_KEY}`);
    if (!response.ok) {
        throw new Error('Failed to fetch video data.');
    }
    return response.blob();
}

// === AUDIO STUDIO ===
export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) {
        throw new Error("API did not return audio data.");
    }
    return data;
}

export const transcribeAudio = async (audioBase64: string, mimeType: string): Promise<string> => {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: "Transcribe the following audio." },
                { inlineData: { data: audioBase64, mimeType: mimeType } }
            ]
        }
    });
    return response.text;
};

// === LIVE API INSTANCE for AudioStudio ===
export const getLiveGenAIClient = () => getGenAIClient();
