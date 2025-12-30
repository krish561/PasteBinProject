const express = require('express');
const { createPaste, getPaste } = require('./dao');
const app = express();

app.use(express.json());

// Health Check
app.get('/api/healthz', (req, res) => res.json({ ok: true }));

// Create Paste
app.post('/api/pastes', async (req, res) => {
  try {
    const { content, ttl_seconds, max_views } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const id = await createPaste(content, ttl_seconds, max_views, req);
    
    // Fix: Ensure URL uses the correct protocol/host
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    res.json({ id, url: `${protocol}://${host}/p/${id}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// View Paste HTML
app.get('/p/:id', async (req, res) => {
  const paste = await getPaste(req.params.id, req);
  if (!paste) return res.status(404).send('<h1>404 - Paste Not Found or Expired</h1>');

  const safeContent = paste.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  res.send(`<html><body><pre>${safeContent}</pre></body></html>`);
});

// Home Page HTML
app.get('/', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>New Paste</h1>
        <textarea id="content" placeholder="Text"></textarea><br/>
        <input id="ttl" placeholder="TTL (seconds)"><input id="views" placeholder="Max Views"><br/>
        <button onclick="save()">Save</button>
        <div id="result"></div>
        <script>
          async function save() {
            const content = document.getElementById('content').value;
            const ttl = document.getElementById('ttl').value;
            const views = document.getElementById('views').value;
            const res = await fetch('/api/pastes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                content, 
                ttl_seconds: ttl ? parseInt(ttl) : undefined,
                max_views: views ? parseInt(views) : undefined
              })
            });
            const data = await res.json();
            document.getElementById('result').innerHTML = res.ok ? '<a href="' + data.url + '">' + data.url + '</a>' : 'Error';
          }
        </script>
      </body>
    </html>
  `);
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

module.exports = app;
