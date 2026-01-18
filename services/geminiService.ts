
import { GoogleGenAI, GenerateContentResponse, Modality, Type, FunctionDeclaration } from "@google/genai";
import { ChatMessage, MessageRole } from "../types";

// Always use process.env.API_KEY directly for initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const createFileTool: FunctionDeclaration = {
  name: "create_file",
  parameters: {
    type: Type.OBJECT,
    description: "Generates a downloadable file with a specified filename and content.",
    properties: {
      fileName: {
        type: Type.STRING,
        description: "The full name of the file to create, including the extension (e.g., 'script.py', 'index.html', 'data.txt').",
      },
      content: {
        type: Type.STRING,
        description: "The text content to be written into the file.",
      },
    },
    required: ["fileName", "content"],
  },
};

const generateImageTool: FunctionDeclaration = {
  name: "generate_image",
  parameters: {
    type: Type.OBJECT,
    description: "Generates an image based on a descriptive prompt.",
    properties: {
      prompt: {
        type: Type.STRING,
        description: "A detailed description of the image to generate. Be specific about style, colors, and subject.",
      },
      aspectRatio: {
        type: Type.STRING,
        description: "The aspect ratio of the generated image. Options: '1:1', '4:3', '3:4', '16:9', '9:16'. Default is '1:1'.",
      },
    },
    required: ["prompt"],
  },
};

const generateVideoTool: FunctionDeclaration = {
  name: "generate_video",
  parameters: {
    type: Type.OBJECT,
    description: "Generates a cinematic video clip based on a descriptive prompt.",
    properties: {
      prompt: {
        type: Type.STRING,
        description: "A detailed description of the video. Describe action, lighting, and camera movement.",
      },
      aspectRatio: {
        type: Type.STRING,
        description: "Aspect ratio: '16:9' or '9:16'. Default is '16:9'.",
      },
      resolution: {
        type: Type.STRING,
        description: "Resolution: '720p' or '1080p'. Default is '720p'.",
      }
    },
    required: ["prompt"],
  },
};

export async function sendMultimodalMessage(
  messages: ChatMessage[],
  systemInstruction?: string
): Promise<GenerateContentResponse> {
  const contents = messages.map(m => ({
    role: m.role === MessageRole.TOOL ? "user" : m.role,
    parts: m.parts.map(p => {
      if (p.text) return { text: p.text };
      if (p.inlineData) return { inlineData: p.inlineData };
      if (p.functionCall) return { functionCall: p.functionCall };
      if (p.functionResponse) return { functionResponse: p.functionResponse };
      return { text: "" };
    })
  }));

  const finalSystemInstruction = systemInstruction || 
    "You are a helpful assistant. You can create files, generate images, and generate videos. If a user asks for a video or animation, use 'generate_video'. Inform users that videos may take a few minutes to render.";

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction: finalSystemInstruction,
      tools: [{ functionDeclarations: [createFileTool, generateImageTool, generateVideoTool] }],
    },
  });

  return response;
}

export async function generateImage(prompt: string, aspectRatio: string = "1:1"): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }
  throw new Error("Image generation failed");
}

export async function generateVideo(
  prompt: string, 
  aspectRatio: string = '16:9', 
  resolution: string = '720p',
  onStatusUpdate?: (status: string) => void
): Promise<string> {
  const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  onStatusUpdate?.("Initializing video engine...");
  let operation = await videoAi.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: resolution as any,
      aspectRatio: aspectRatio as any
    }
  });

  const statusMessages = [
    "Synthesizing visual layers...",
    "Modeling physics and motion...",
    "Rendering cinematic lighting...",
    "Finalizing video encoding...",
    "Almost ready for screening..."
  ];
  let msgIdx = 0;

  while (!operation.done) {
    onStatusUpdate?.(statusMessages[msgIdx % statusMessages.length]);
    msgIdx++;
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await videoAi.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed - no URI returned");

  onStatusUpdate?.("Fetching final render...");
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

export async function generateSpeech(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
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
  if (!base64Audio) throw new Error("No audio data generated");
  return base64Audio;
}
