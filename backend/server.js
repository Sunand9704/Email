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
    .connect("mongodb+srv://hosannaking2019_db_user:KSLPT7LuGynb17Ae@cluster0.2hev2lt.mongodb.net/?appName=Cluster0")
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

// Cron Job: Run every hour to check for 30-day alerts
cron.schedule('0 * * * *', async () => {
    console.log('Checking for 30-day email alerts...');
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find emails created <= 30 days ago that haven't been notified yet
        const pendingEmails = await Email.find({
            createdAt: { $lte: thirtyDaysAgo },
            notificationSent: false,
        });

        if (pendingEmails.length === 0) {
            console.log('No 30-day alerts to send.');
            return;
        }

        for (const emailDoc of pendingEmails) {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: emailDoc.email,
                subject: '30-Day Alert: Email Recovery Notification',
                html: `
                    <h3>30-Day Notification</h3>
                    <p>This is an automated alert for the email: <strong>${emailDoc.email}</strong></p>
                    <p>30 days have passed since this email was registered in our system.</p>
                `,
            };

            try {
                await transporter.sendMail(mailOptions);
                emailDoc.notificationSent = true;
                await emailDoc.save();
                console.log(`30-day alert sent to ${emailDoc.email}`);
            } catch (err) {
                console.error(`Failed to send alert to ${emailDoc.email}:`, err);
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
