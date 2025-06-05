const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const nlp = require('compromise');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize Supabase client with credentials from Render secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Serve a simple HTML page for testing (optional)
app.get('/', (req, res) => {
  res.send('<h1>Terminal Simulator</h1><p>Connect via WebSocket at wss://appterminal.onrender.com</p>');
});

// Function to format JSON results into a readable string
function formatQueryResults(data) {
  if (!data || data.length === 0) return 'No results found.';
  if (!Array.isArray(data)) return 'Invalid data format.';

  // Assuming data is an array of objects (e.g., properties)
  let output = 'Query Results:\n';
  data.forEach((item, index) => {
    output += `Record ${index + 1}:\n`;
    for (const [key, value] of Object.entries(item)) {
      output += `  ${key}: ${value}\n`;
    }
    output += '---\n';
  });
  return output;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send('Welcome to the terminal simulator! Type "exit" to quit.\nYou can also use "sql <query>" to run SQL commands (for testing).\n');

  ws.on('message', async (message) => {
    const input = message.toString().trim();
    if (input.toLowerCase() === 'exit') {
      ws.send('Session ended. Goodbye!\n');
      ws.close();
    } else if (input.toLowerCase().startsWith('sql ')) {
      // Handle SQL command
      const query = input.substring(4).trim(); // Extract the SQL query after "sql "
      if (!query) {
        ws.send('Please provide a valid SQL query after "sql".\n');
        return;
      }

      ws.send('AI is typing...\n');
      setTimeout(async () => {
        try {
          // Execute the raw SQL query using Supabase's custom function
          const { data, error } = await supabase.rpc('query', { query_text: query });
          if (error) {
            ws.send(`Error executing SQL query: ${error.message}\n`);
          } else {
            // Format the results for better display
            const formattedResults = formatQueryResults(data);
            ws.send(formattedResults + '\n');
          }
        } catch (err) {
          ws.send(`Unexpected error: ${err.message}\n`);
        }
      }, 1500); // 1.5-second delay to simulate typing
    } else {
      // Handle conversational AI with compromise
      ws.send('AI is typing...\n');
      setTimeout(() => {
        const doc = nlp(input);
        const isGreeting = doc.has('hi') || doc.has('hello') || doc.has('hey');
        const isQuestion = doc.questions().found;

        let response = '';
        if (isGreeting) {
          response = 'Hello! Nice to meet you. How can I assist you today?\n';
        } else if (isQuestion) {
          response = 'Interesting question! I’m a simple AI, so I can only respond to basic greetings or commands for now. Try "hi", "sql <query>" (for testing), or "exit".\n';
        } else {
          response = `You entered: ${input}. I’m a basic AI—try a greeting like "hi", "sql <query>" (for testing), or type "exit" to quit.\n`;
        }
        ws.send(response);
      }, 1500); // 1.5-second delay to simulate typing
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});