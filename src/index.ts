import express from 'express';
import { identifyContact } from './controllers/identityController';

const app = express();
app.use(express.json()); // Parses incoming JSON payloads

app.post('/identify', identifyContact);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});