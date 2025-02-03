const llm = require('./llm-api');

const test_file_path = 'LLM-Work.pdf'

async function main() {
    
    //First upload file to LLM
    const uploadedFile = await llm.uploadFile(test_file_path);
    
    testSummary(uploadedFile);

    //testQuiz(uploadedFile);


  

  }
  
  main();

  async function testSummary(uploadedFile) {
    //Then ask for summary
    console.log('Summary:');
    console.log(await llm.summariseFile(uploadedFile));
  }

  async function testChat(uploadedFile) {

  }

async function testQuiz(uploadedFile) {

    console.log('Quiz:');
    //Gather questions based on file
    const questions = await llm.generateQuiz(uploadedFile);
    
    //Gather user answers
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
  
    const evaluations = await llm.evaluateAllAnswers(userAnswers);
    
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

  