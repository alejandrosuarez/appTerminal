# Terminal Chat Simulator with Supabase

## Overview
This project is a WebSocket-based chat terminal that allows users to interact with a Supabase database using natural language commands. It leverages NLP (Natural Language Processing) to interpret user inputs and execute corresponding SQL queries against the database. The project is deployed on Render and uses environment variables to securely manage Supabase credentials.

### Key Features
- WebSocket-based chat interface for real-time interaction.
- Integration with Supabase for database operations.
- NLP-powered command recognition for human-friendly interactions.
- Secure handling of credentials using environment variables.
- Support for raw SQL queries (for testing purposes only).

---

## Prerequisites
Before setting up the project, ensure you have the following:
- **Node.js** (v18 or higher).
- **npm** (v6 or higher).
- A **Supabase** account and project set up.
- A **Render** account for deployment.
- A WebSocket client like `wscat` for testing (install with `npm install -g wscat`).

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/alejandrosuarez/appTerminal.git
cd appTerminal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the root directory with your Supabase credentials:
```bash
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```
- Replace `your-supabase-url` with the API URL from your Supabase project (e.g., `https://your-project-ref.supabase.co`).
- Replace `your-supabase-anon-key` with the `anon` key from your Supabase project (found in **Settings > API**).

### 4. Set Up Supabase (Optional for Testing)
- **Create Tables**: Use the Supabase dashboard to create tables (e.g., a `properties` table with columns like `id`, `location`, and `details`).
- **Enable Row-Level Security (RLS)**: Apply RLS policies to secure your data (e.g., allow `anon` to read but not write).
- **Create Custom SQL Function**: For raw SQL queries (testing only), create a custom PostgreSQL function in Supabase:
  ```sql
  CREATE OR REPLACE FUNCTION query(query_text text)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  BEGIN
    RETURN (
      SELECT json_agg(t)
      FROM (
        EXECUTE query_text
      ) AS t
    )::json;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error executing query: %', SQLERRM;
  END;
  $$;
  GRANT EXECUTE ON FUNCTION query(text) TO anon;
  ```

---

## Running the Project Locally

### 1. Start the Server
```bash
npm start
```
This will run the server on `http://localhost:5000` (or the port specified in `process.env.PORT`).

### 2. Connect to the WebSocket
Use a WebSocket client like `wscat`:
```bash
wscat -c ws://localhost:5000
```
- You should see: `Welcome to the terminal simulator! Type "exit" to quit.\nYou can also use "sql <query>" to run SQL commands (for testing).\n`

### 3. Test the Chat
- **SQL Query (for testing)**: Type `sql SELECT * FROM properties` to run a query.
- **Table Name**: Type a table name like `properties` to trigger a predefined query (e.g., `SELECT * FROM properties`).
- **Exit**: Type `exit` to close the session.

---

## Deployment on Render

### 1. Push to GitHub
- Ensure your code is committed and pushed to a GitHub repository.

### 2. Create a Web Service on Render
- Go to [Render](https://render.com/) and create a new **Web Service**.
- Connect your GitHub repository.
- Set the following in Render:
  - **Runtime**: Node.js (or Docker if you’re using a `Dockerfile`).
  - **Environment Variables**:
    - `SUPABASE_URL`: Your Supabase API URL.
    - `SUPABASE_KEY`: Your Supabase `anon` key.
  - **Build Command**: `npm install`.
  - **Start Command**: `npm start`.

### 3. Deploy the Service
- Click **Create Web Service** to build and deploy your app.
- Once deployed, Render will provide a URL (e.g., `https://your-service-name.onrender.com`).
- Connect to the WebSocket using `wscat -c wss://your-service-name.onrender.com`.

---

## Usage

### Chat Commands
- **`sql <query>`**: Execute a raw SQL query (e.g., `sql SELECT * FROM properties WHERE location = 'Downtown'`). **Note**: This is for testing only and should be locked down in production.
- **Table Name**: Type a table name (e.g., `properties`) to automatically run a predefined query (e.g., `SELECT * FROM properties`).
- **`exit`**: Close the chat session.

### Example Interaction
```bash
> properties
AI is typing...
Here are the properties:
Record 1:
  id: 1
  location: Downtown
  details: A cozy apartment in the city center
---
Record 2:
  id: 2
  location: Suburbs
  details: A spacious house with a garden
---
```

---

## Project Structure
- **`server.js`**: Main application file containing the Express server, WebSocket setup, and Supabase integration.
- **`package.json`**: Lists project dependencies and scripts.
- **`.env`** (local only): Stores Supabase credentials for local development.
- **`.gitignore`**: Excludes sensitive files and directories from version control.

---

## Contributing
We welcome contributions! To contribute:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`.
3. Commit your changes: `git commit -m 'Add feature'`.
4. Push to the branch: `git push origin feature-name`.
5. Submit a pull request.

---

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Security Considerations
- **SQL Execution**: The `sql <query>` command allows raw SQL execution, which is insecure for production. Lock this down by:
  - Removing the custom `query` function from Supabase.
  - Using predefined, parameterized queries with `supabase.from('table').select()`.
- **Environment Variables**: Never commit `.env` files or hardcode credentials. Always use environment variables for sensitive information.

---

## Troubleshooting
- **WebSocket Connection Issues**: Ensure you’re using `wss://` for Render deployments and `ws://` for local testing.
- **Supabase Errors**: Check the Supabase logs and ensure your credentials are correct.
- **Render Deployment Failures**: Review the Render logs for build or runtime errors.

For further assistance, open an issue in the repository.