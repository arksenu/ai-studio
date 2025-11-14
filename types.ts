export interface StoryboardPanelData {
  id: number;
  prompt: string;
  imageUrl: string | null;
}

export type Feature = 'Storyboard' | 'Chat' | 'Image' | 'Video' | 'Audio';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[];
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        uri: string;
        text: string;
      }[];
    }
  };
}
