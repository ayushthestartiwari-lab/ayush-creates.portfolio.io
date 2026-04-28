# Bus Route Management System

class Bus:
    def __init__(self, bus_id, route, capacity):
        self.bus_id = bus_id
        self.route = route
        self.capacity = capacity
        self.booked_seats = 0

    def book_seat(self, passenger_name):
        if self.booked_seats < self.capacity:
            self.booked_seats += 1
            print(f"Seat booked for {passenger_name} on Bus {self.bus_id} ({self.route}).")
        else:
            print(f"Sorry, Bus {self.bus_id} is full.")

    def available_seats(self):
        return self.capacity - self.booked_seats

    def __str__(self):
        return f"Bus {self.bus_id} | Route: {self.route} | Capacity: {self.capacity} | Available: {self.available_seats()}"


class BusRouteManagement:
    def __init__(self):
        self.buses = {}

    def add_bus(self, bus_id, route, capacity):
        if bus_id in self.buses:
            print("Bus ID already exists.")
        else:
            self.buses[bus_id] = Bus(bus_id, route, capacity)
            print(f"Bus {bus_id} added successfully.")

    def view_buses(self):
        if not self.buses:
            print("No buses available.")
        else:
            for bus in self.buses.values():
                print(bus)

    def book_ticket(self, bus_id, passenger_name):
        if bus_id in self.buses:
            self.buses[bus_id].book_seat(passenger_name)
        else:
            print("Bus ID not found.")


# ------------------- MAIN PROGRAM -------------------
def main():
    system = BusRouteManagement()

    while True:
        print("\n--- Bus Route Management System ---")
        print("1. Add Bus")
        print("2. View Buses")
        print("3. Book Ticket")
        print("4. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            bus_id = input("Enter Bus ID: ")
            route = input("Enter Route: ")
            capacity = int(input("Enter Capacity: "))
            system.add_bus(bus_id, route, capacity)

        elif choice == "2":
            system.view_buses()

        elif choice == "3":
            bus_id = input("Enter Bus ID: ")
            passenger_name = input("Enter Passenger Name: ")
            system.book_ticket(bus_id, passenger_name)

        elif choice == "4":
            print("Exiting system...")
            break

        else:
            print("Invalid choice. Try again.")


if __name__ == "__main__":
    main()
