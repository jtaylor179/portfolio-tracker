from openai import OpenAI
import json

client = OpenAI()

# Load trading data from a JSON file
with open('trading_data.json', 'r') as file:
    trading_data = json.load(file)

# Load the detailed prompt from a text file
with open('detailed_prompt.txt', 'r') as file:
    detailed_prompt = file.read()

    

# Structuring the request for chat-like interaction
completion = client.chat.completions.create(
    model="gpt-4-1106-preview",  # Consider using an advanced model like GPT-4
    messages=[
        {"role": "system", "content": "You are an assistant capable of performing complex data analysis."},
        {"role": "user", "content": detailed_prompt + "\nData:\n" + json.dumps(trading_data)}
    ]
)

# Extracting and parsing the response
# Note that in chat completions, the response structure might differ
response_text = completion.choices[0].message  # Accessing the response in a chat-like format

print (response_text.content)


# Further processing of 'response_text' to transform it into a DataFrame, JSON object, etc.
