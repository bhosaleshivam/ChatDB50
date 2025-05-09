ChatDB50: Natural Language Interface for SQL & NoSQL Databases

ChatDB50 is a full-stack web application that allows users to query both SQL and NoSQL (MongoDB) databases using natural language. It leverages a Large Language Model (LLM) to convert user-friendly English queries into executable database-specific queries and presents results in an intuitive format.

✨ Features

Accepts natural language input and converts it to SQL or MongoDB queries

Executes queries on MySQL and MongoDB databases

Displays results in a clean, readable format

Powered by an LLM API for query translation

🧰 Prerequisites

Ensure the following tools and environments are installed:

1. Python (≥3.8)

Recommended: Use a virtual environment (venv or conda)

2. Node.js & npm (for frontend)

Download Node.js

3. MongoDB

Install MongoDB Community Edition or connect to a cloud MongoDB instance (MongoDB Atlas)

4. MySQL

Install MySQL server and create sample database

5. OpenAI API Key (or other LLM provider)

Generate your API key from OpenAI

Save it securely in your backend or config

📁 Project Structure

ChatDB50/
│
├── backend/
│   └── backend.py             # Flask backend API and query execution logic
│
├── frontend/
│   ├── public/                # Public assets (index.html, favicon, etc.)
│   ├── src/                   # Frontend source code
│   │   ├── App.js
│   │   ├── components/
│   │   │   └── QueryInput.js
│   │   └── utils/
│   │       ├── jsonToTableString.ts
│   │       ├── patternMatcher.ts
│   │       └── queryExecuter.ts
│   ├── components.json
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vite.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── eslint.config.js
│
└── README.md

⚙️ Setup Instructions

🔹 Backend (Flask + LLM)

Clone the Repository

git clone https://github.com/yourusername/chatdb50.git
cd chatdb50/backend

Create Virtual Environment

python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

Install Dependencies

pip install -r requirements.txt

Run Backend

python backend.py

🔹 Frontend (React + Vite + TailwindCSS)

Navigate to frontend directory

cd ../frontend

Install Dependencies

npm install

Start the Development Server

npm run preview

🧪 Example Usage

Input: Show me all customers who purchased in January

Translated SQL: SELECT * FROM purchases WHERE MONTH(purchase_date) = 1

Translated MongoDB:

db.purchases.find({ purchase_date: { $gte: ISODate("2023-01-01"), $lt: ISODate("2023-02-01") } })

🤖 Prompt Engineering Tips (for developers)

If you're customizing prompts for your LLM:

prompt = f"""
Convert this natural language request into a {'MongoDB' if db_type == 'mongo' else 'SQL'} query:
"{user_input}"

Schema hint: {schema_info}
"""

📌 Future Improvements

Add support for voice-based queries

User authentication and session-based history

Add support for PostgreSQL, Cassandra, Firebase

Fine-tune LLM prompts for improved precision and error handling

