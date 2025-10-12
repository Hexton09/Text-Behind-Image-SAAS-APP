/**
 * =================================================================
 * SERVER for Image Storage Application (Images Stored in MongoDB)
 * =================================================================
 * This version stores the actual image binary data directly within
 * each MongoDB document. It includes endpoints for upload, fetch,
 * search, DELETE, and is resilient to old data formats.
 * It also includes a daily credit system for users.
 * =================================================================
 */

// === 0. LOAD ENVIRONMENT VARIABLES ===
require('dotenv').config();

// === 1. IMPORT NECESSARY PACKAGES ===
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const admin = require('firebase-admin');

// === 2. INITIALIZE FIREBASE ADMIN SDK ===
try {
    admin.initializeApp({
        credential: admin.credential.applicationDefault()
    });
    console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    process.exit(1);
}

// === 3. INITIALIZE APP & DEFINE CONSTANTS ===
const app = express();
const PORT = process.env.PORT || 3000;
const DAILY_CREDIT_ALLOWANCE = 4;

// === 4. SETUP MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === 5. MONGODB DATABASE CONNECTION ===
const dbURI = process.env.MONGO_URI;
if (!dbURI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in the .env file.');
    process.exit(1);
}
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected Successfully.'))
    .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });

// === 6. DEFINE MONGODB SCHEMAS & MODELS ===
const UserSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
    credits: { type: Number, default: DAILY_CREDIT_ALLOWANCE },
    lastCreditReset: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const ImageSchema = new mongoose.Schema({
    originalName: { type: String, required: true },
    description: String,
    imageData: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    userId: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now }
});
const Image = mongoose.model('Image', ImageSchema);

// === 7. AUTHENTICATION & CREDIT REFRESH MIDDLEWARE ===
const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized: No token provided.' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        let user = await User.findOne({ uid: decodedToken.uid });
        if (!user) {
            user = new User({ uid: decodedToken.uid, email: decodedToken.email });
            await user.save();
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        if (user.lastCreditReset < today) {
            user.credits = DAILY_CREDIT_ALLOWANCE;
            user.lastCreditReset = new Date();
            await user.save();
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return res.status(403).json({ message: 'Forbidden: Invalid token.' });
    }
};

// === 8. ROLE MANAGEMENT MIDDLEWARE ===
const isSuperAdmin = async (req, res, next) => {
    try {
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied. Superadmin rights required.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ message: 'Error checking superadmin status.' });
    }
};

// === 9. ROLE & CREDIT MANAGEMENT ROUTES ===
app.post('/api/users/set-role', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const { uid, role } = req.body;
        if (!uid || !['admin', 'superadmin', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid user ID or role.' });
        }
        const user = await User.findOneAndUpdate({ uid }, { role }, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        await admin.auth().setCustomUserClaims(uid, { role });
        res.json({ message: 'User role updated successfully', user });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Error updating user role.' });
    }
});

app.get('/api/users', authMiddleware, isSuperAdmin, async (req, res) => {
    try {
        const users = await User.find({}, { _id: 0, __v: 0 });
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users.' });
    }
});

// --- NEW ROUTE: To get the current user's full profile ---
app.get('/api/users/me', authMiddleware, (req, res) => {
    // The authMiddleware already fetched the user and attached it to req.user
    res.json(req.user);
});


// --- UPDATED ROUTE: To deduct one credit ---
app.post('/api/users/use-credit', authMiddleware, async (req, res) => {
    try {
        if (req.user.role === 'user' && req.user.credits > 0) {
            const updatedUser = await User.findOneAndUpdate(
                { uid: req.user.uid },
                { $inc: { credits: -1 } },
                { new: true } // Return the updated document
            );
            return res.status(200).json({ credits: updatedUser.credits });
        }
        // Admins/Superadmins don't have credits deducted, just return current state
        res.status(200).json({ credits: req.user.credits });
    } catch (error) {
        console.error('Error deducting credit:', error);
        res.status(500).json({ message: 'Failed to deduct credit.' });
    }
});


// === 10. CONFIGURE MULTER FOR IN-MEMORY STORAGE ===
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 16 * 1024 * 1024 }
});

// === 11. IMAGE API ROUTES ===

// This route now only saves the final edited image to the gallery. It does NOT use credits.
app.post('/api/images/upload', authMiddleware, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file was uploaded.' });
    }
    const newImage = new Image({
        originalName: req.file.originalname,
        description: req.body.description || '',
        imageData: req.file.buffer,
        contentType: req.file.mimetype,
        userId: req.user.uid
    });
    try {
        await newImage.save();
        res.status(201).json({ message: 'File saved to gallery successfully' });
    } catch (error) {
        console.error('Error saving image to database:', error);
        res.status(500).json({ message: 'Error saving image to database.', error });
    }
});

const formatImagesForResponse = (images) => {
    return images.filter(img => img.imageData && img.contentType).map(img => {
        const imageBase64 = img.imageData.toString('base64');
        return {
            _id: img._id,
            originalName: img.originalName,
            description: img.description,
            imageData: `data:${img.contentType};base64,${imageBase64}`
        };
    });
};

app.get('/api/images', authMiddleware, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'user') {
            query = { userId: req.user.uid };
        }
        const images = await Image.find(query).sort({ uploadDate: -1 });
        res.status(200).json(formatImagesForResponse(images));
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ message: 'Error fetching images.', error });
    }
});

app.get('/api/images/search', authMiddleware, async (req, res) => {
    const { q: query } = req.query;
    if (!query) return res.status(400).json({ message: 'Search query parameter "q" is required.' });
    try {
        const searchCriteria = {
            $or: [
                { originalName: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        };
        let finalQuery = searchCriteria;
        if (req.user.role === 'user') {
            finalQuery = { $and: [{ userId: req.user.uid }, searchCriteria] };
        }
        const images = await Image.find(finalQuery).sort({ uploadDate: -1 });
        res.status(200).json(formatImagesForResponse(images));
    } catch (error) {
        console.error('Error searching images:', error);
        res.status(500).json({ message: 'Error searching images.', error });
    }
});

app.delete('/api/images/:id', authMiddleware, async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found.' });
        }
        if (req.user.role === 'user' && image.userId.toString() !== req.user.uid) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this image.' });
        }
        await Image.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: 'Image deleted successfully.' });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: 'Error deleting image.', error });
    }
});

// === 12. START THE SERVER ===
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

