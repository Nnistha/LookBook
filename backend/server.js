const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const authRoutes = require('./routes/auth');
const wardrobeRoutes = require('./routes/wardrobe');
const outfitRoutes = require('./routes/outfits');
const calendarRoutes = require('./routes/calendar');
const aiRoutes = require('./routes/ai');

const app = express();



app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));



app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));



app.get('/', (req, res) => {
  res.send("API is running 🚀");
});

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});



app.use('/api/auth', authRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/outfits', outfitRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/ai', aiRoutes);



mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));



const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});