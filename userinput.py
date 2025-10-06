# userinput.py
user_input = input("prompt: ")
print(f"You entered: {user_input}")

if user_input == "stop":
    print("Exiting...")
    exit(0)