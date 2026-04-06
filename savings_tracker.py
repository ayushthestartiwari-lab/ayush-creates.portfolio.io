# savings_tracker.py

def savings_tracker():
    print("💰 Personal Budget & Savings Tracker 💰")
    income = float(input("Enter your monthly income: "))

    expenses = {}
    categories = ["Food", "Travel", "Study", "Entertainment", "Other"]

    total_expenses = 0
    for category in categories:
        amount = float(input(f"Enter expenses for {category}: "))
        expenses[category] = amount
        total_expenses += amount

    savings = income - total_expenses

    print("\n📊 Monthly Summary:")
    for category, amount in expenses.items():
        print(f"{category}: ₹{amount}")
    print(f"Total Expenses: ₹{total_expenses}")
    print(f"Savings: ₹{savings}")

    # Save to file
    with open("budget_summary.txt", "w") as file:
        file.write("Monthly Budget Summary\n")
        for category, amount in expenses.items():
            file.write(f"{category}: ₹{amount}\n")
        file.write(f"Total Expenses: ₹{total_expenses}\n")
        file.write(f"Savings: ₹{savings}\n")

    print("\n✅ Summary saved to budget_summary.txt")

savings_tracker()
