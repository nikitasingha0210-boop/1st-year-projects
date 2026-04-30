/* ═══════════════════════════════════════════════════
   AI STUDY PLANNER — server.js
   Stack : Node.js + Express + MongoDB + Mongoose
   Auth  : JWT + bcryptjs
═══════════════════════════════════════════════════ */

const express   = require('express');
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const cors      = require('cors');
const dotenv    = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

/* ─────────────────────────────────────────────────
   MIDDLEWARE
───────────────────────────────────────────────── */

// Parse incoming JSON requests
app.use(express.json());

// Enable CORS so the frontend can talk to this server
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ─────────────────────────────────────────────────
   MONGODB CONNECTION
───────────────────────────────────────────────── */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1); // Stop server if DB fails
  });

/* ─────────────────────────────────────────────────
   MONGOOSE SCHEMAS & MODELS
   All data stored in MongoDB via these schemas
───────────────────────────────────────────────── */

// ── USER ──
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  hoursGoal: {
    type: Number,
    default: 4,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

// ── SUBJECT ──
const subjectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);

// ── TASK ──
const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
  },
  due: {
    type: String, // stored as YYYY-MM-DD string
    default: '',
  },
  done: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Task = mongoose.model('Task', taskSchema);

// ── PLANNER TASK ──
const plannerTaskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
}, { timestamps: true });

const PlannerTask = mongoose.model('PlannerTask', plannerTaskSchema);

// ── GOAL ──
const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  done: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Goal = mongoose.model('Goal', goalSchema);

/* ─────────────────────────────────────────────────
   JWT AUTH MIDDLEWARE
   Protects private routes — checks Bearer token
───────────────────────────────────────────────── */
function protect(req, res, next) {
  // Token comes in header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token. Access denied.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Attach userId to request
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

/* ─────────────────────────────────────────────────
   HELPER — generate JWT token for a user
───────────────────────────────────────────────── */
function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

/* ═══════════════════════════════════════════════════
   ROUTES
═══════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────
   AUTH ROUTES
   POST /api/auth/signup  — Register new user
   POST /api/auth/login   — Login existing user
   GET  /api/auth/me      — Get logged-in user info
───────────────────────────────────────────────── */

// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    // Check if email already registered
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Create user (password hashed by pre-save hook)
    const user = await User.create({ name, email, password });

    // Return token + user info
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hoursGoal: user.hoursGoal,
      },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Compare password with hashed version in DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Return token + user info
    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hoursGoal: user.hoursGoal,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET LOGGED-IN USER
app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// UPDATE PROFILE
app.put('/api/auth/profile', protect, async (req, res) => {
  try {
    const { name, hoursGoal } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, hoursGoal },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ─────────────────────────────────────────────────
   SUBJECT ROUTES (all protected)
   GET    /api/subjects       — Get all subjects
   POST   /api/subjects       — Add a subject
   DELETE /api/subjects/:id   — Delete a subject
───────────────────────────────────────────────── */

// GET all subjects for logged-in user
app.get('/api/subjects', protect, async (req, res) => {
  try {
    const subjects = await Subject.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ADD a new subject
app.post('/api/subjects', protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }

    // Prevent duplicates for same user (case-insensitive)
    const existing = await Subject.findOne({
      userId: req.userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Subject already exists.' });
    }

    const subject = await Subject.create({ userId: req.userId, name: name.trim() });
    res.status(201).json({ success: true, message: 'Subject added.', subject });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE a subject
app.delete('/api/subjects/:id', protect, async (req, res) => {
  try {
    const subject = await Subject.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }
    res.json({ success: true, message: 'Subject deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ─────────────────────────────────────────────────
   TASK ROUTES (all protected)
   GET    /api/tasks          — Get all tasks
   POST   /api/tasks          — Add a task
   PUT    /api/tasks/:id      — Update (toggle done)
   DELETE /api/tasks/:id      — Delete a task
───────────────────────────────────────────────── */

// GET all tasks
app.get('/api/tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ADD a task
app.post('/api/tasks', protect, async (req, res) => {
  try {
    const { name, subject, due } = req.body;
    if (!name || !subject) {
      return res.status(400).json({ success: false, message: 'Name and subject are required.' });
    }
    const task = await Task.create({ userId: req.userId, name, subject, due });
    res.status(201).json({ success: true, message: 'Task created.', task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// UPDATE a task (toggle done or edit)
app.put('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, message: 'Task updated.', task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE a task
app.delete('/api/tasks/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ─────────────────────────────────────────────────
   PLANNER TASK ROUTES (all protected)
   GET    /api/planner        — Get all planner tasks
   POST   /api/planner        — Add a planner task
   DELETE /api/planner/:id    — Delete a planner task
───────────────────────────────────────────────── */

// GET all planner tasks
app.get('/api/planner', protect, async (req, res) => {
  try {
    const tasks = await PlannerTask.find({ userId: req.userId }).sort({ date: 1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ADD a planner task
app.post('/api/planner', protect, async (req, res) => {
  try {
    const { name, subject, date } = req.body;
    if (!name || !subject || !date) {
      return res.status(400).json({ success: false, message: 'Name, subject, and date are required.' });
    }
    const task = await PlannerTask.create({ userId: req.userId, name, subject, date });
    res.status(201).json({ success: true, message: 'Planner task added.', task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE a planner task
app.delete('/api/planner/:id', protect, async (req, res) => {
  try {
    const task = await PlannerTask.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ success: false, message: 'Planner task not found.' });
    res.json({ success: true, message: 'Planner task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ─────────────────────────────────────────────────
   GOAL ROUTES (all protected)
   GET    /api/goals          — Get all goals
   POST   /api/goals          — Add a goal
   PUT    /api/goals/:id      — Toggle goal done
   DELETE /api/goals/:id      — Delete a goal
───────────────────────────────────────────────── */

// GET all goals
app.get('/api/goals', protect, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ADD a goal
app.post('/api/goals', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Goal text is required.' });
    }
    const goal = await Goal.create({ userId: req.userId, text: text.trim() });
    res.status(201).json({ success: true, message: 'Goal added.', goal });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// UPDATE a goal (toggle done)
app.put('/api/goals/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    res.json({ success: true, message: 'Goal updated.', goal });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE a goal
app.delete('/api/goals/:id', protect, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found.' });
    res.json({ success: true, message: 'Goal deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

/* ─────────────────────────────────────────────────
   HEALTH CHECK ROUTE
   GET /api/health — Check if server is running
───────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ AI Study Planner server is running.',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/* ─────────────────────────────────────────────────
   404 HANDLER — Unknown routes
───────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

/* ─────────────────────────────────────────────────
   GLOBAL ERROR HANDLER
───────────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

/* ─────────────────────────────────────────────────
   START SERVER
───────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});


