import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve i file statici dalla cartella 'dist' (generata da npm run build)
app.use(express.static(path.join(__dirname, 'dist')));

// Gestisce tutte le altre rotte restituendo l'index.html di Vite (SPA catch-all)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// PASSO 1: Configurazione della porta dinamica
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
