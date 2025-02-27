const llm = require('./llm-api');

const test_file_path = './LLM-Work.pdf'

async function main() {
    
    //First upload file to LLM
    const uploadedFiles = await llm.uploadFile(test_file_path);
    
    //console.log(uploadedFile);
    
    //test chat
    //await testChat([uploadedFiles]);
    
    //test summary
    await testSummary([uploadedFiles]);

    //test quiz
    //await testQuiz([uploadedFiles]);

  }
  
  main();


  async function testChat(uploadedFiles) {

    console.log("Testing Chat.....");
    
    //create array to hold multi turn chat history of requests and responses
    let chat_so_far = [];
    
    let prompt = "tell me anout developments in AI today"
    //add user prompt to chat history
    chat_so_far = llm.chat_add_response(chat_so_far, "user", prompt);

    //get system response to user prompt
    result = await llm.chatResponse(chat_so_far);
    console.log(result);

    //add response to chat history
    chat_so_far = llm.chat_add_response(chat_so_far, "assistant", result);

    //add next user prompt    
    chat_so_far = llm.chat_add_response(chat_so_far, "user", "Please summarise the doc and indicate where it relates to your previous response", uploadedFiles);

    //get next system response
    result = await llm.chatResponse(chat_so_far);
    console.log(result);

  }


  //Function to test summary
  async function testSummary(uploadedFiles) {
    console.log('Testing Summary:');
    const nWords = 50;
    console.log(await llm.summariseFile(uploadedFiles, nWords));
  }


  //function to test quiz functionality
  async function testQuiz(uploadedFiles) {

    console.log('Testing Quiz:');
    
    //Gather questions based on file
    const num_questions = 2
    const questions = await llm.generateQuiz(uploadedFiles, num_questions);
    
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
  
    const percentScore = totalScore/evaluations.length;
    console.log(`Quiz complete! Your total score: ${percentScore}%`);
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

  