API_KEY = 'AIzaSyCgWrQpxjatd_Na-6_FflB4vHeXyGSbr1Q' 

const { GoogleAIFileManager } = require('@google/generative-ai/server');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const fileManager = new GoogleAIFileManager(API_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);
const mime = require('mime-types');

//upload files to Gemini for later use via a uri 
//Gemini always needs MIME file type so lookup when not provided, throw an error if not found
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

//********************************************************************************
//******* summarise file functionality *******************************************
//********************************************************************************

//file needs to be already uploaded via uploadFile
async function summariseFile(uploadedFile) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const summary = await model.generateContent([
    { text: "Summarise this document" },
    { fileData: {
          fileUri: uploadedFile.uri,
          mimeType: uploadedFile.mimeType }
    }
  ]);
  return summary.response.text();
}

//********************************************************************************
//******* end of summarise file functionality ************************************
//********************************************************************************

//********************************************************************************
//********* chat functionality ***************************************************
//********************************************************************************

//helper function to create multi turn chats in the correct format
function chat_add_response(chat, role_to_add, text_to_add, uploadedFile = null) {
  
  //create text element of parts
  let parts =  [{"text": text_to_add}];

  //if a file_uri is passed, add fileData to parts
  if (uploadedFile) {
    const file_data =  { fileData: {
        fileUri: uploadedFile.uri,
        mimeType: uploadedFile.mimeType }};
    parts.push(file_data);
  }

  //create new turn in conversation
  const new_item = {
      "role": role_to_add,
      "parts": parts
    }

    //append new turn to initial chat and return
    return [...chat, new_item] ;
}

//get chat response from model
//expects correctly formatted chatSoFar, for example created by chat_add_response
async function chatResponse(chatSoFar) {

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
    const result = await model.generateContent({contents: chatSoFar});
    return result.response.text();
    
}

//********************************************************************************
//********* end of chat functionality ********************************************
//********************************************************************************


//********************************************************************************
//********* quiz functionality ***************************************************
//********************************************************************************

//generates an array of question/answer pairs of size num_questions
async function generateQuiz(uploadedFile, num_questions = 2) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const quizResult = await model.generateContent([
    {
      text: `Based on the content of this file, generate ${num_questions} quiz questions. 
             Format the output as a JSON array of objects, each containing 'question' and 'answer' fields.
             The 'answer' field should contain your model answer.
             Include enough detail in your model answer that it can be used to evaluate another answer given tot he question for correctness.`,
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

//evalutes user answer versus model answer for a single question 
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

//evalutes all user answers
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

//********************************************************************************
//********* end of quiz functionality ********************************************
//********************************************************************************

//********************************************************************************
//********* helper functions *****************************************************
//********************************************************************************

//responses contains markdown backticks which need to be removed
function json_from_array(rawResponse) {
  const jsonStart = rawResponse.indexOf('[');
  const jsonEnd = rawResponse.lastIndexOf(']') + 1;
  const jsonString = rawResponse.slice(jsonStart, jsonEnd);
  return JSON.parse(jsonString);
}

//********************************************************************************
//********* module exports *******************************************************
//********************************************************************************


module.exports = {
  uploadFile,
  summariseFile,
  evaluateAllAnswers,
  generateQuiz,
  chatResponse,
  chat_add_response
};
