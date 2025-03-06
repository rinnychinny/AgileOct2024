
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mime from 'mime-types';

//constructor - first create an instance with the apiKey
class GeminiClient {
  constructor(apiKey) {
      if (!apiKey) {
          throw new Error("API key is required");
      }
      this.apiKey = apiKey;
      this.fileManager = new GoogleAIFileManager(apiKey);
      this.genAI = new GoogleGenerativeAI(apiKey);
  }

//********************************************************************************
//******* upload file functionality *******************************************
//********************************************************************************

  //upload files to Gemini (google cloud) for later use via a uri
  // - a google cloud uri MUST be provided (not local uri) in other calls 
  //Gemini always needs MIME file type so lookup when not provided, throw an error if not found
  async uploadFile(filePath, fileMimeType = null) {
    try {
      // Auto-detect MIME type if not provided
      const detectedMimeType = fileMimeType || mime.lookup(filePath);
      
      if (!detectedMimeType) {
        throw new Error("Unable to determine MIME type. Please provide one.");
      }

      const uploadResult = await this.fileManager.uploadFile(filePath, {
        mimeType: detectedMimeType,  // Ensure MIME type is always set
      });

      //Return Gemini URI and mime type
      return { uri: uploadResult.file.uri, mimeType: detectedMimeType };
    }
    catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

//********************************************************************************
//******* summarise file functionality *******************************************
//********************************************************************************

//file needs to be already uploaded to Gemini cloud via uploadFile
//summarise in maximum nWords
async summariseFile(uploadedFiles, nWords = 100) {
  try {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const prompt = `Summarise each entire document (not individual pages) in less than ${nWords} words`;
  let chat = [];
  chat = GeminiClient.chat_add_response(chat, "user", prompt, uploadedFiles);
  
  const summary = await model.generateContent({contents: chat});
  return summary.response.text();
  }
  catch (error) {
    console.error('Error summarising file:', error);
    throw error;
  }
}

//********************************************************************************
//******* end of summarise file functionality ************************************
//********************************************************************************

//********************************************************************************
//********* chat functionality ***************************************************
//********************************************************************************

//helper function to add file data for uploaded files to a parts array 
static add_file_data(parts, uploadedFiles) {
try {
  // If file uri are passed, add each file's data to parts
  if (uploadedFiles && uploadedFiles.length > 0) {
    uploadedFiles.forEach(file => {
      const file_data = {
        fileData: {
          fileUri: file.uri,
          mimeType: file.mimeType
        }
      };
      parts.push(file_data);
    });
  }
}
catch(error) {
  console.error('Error in add_file_data:', error);
  throw error;
}
}

//helper function to create multi turn chats in the correct format
static chat_add_response(chat, role_to_add, text_to_add, uploadedFiles = []) {
try {
  //create text element of parts
  let parts =  [{"text": text_to_add}];

  GeminiClient.add_file_data(parts, uploadedFiles);

  //create new turn in conversation
  const new_item = {
      "role": role_to_add,
      "parts": parts
    }

    //append new turn to initial chat and return
    return [...chat, new_item] ;
}  
catch(error) {
  console.error('Error in chat_add_response:', error);
  throw error;
}
}

//get chat response from model
//expects correctly formatted chatSoFar, for example created by chat_add_response
async chatResponse(chatSoFar) {
try {
  const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent({contents: chatSoFar});
  return result.response.text();
}
catch(error) {
  console.error('Error in chat response:', error);
  throw error;
}    
}

//get chat response from model, as a stream
//expects correctly formatted chatSoFar, for example created by chat_add_response
//takes onStreamUpdate callback function to notify updates
async chatResponseStream(chatSoFar, onStreamUpdate) {
  try {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const resultStream = await model.generateContentStream({contents: chatSoFar});
    let accumulatedText = "";
    for await (const chunk of resultStream.stream) {
      const textChunk = chunk.text(); // Extract the streamed text
      accumulatedText += textChunk;
        if (onStreamUpdate) {
            onStreamUpdate(accumulatedText); //callback to update client
        }
      }
    return accumulatedText;
  }
  catch (error) {
    console.error("Error in chatResponseStream:", error);
    return `Error: ${error.message}`;
  }
}
//********************************************************************************
//********* end of chat functionality ********************************************
//********************************************************************************


//********************************************************************************
//********* quiz functionality ***************************************************
//********************************************************************************

//generates an array of question/answer pairs of size num_questions
async generateQuiz(uploadedFiles, num_questions = 2) {
  try {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `Based on the content of these files, generate ${num_questions} quiz questions. 
               Format the output as a JSON array of objects, each containing 'question' and 'answer' fields.
               The 'answer' field should contain your model answer.
               Include enough detail in your model answer that it can be used later to evaluate a user answer given to the question for correctness.`;
    
    let chat = [];
    chat = GeminiClient.chat_add_response(chat, "user", prompt, uploadedFiles);
    
    const quizResult = await model.generateContent({contents: chat});
    const rawResponse = quizResult.response.text();
    const quizQuestions = GeminiClient.json_from_array(rawResponse);
    return quizQuestions;
  }
  catch (error) {
    console.error("Error in generating quiz:", error);
    return `Error: ${error.message}`;
  }
}

//evalutes user answer versus model answer for a single question 
async evaluateAnswer(question, correctAnswer, userAnswer) {
  try {
    const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
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
    catch (error) {
      console.error("Error in evaluating quiz answer:", error);
      return `Error: ${error.message}`;
    }
}

//evaluates all user answers
//answers is an array of JSON objects
//each JSON objet of the form {question:, answer:, userAnswer:}
async evaluateAllAnswers(answers) {
try {
  const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  //create prompt asking for evaluation of all user answers versus model answer
  const prompt = `
    Evaluate the following quiz answers. For each answer, provide:
    1. Whether it's correct (true/false)
    2. A percent accuracy score (0-100%)
    3. A brief explanation

    Questions and Answers:
    ${answers.map((a, i) => `
    ${i + 1}. Question: ${a.question}
       Correct Answer: ${a.answer}
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
  //generate response
  const result = await model.generateContent(
    [{ text: prompt }],
    { response_mime_type: "application/json" }
  );
  //strip markdown backticks
  const evaluations = GeminiClient.json_from_array(result.response.text());
  return evaluations;
}
catch(error) {
  console.error("Error in evaluating quiz answers:", error);
  return `Error: ${error.message}`;
}
}
//********************************************************************************
//********* end of quiz functionality ********************************************
//********************************************************************************

//********************************************************************************
//********* helper functions *****************************************************
//********************************************************************************

//responses contains markdown backticks which need to be removed
//return the json from just the part contained in [...]
static json_from_array(rawResponse) {
try {
  const jsonStart = rawResponse.indexOf('[');
  const jsonEnd = rawResponse.lastIndexOf(']') + 1;
  const jsonString = rawResponse.slice(jsonStart, jsonEnd);
  return JSON.parse(jsonString);
}
catch(error) {
  console.error("Error in json from array:", error);
  return `Error: ${error.message}`;
}
}

} //End of class declaration

export default GeminiClient;