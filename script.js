
const startButton = document.getElementById("start-btn");
const message = document.getElementById("message");

const quizArea = document.getElementById("quiz-area");
const questionText = document.getElementById("question");
const answersArea = document.getElementById("answers");
const feedback = document.getElementById("feedback");
const progress = document.getElementById("progress");
const timerDisplay = document.getElementById("timer");
const nextButton = document.getElementById("next-btn");

const resultArea = document.getElementById("result-area");
const finalScore = document.getElementById("final-score");
const highScoreDisplay = document.getElementById("high-score");
const reviewArea = document.getElementById("review-area");
const playAgainButton = document.getElementById("play-again-btn");

const categorySelect = document.getElementById("category");
const difficultySelect = document.getElementById("difficulty");

let questions = [];
let currentQuestion = 0;
let score = 0;
let answered = false;
let incorrectAnswers = [];

let timeLeft = 15;
let timerInterval;

// Convert special characters in API questions into readable text.
function cleanText(text) {
    const box = document.createElement("textarea");
    box.innerHTML = text;
    return box.value;
}

// Put answers in a random order.
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}


function startTimer() {
    clearInterval(timerInterval);

    timeLeft = 15;
    timerDisplay.textContent = "Time left: " + timeLeft + "s";

    timerInterval = setInterval(function () {
        timeLeft--;

        timerDisplay.textContent = "Time left: " + timeLeft + "s";

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            checkAnswer(null, null, true);
        }
    }, 1000);
}

// Get questions from the Open Trivia Database.
async function startQuiz() {
    startButton.disabled = true;
    message.textContent = "Loading questions...";

    let url =
        "https://opentdb.com/api.php?amount=10&type=multiple";

    if (categorySelect.value !== "") {
        url += "&category=" + categorySelect.value;
    }

    url += "&difficulty=" + difficultySelect.value;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.response_code !== 0 || data.results.length !== 10) {
            throw new Error("Not enough questions available.");
        }

        questions = data.results.map(function (item) {
            return {
                question: cleanText(item.question),
                correct: cleanText(item.correct_answer),
                answers: shuffle([
                    cleanText(item.correct_answer),
                    ...item.incorrect_answers.map(cleanText)
                ])
            };
        });

        currentQuestion = 0;
        score = 0;
        incorrectAnswers = [];

        startButton.hidden = true;
        categorySelect.disabled = true;
        difficultySelect.disabled = true;
        message.textContent = "";

        quizArea.hidden = false;
        resultArea.hidden = true;

        showQuestion();

    } catch (error) {
        message.textContent =
            "Could not load questions. Check your internet and try again.";
        console.error(error);

    } finally {
        startButton.disabled = false;
    }
}

// Display the current question and its four answers.

function showQuestion() {
    answered = false;

    const item = questions[currentQuestion];

    progress.textContent =
        "Question " + (currentQuestion + 1) + " of 10";

    questionText.textContent = item.question;
    feedback.textContent = "";
    answersArea.innerHTML = "";
    nextButton.hidden = true;

    // Create the four answer buttons only once
    item.answers.forEach(function (answer) {
        const button = document.createElement("button");

        button.textContent = answer;

        button.addEventListener("click", function () {
            checkAnswer(answer, button);
        });

        answersArea.appendChild(button);
    });

    // Start the 15-second timer
    startTimer();
}



// Check whether the selected answer is correct.


function checkAnswer(answer, clickedButton, timedOut = false) {
    if (answered) {
        return;
    }

    answered = true;
    clearInterval(timerInterval);

    const item = questions[currentQuestion];
    const correctAnswer = item.correct;
    const buttons = answersArea.querySelectorAll("button");

    buttons.forEach(function (button) {
        button.disabled = true;

        if (button.textContent === correctAnswer) {
            button.style.backgroundColor = "#34d399";
        }
    });

    if (answer === correctAnswer) {
        score++;
        feedback.textContent = "Correct! Well done.";
    } else {
        // Save the question and its answers for the review.
        incorrectAnswers.push({
            question: item.question,
            selectedAnswer: timedOut
                ? "No answer (time ran out)"
                : answer,
            correctAnswer: correctAnswer
        });

        if (clickedButton) {
            clickedButton.style.backgroundColor = "#fb7185";
        }

        if (timedOut) {
            feedback.textContent =
                "Time's up! Correct answer: " + correctAnswer;
        } else {
            feedback.textContent =
                "Incorrect. Correct answer: " + correctAnswer;
        }
    }

    nextButton.textContent =
        currentQuestion === 9 ? "See Results" : "Next Question";

    nextButton.hidden = false;
}



// Move to the next question or show the final score.
function nextQuestion() {
    currentQuestion++;

    if (currentQuestion < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

// Display the final score.

function showResults() {
    clearInterval(timerInterval);

    quizArea.hidden = true;
    resultArea.hidden = false;

    finalScore.textContent = "Your score: " + score + " / 10";

    // Read the previously saved high score.
    let highScore = Number(localStorage.getItem("triviaHighScore")) || 0;

    // Save the new score if it is higher.
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("triviaHighScore", highScore);
    }

    highScoreDisplay.textContent =
        "Highest score: " + highScore + " / 10";

    
    // Clear any previous review.
    reviewArea.innerHTML = "";

    if (incorrectAnswers.length === 0) {
        reviewArea.textContent =
            "Perfect score! You got every question correct.";
    } else {
        incorrectAnswers.forEach(function (item, index) {
            const card = document.createElement("div");

            const question = document.createElement("h4");
            question.textContent =
                (index + 1) + ". " + item.question;

            const yourAnswer = document.createElement("p");
            yourAnswer.textContent =
                "Your answer: " + item.selectedAnswer;

            const correctAnswer = document.createElement("p");
            correctAnswer.textContent =
                "Correct answer: " + item.correctAnswer;

            card.appendChild(question);
            card.appendChild(yourAnswer);
            card.appendChild(correctAnswer);

            reviewArea.appendChild(card);
        });
    }

}


// Return to the start screen.
function playAgain() {
    resultArea.hidden = true;
    quizArea.hidden = true;

    startButton.hidden = false;
    categorySelect.disabled = false;
    difficultySelect.disabled = false;

    message.textContent = "";
}

startButton.addEventListener("click", startQuiz);
nextButton.addEventListener("click", nextQuestion);
playAgainButton.addEventListener("click", playAgain);
