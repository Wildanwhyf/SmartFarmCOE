const express = require ('express');
const dotenv = require ('dotenv');
const cors = require ('cors');
const sensorRoutes = require('./routes/sensor');
const authRoutes = require('./routes/auth');
const thresholdRoutes = require('./routes/threshold');
const configRoutes = require('./routes/config');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API running successfully' });
});

app.use('/api/sensor', sensorRoutes );

app.use('/api/auth', authRoutes);

app.use('/api/thresholds', thresholdRoutes);

app.use('/api/config', configRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});