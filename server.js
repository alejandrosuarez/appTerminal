const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const nlp = require('compromise'); // Keep for now, can remove later
const natural = require('natural');
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
  if (!Array.isArray(data)) {
    // Handle single object
    let output = 'Query Result:\n';
    for (const [key, value] of Object.entries(data)) {
      output += `  ${key}: ${value}\n`;
    }
    return output;
  }

  // Handle array of objects (e.g., table rows)
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

// Function to get table names (for future query assistance)
async function getTableNames() {
  try {
    const { data, error } = await supabase.rpc('query', { query_text: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" });
    if (error) throw error;
    return data.map(row => row.table_name);
  } catch (err) {
    console.error('Error fetching table names:', err);
    return [];
  }
}

// WebSocket connection handling
wss.on('connection', async (ws) => {
  console.log('Client connected');
  ws.send('Welcome to the terminal simulator! Type "exit" to quit.\nYou can also use "sql <query>" to run SQL commands (for testing).\n');

  // Preload table names for query assistance
  const tableNames = await getTableNames();

  ws.on('message', async (message) => {
    const input = message.toString().trim();
    if (input.toLowerCase() === 'exit') {
      ws.send('Session ended. Goodbye!\n');
      ws.close();
    } else if (input.toLowerCase().startsWith('sql ')) {
      // Handle SQL command
      const query = input.substring(4).trim();
      if (!query) {
        ws.send('Please provide a valid SQL query after "sql".\n');
        return;
      }

      ws.send('AI is typing...\n');
      setTimeout(async () => {
        try {
          const { data, error } = await supabase.rpc('query', { query_text: query });
          if (error) {
            ws.send(`Error executing SQL query: ${error.message}\n`);
          } else {
            const formattedResults = formatQueryResults(data);
            // Use natural to analyze intent or structure (basic for now)
            const tokenizer = new natural.WordTokenizer();
            const tokens = tokenizer.tokenize(input);
            const hasTable = tableNames.some(table => tokens.includes(table.toLowerCase()));

            let response = formattedResults;
            if (hasTable) {
              response += '\nAI detected a table name. Next time, just say the table (e.g., "properties") to query it!\n';
            }
            ws.send(response + '\n');
          }
        } catch (err) {
          ws.send(`Unexpected error: ${err.message}\n`);
        }
      }, 1500); // 1.5-second delay to simulate typing
    } else {
      // Handle conversational AI with compromise and natural
      ws.send('AI is typing...\n');
      setTimeout(() => {
        const doc = nlp(input);
        const isGreeting = doc.has('hi') || doc.has('hello') || doc.has('hey');
        const isQuestion = doc.questions().found;
        const tokenizer = new natural.WordTokenizer();
        const tokens = tokenizer.tokenize(input.toLowerCase());

        let response = '';
        if (isGreeting) {
          response = 'Hello! Nice to meet you. How can I assist you today?\n';
        } else if (isQuestion || tokens.some(token => tableNames.includes(token))) {
            const tableMatch = tokens.find(token => tableNames.includes(token));
            if (tableMatch) {
                // Simple query for the matched table
                ws.send('AI is typing...\n');
                setTimeout(async () => {
                try {
                    const { data, error } = await supabase.from(tableMatch).select('*');
                    if (error) {
                    ws.send(`Error querying ${tableMatch}: ${error.message}\n`);
                    } else {
                    const formattedResults = formatQueryResults(data);
                    ws.send(`Here are the ${tableMatch}:\n${formattedResults}\n`);
                    }
                } catch (err) {
                    ws.send(`Unexpected error: ${err.message}\n`);
                }
                }, 1500);
                return; // Exit early to avoid the default response
            }  
            response = 'I see you might be asking about data! Use "sql <query>" for now, or soon just say a table name like "properties" to query it.\n';
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