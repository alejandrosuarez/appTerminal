const { handleChat, removeClient } = require('./chat');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const nlp = require('compromise');
const natural = require('natural');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

function formatQueryResults(data) {
    // ... (This function remains unchanged)
    if (!data || data.length === 0) return 'No results found.';
    if (!Array.isArray(data)) {
        let output = 'Query Result:\n';
        for (const [key, value] of Object.entries(data)) {
        output += `  ${key}: ${value}\n`;
        }
        return output;
    }
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

async function getTableNames() {
    // ... (This function remains unchanged)
    try {
        const { data, error } = await supabase.rpc('query', { query_text: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" });
        if (error) throw error;
        return data.map(row => row.table_name);
    } catch (err) {
        console.error('Error fetching table names:', err);
        return [];
    }
}

wss.on('connection', async (ws) => {
  console.log('Client connected');
  ws.send('Welcome to the terminal simulator! Type "exit" to quit.\nYou can also use "sql <query>" to run SQL commands.\n');

  const tableNames = await getTableNames();

  ws.on('message', async (message) => {
    // Let the chat module handle chat-specific messages first.
    const wasHandledByChat = handleChat(ws, message);
    if (wasHandledByChat) {
      return; // If it was a chat message, we're done.
    }

    // If it wasn't a chat message, process it as a command (SQL, etc.)
    const input = message.toString().trim();
    if (input.toLowerCase() === 'exit') {
      ws.send('Session ended. Goodbye!\n');
      ws.close();
    } else if (input.toLowerCase().startsWith('sql ')) {
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
            ws.send(formatQueryResults(data) + '\n');
          }
        } catch (err) {
          ws.send(`Unexpected error: ${err.message}\n`);
        }
      }, 1500);
    } else {
        // ... (This part with nlp, greetings, etc. remains unchanged)
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
            return;
          }
          response = 'I see you might be asking about data! Use "sql <query>" for now, or soon just say a table name like "properties" to query it.\n';
        } else {
          response = `You entered: ${input}. I’m a basic AI—try a greeting like "hi", "sql <query>", or type "exit" to quit.\n`;
        }
        ws.send(response);
      }, 1500);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});