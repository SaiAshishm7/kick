const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Use Gmail's SMTP service (can replace with any provider)
    auth: {
        user: 'your-email@gmail.com',  // Your email address
        pass: 'your-email-password'    // Your email password (or use app-specific password)
    }
});

// Function to send email
const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: to,
            subject: subject,
            text: text
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent!');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = sendEmail;
