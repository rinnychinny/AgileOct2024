API_KEY = 'AIzaSyCgWrQpxjatd_Na-6_FflB4vHeXyGSbr1Q' 

const { GoogleAIFileManager } = require('@google/generative-ai/server');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);

async function uploadPDF(pdfPath) {
  const uploadResult = await fileManager.uploadFile(pdfPath, {
    mimeType: 'application/pdf'
  });
  return uploadResult.file;
}

async function processPDF(pdfPath) {
  const uploadedFile = await uploadPDF(pdfPath);
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent([
    { text: "Summarize this PDF" },
    { fileData: { fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType } }
  ]);
  
  console.log(result.response.text());
}

processPDF('LLM-Work.pdf').catch(console.error);
