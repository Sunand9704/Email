const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const cron = require('node-cron'); // Import cron
const Email = require('./models/Email');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Variables
const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI;

// Database Connection
mongoose
    .connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Helper: Send Email
const sendRecoveryEmail = async (recipientEmail, targetEmailId) => {
    const trackingLink = `http://localhost:${PORT}/api/emails/seen/${targetEmailId}`;

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: recipientEmail,
        subject: 'Action Required: Email Recovery',
        html: `
            <h3>Email is recovered use the mail</h3>
            <p>Please click the button below to confirm you have seen this.</p>
            <a href="${trackingLink}" style="padding: 10px 20px; color: white; background-color: blue; text-decoration: none; border-radius: 5px;">Seen</a>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Recovery email sent to ${recipientEmail} for ID: ${targetEmailId}`);
    } catch (error) {
        console.error('Error sending recovery email:', error);
    }
};

// Cron Job: Run every 30 minutes
// Schedule: '*/30 * * * *'
cron.schedule('*/30 * * * *', async () => {
    console.log('Running 30-minute check for old emails...');
    try {
        // Find emails created > 31 days ago AND status is 'UNSEEN'
        const thirtyOneDaysAgo = new Date();
        thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

        const oldEmails = await Email.find({
            createdAt: { $lt: thirtyOneDaysAgo },
            status: 'UNSEEN',
        });

        if (oldEmails.length === 0) {
            console.log('No pending emails found for notification.');
            return;
        }

        const members = [process.env.MEMBER_1, process.env.MEMBER_2, process.env.MEMBER_3].filter(Boolean);

        if (members.length === 0) {
            console.log('No members configured in .env to receive emails.');
            return;
        }

        for (const emailDoc of oldEmails) {
            // Send to all 3 members
            for (const member of members) {
                await sendRecoveryEmail(member, emailDoc._id);
            }
        }
    } catch (error) {
        console.error('Error in cron job:', error);
    }
});

// Routes

// 1. Fetch all stored emails
app.get('/api/emails', async (req, res) => {
    try {
        const emails = await Email.find().sort({ createdAt: -1 });
        res.json(emails);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emails', error: error.message });
    }
});

// 2. Add a new email
app.post('/api/emails', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check total count
        const count = await Email.countDocuments();
        if (count >= 3) {
            return res.status(400).json({ message: 'Email limit reached (Max 3 allowed)' });
        }

        const newEmail = new Email({ email });
        await newEmail.save();

        res.status(201).json({ message: 'Email added successfully', email: newEmail });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Error adding email', error: error.message });
    }
});

// 3. Mark as Seen (Link clicked from email)
app.get('/api/emails/seen/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const email = await Email.findByIdAndUpdate(id, { status: 'SEEN' }, { new: true });

        if (!email) {
            return res.status(404).send('<h1>Email entry not found</h1>');
        }

        res.send('<h1>Acknowledged! notifications stopped.</h1>');
    } catch (error) {
        res.status(500).send('<h1>Error updating status</h1>');
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
