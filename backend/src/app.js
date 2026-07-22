const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'API is healthy' });
});

// Applied after /health so uptime checks are never throttled.
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
