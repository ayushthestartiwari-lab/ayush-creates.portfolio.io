import json
from datetime import datetime, timedelta
import time
import matplotlib.pyplot as plt

FILE_NAME = "study_data.json"

# ---------- DATA ----------
def load_data():
    try:
        with open(FILE_NAME, "r") as file:
            return json.load(file)
    except:
        return []

def save_data(data):
    with open(FILE_NAME, "w") as file:
        json.dump(data, file, indent=4)

# ---------- ADD SESSION ----------
def add_session():
    subject = input("Enter subject: ")
    duration = float(input("Enter study time (in hours): "))
    date = datetime.now().strftime("%Y-%m-%d")

    session = {
        "subject": subject,
        "duration": duration,
        "date": date
    }

    data = load_data()
    data.append(session)
    save_data(data)

    print("✅ Session added!")

# ---------- VIEW ----------
def view_sessions():
    data = load_data()
    if not data:
        print("No sessions yet.")
        return

    for i, s in enumerate(data, 1):
        print(f"{i}. {s['subject']} - {s['duration']} hrs on {s['date']}")

# ---------- GRAPH ----------
def show_graph():
    data = load_data()
    if not data:
        print("No data to show.")
        return

    daily = {}

    for s in data:
        daily[s["date"]] = daily.get(s["date"], 0) + s["duration"]

    dates = list(daily.keys())
    hours = list(daily.values())

    plt.plot(dates, hours, marker='o')
    plt.xlabel("Date")
    plt.ylabel("Study Hours")
    plt.title("Study Progress")
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.show()

# ---------- STREAK ----------
def study_streak():
    data = load_data()
    if not data:
        print("No data.")
        return

    dates = sorted(set(s["date"] for s in data))
    dates = [datetime.strptime(d, "%Y-%m-%d") for d in dates]

    streak = 1
    max_streak = 1

    for i in range(1, len(dates)):
        if dates[i] - dates[i-1] == timedelta(days=1):
            streak += 1
            max_streak = max(max_streak, streak)
        else:
            streak = 1

    print(f"🔥 Current Max Streak: {max_streak} days")

# ---------- POMODORO ----------
def pomodoro():
    work = 25 * 60
    break_time = 5 * 60

    print("🍅 Pomodoro started! (25 min work)")

    for i in range(work, 0, -1):
        print(f"Time left: {i//60}:{i%60:02d}", end="\r")
        time.sleep(1)

    print("\n✅ Work session complete!")

    print("😌 Break time (5 min)")
    for i in range(break_time, 0, -1):
        print(f"Break: {i//60}:{i%60:02d}", end="\r")
        time.sleep(1)

    print("\n🔁 Cycle complete!")

# ---------- MAIN ----------
def main():
    while True:
        print("\n--- Study Tracker Pro ---")
        print("1. Add Session")
        print("2. View Sessions")
        print("3. Show Graph")
        print("4. Study Streak")
        print("5. Pomodoro Timer")
        print("6. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            add_session()
        elif choice == "2":
            view_sessions()
        elif choice == "3":
            show_graph()
        elif choice == "4":
            study_streak()
        elif choice == "5":
            pomodoro()
        elif choice == "6":
            break
        else:
            print("Invalid choice")

if __name__ == "__main__":
    main()