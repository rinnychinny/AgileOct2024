import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; 
import { FileText, Upload, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
//import { GoogleGenerativeAI } from "@google/generative-ai";

import GeminiClient from '../../../gemini-api/llm-api.mjs';

type Message = {
  type: 'user' | 'assistant' | 'file';
  content: string;
  fileName?: string;
};

type FileData = {
  fileUri: string;
  mimeType: string;
};

type ChatPart = {
  text?: string;
  fileData?: FileData[];
};

type ChatMessage = {
  role: "user" | "assistant";
  parts: ChatPart[];
};


export default function StudyChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatSoFar, setChatSoFar] = useState<ChatMessage[]>([]);

  
  // Initialize Google Generative AI with API key from .env
  const gemini_apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const gemini = new GeminiClient(gemini_apiKey); 

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  //********************Send user request code ******************************/
  const handleSendMessage = async () => {
    if (!input.trim() && files.length === 0) return;
    
    // Add user message to chat
    if (input.trim()) {
      setMessages(prev => [...prev, { type: 'user', content: input }]);
    }
    
    const userQuery = input;
    setInput('');
    setLoading(true);
    
    try {

      let updated_chat  = GeminiClient.chat_add_response(chatSoFar, "user", userQuery);

      const text = await gemini.chatResponse(updated_chat);

      updated_chat = GeminiClient.chat_add_response(updated_chat, "assistant", text);

      //Update state so chat history persists
      setChatSoFar(updated_chat);

      setMessages(prev => [...prev, { type: 'assistant', content: text }]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: 'Sorry, I encountered an error processing your request. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  //********************File Upload code ******************************/
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;
    
    const newFile = uploadedFiles[0];
    if (!newFile) return;

   
    // Check if it's a text file
    
    if (!newFile.name.endsWith('.txt') && newFile.type !== 'text/plain') {
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: 'Sorry, only .txt files are supported at this time.' 
      }]);
      e.target.value = '';
      return;
    }
    

    setLoading(true);
    try {

      //create formdata to send the file
      //const formData = new FormData();
      //formData.append("file", newFile);
    
      //Upload file to LLM
      //const uploadedFiles = await gemini.uploadFileFromFormData(formData);

      //Add file data to chat history
      //let updatedChat = GeminiClient.chat_add_response(chatSoFar, "user", uploadedFiles);

      //const text = await gemini.chatResponse(updatedChat);

      //Update state to retain conversation history
      //setChatSoFar(updatedChat);

      //store the prompt
      const oldPrompt = input.trim();

      // Read the text file
      const reader = new FileReader();
      const fileContent = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => {
          if (event.target?.result) {
            resolve(event.target.result as string);
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = () => reject(new Error("Error reading file"));
        reader.readAsText(newFile);
      });
      
      //Add request to upalod file as a user message to display
      setMessages(prev => [...prev, { 
        type: 'user', 
        content: `Please upload ${newFile.name}`
      }]);
      
        // For text-only requests, upload the text of the file
        const prompt = `Here is the content of a file named "${newFile.name}":\n${fileContent}`;
        let updated_chat  = GeminiClient.chat_add_response(chatSoFar, "user", prompt);

        const text = await gemini.chatResponse(updated_chat);

        updated_chat = GeminiClient.chat_add_response(updated_chat, "assistant", "OK");

        //Update state so chat history persists
        setChatSoFar(updated_chat);
  
        //Add AI response to chat
        setMessages(prev => [...prev, { type: 'assistant', content: `${newFile.name} uploaded` }]);

        //In case there was writing in the prompt at the same time, restore it
        setInput(oldPrompt);


    } catch (error) {
      console.error('Error processing file:', error);
      setMessages(prev => [...prev, { 
        type: 'assistant', 
        content: 'Sorry, I encountered an error processing your file. Please try again.' 
      }]);
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>AI Study Assistant</CardTitle>
        <CardDescription>Ask questions about your course material</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-card/50 p-4 h-[400px] overflow-y-auto flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Start a conversation with your AI study assistant or upload a .txt document with your notes</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-2 ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`rounded-lg p-3 max-w-[80%] ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground ml-auto'
                    : message.type === 'file'
                    ? 'bg-muted'
                    : 'bg-card border'
                }`}
              >
                {message.type === 'file' && (
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium">{message.fileName}</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex gap-2 items-center">
          <Input
            placeholder={loading ? "Processing..." : "Ask a question..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
            className="flex-1"
          />
<div className="relative">
  <input
    type="file"
    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    id="file-upload"
    onChange={handleFileUpload}
    accept=".pdf,.doc,.docx,.txt"
    disabled={loading}
  />
  
  <Button
    variant="outline"
    size="icon"
    className="h-10 w-10 pointer-events-none"
    disabled={loading}
    type="button"
  >
    <Upload className="h-4 w-4" />
  </Button>
</div>
          
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="h-10 w-10"
            disabled={loading || (!input.trim() && files.length === 0)}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}