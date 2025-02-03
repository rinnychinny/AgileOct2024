API_KEY = 'AIzaSyCgWrQpxjatd_Na-6_FflB4vHeXyGSbr1Q' 

const { GoogleAIFileManager } = require('@google/generative-ai/server');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);
const mime = require('mime-types');

async function uploadFile(filePath, fileMimeType = null) {
  try {
    // Auto-detect MIME type if not provided
    const detectedMimeType = fileMimeType || mime.lookup(filePath);
    
    if (!detectedMimeType) {
      throw new Error("Unable to determine MIME type. Please provide one.");
    }

    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType: detectedMimeType,  // Ensure MIME type is always set
    });

    return uploadResult.file;
  }
  catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

//summarise file
async function summariseFile(uploadedFile) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const summary = await model.generateContent([
    { text: "Summarise this PDF" },
    { fileData: {
          fileUri: uploadedFile.uri,
          mimeType: uploadedFile.mimeType }
    }
  ]);
  return summary.response.text();
}

//responses contains markdown backticks which need to be removed
function json_from_array(rawResponse) {
  const jsonStart = rawResponse.indexOf('[');
  const jsonEnd = rawResponse.lastIndexOf(']') + 1;
  const jsonString = rawResponse.slice(jsonStart, jsonEnd);
  return JSON.parse(jsonString);
}

async function generateQuiz(uploadedFile) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const quizResult = await model.generateContent([
    {
      text: `Based on the content of this file, generate 2 quiz questions. 
             Format the output as a JSON array of objects, each containing 'question' and 'answer' fields.`,
    },
    { fileData: {
      fileUri: uploadedFile.uri,
      mimeType: uploadedFile.mimeType }
    }
]);

  const rawResponse = quizResult.response.text();
  const quizQuestions = json_from_array(rawResponse);
  return quizQuestions;
}

async function evaluateAnswer(question, correctAnswer, userAnswer) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const prompt = `
    Question: ${question}
    Correct Answer: ${correctAnswer}
    User's Answer: ${userAnswer}

    Evaluate the user's answer. Consider the following:
    1. Is the answer correct?
    2. If not fully correct, what parts are right or wrong?
    3. Provide a brief explanation.

    Return your evaluation as a JSON object with the following structure:
    {
      "isCorrect": boolean,
      "score": number (0-1),
      "explanation": string
    }
  `;
  const result = await model.generateContent(
    [{ text: prompt }],
    { response_mime_type: "application/json" }
  );
  const evaluation = JSON.parse(result.response.text());
  return evaluation;
}


async function evaluateAllAnswers(answers) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const prompt = `
    Evaluate the following quiz answers. For each answer, provide:
    1. Whether it's correct (true/false)
    2. A percent accuracy score (0-100%)
    3. A brief explanation

    Questions and Answers:
    ${answers.map((a, i) => `
    ${i + 1}. Question: ${a.question}
       Correct Answer: ${a.correctAnswer}
       User's Answer: ${a.userAnswer}
    `).join('\n')}

    Return your evaluation as a JSON array of objects, each containing:
    {
      "questionNumber": number,
      "isCorrect": boolean,
      "score": number,
      "explanation": string
    }
  `;
  const result = await model.generateContent(
    [{ text: prompt }],
    { response_mime_type: "application/json" }
  );
  const evaluations = json_from_array(result.response.text());
  return evaluations;
}


module.exports = {
  uploadFile,
  summariseFile,
  evaluateAllAnswers,
  generateQuiz,
};
