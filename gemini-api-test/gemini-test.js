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
  const quiz = await model.generateContent([
    { text: "Summarize this PDF" },
    { fileData: { fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType } }
  ]);
  
  console.log(result.response.text());
}

//responses contains markdown backticks which need to be removed
function json_from_array(rawResponse) {
  const jsonStart = rawResponse.indexOf('[');
  const jsonEnd = rawResponse.lastIndexOf(']') + 1;
  const jsonString = rawResponse.slice(jsonStart, jsonEnd);
  return JSON.parse(jsonString);
}

async function questionPDF(pdfPath) {
  const uploadedFile = await uploadPDF(pdfPath);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const quizResult = await model.generateContent([
    {
      text: `Based on the content of this PDF, generate 2 quiz questions. 
             Format the output as a JSON array of objects, each containing 'question' and 'answer' fields.`,
    },
    { fileData: { fileUri: uploadedFile.uri, mimeType: uploadedFile.mimeType } },
  ]);

  const rawResponse = quizResult.response.text();
  const jsonStart = rawResponse.indexOf('[');
  const jsonEnd = rawResponse.lastIndexOf(']') + 1;
  const jsonString = rawResponse.slice(jsonStart, jsonEnd);

  const quizQuestions = json_from_array(rawResponse);
  console.log("Quiz Questions:", quizQuestions);

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

const readline = require('readline');

function getUserInput(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}


async function runQuiz() {
  const questions = await questionPDF('LLM-Work.pdf');
  const userAnswers = [];

  for (const question of questions) {
    console.log(`Question: ${question.question}`);
    const userAnswer = await getUserInput("Your answer: ");
    userAnswers.push({
      question: question.question,
      correctAnswer: question.answer,
      userAnswer: userAnswer
    });
  }

  return userAnswers;
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



//processPDF('LLM-Work.pdf').catch(console.error);
async function main() {
  const userAnswers = await runQuiz();
  const evaluations = await evaluateAllAnswers(userAnswers);

  let totalScore = 0;
  evaluations.forEach((eval, index) => {
    console.log(`Question ${eval.questionNumber}:`);
    console.log(`Your answer: ${userAnswers[index].userAnswer}`);
    console.log(`Correct: ${eval.isCorrect}`);
    console.log(`Score: ${eval.score}`);
    console.log(`Explanation: ${eval.explanation}`);
    console.log('---');
    totalScore += eval.score;
  });

  console.log(`Quiz complete! Your total score: ${totalScore}/${evaluations.length}`);
}

main();
