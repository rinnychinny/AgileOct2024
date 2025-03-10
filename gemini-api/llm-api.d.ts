declare module "./llm-api.mjs" {
    export default class GeminiClient {
        constructor(apiKey: string);

        // Upload file using a file path (server-side usage)
        uploadFile(filePath: string, fileMimeType?: string): Promise<{ uri: string; mimeType: string }>;

        // Upload file using FormData (browser usage)
        uploadFileFromFormData(formData: FormData): Promise<{ uri: string; mimeType: string }>;

        summariseFile(uploadedFiles: Array<{ uri: string; mimeType: string }>, nWords?: number): Promise<string>;

        chatResponse(chatSoFar: any[]): Promise<string>;

        chatResponseStream(chatSoFar: any[], onStreamUpdate?: (update: string) => void): Promise<string>;

        generateQuiz(uploadedFiles: Array<{ uri: string; mimeType: string }>, num_questions?: number): Promise<any>;

        evaluateAnswer(question: string, correctAnswer: string, userAnswer: string): Promise<any>;

        evaluateAllAnswers(answers: Array<{ question: string; answer: string; userAnswer: string }>): Promise<any>;
    }
}

