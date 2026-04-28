import random

def ask_question():
    # Generate two random numbers
    x = random.randint(1, 10)
    y = random.randint(1, 10)
    # Randomly choose an operator
    operator = random.choice(["+", "-", "*"])

    # Build the question
    if operator == "+":
        correct_answer = x + y
    elif operator == "-":
        correct_answer = x - y
    else:
        correct_answer = x * y

    print(f"What is {x} {operator} {y}?")
    user_answer = int(input("Your answer: "))

    if user_answer == correct_answer:
        print("✅ Correct!\n")
        return True
    else:
        print(f"❌ Wrong. The correct answer is {correct_answer}\n")
        return False

def quiz():
    print("🎯 Welcome to the Math Quiz!\n")
    score = 0
    total_questions = 5

    for i in range(total_questions):
        print(f"Question {i+1}:")
        if ask_question():
            score += 1

    print(f"Final Score: {score}/{total_questions}")

quiz()