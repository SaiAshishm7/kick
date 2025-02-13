const nodemailer = require('nodemailer');
const { generateBookingConfirmationEmail } = require('./emailTemplates');

// Logging function
const logEmailConfig = () => {
    console.log('📧 Email Configuration Details:');
    console.log('User:', process.env.EMAIL_USER ? process.env.EMAIL_USER.replace(/(.{3}).*(@.*)/, '$1***$2') : 'Not set');
    console.log('Host: smtp.gmail.com');
    console.log('Port: 587');
    console.log('Secure: false (TLS)');
};

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    try {
        // Log configuration before creating transporter
        logEmailConfig();

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // Use TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                // Do not fail on invalid certs
                rejectUnauthorized: false
            },
            debug: true, // Enable debug logs
            logger: true // Enable logging
        });

        // Verify transporter connection
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ Detailed SMTP Connection Error:', {
                    message: error.message,
                    code: error.code,
                    syscall: error.syscall,
                    address: error.address,
                    port: error.port,
                    stack: error.stack
                });
            } else {
                console.log('✅ SMTP Server is ready to send emails');
            }
        });

        return transporter;
    } catch (setupError) {
        console.error('❌ Email Transporter Setup Error:', {
            message: setupError.message,
            stack: setupError.stack
        });
        return null;
    }
};

// Function to send email
const sendEmail = async (options) => {
    const transporter = createTransporter();
    
    if (!transporter) {
        throw new Error('Email transporter could not be created');
    }

    try {
        const mailOptions = {
            from: `KickNClick <${process.env.EMAIL_USER}>`,
            to: options.to,
            subject: options.subject,
            html: options.html || options.text,
            text: options.text
        };

        console.log('📤 Attempting to send email:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject
        });

        const info = await transporter.sendMail(mailOptions);
        console.log('✉️ Email sent successfully:', info.messageId);
        return info;
    } catch (error) {
        console.error('Detailed Email Sending Error:', {
            message: error.message,
            stack: error.stack,
            to: options.to,
            subject: options.subject
        });
        throw error;
    }
};

// Specific function for booking confirmation email
const sendBookingConfirmationEmail = async (booking, userEmail) => {
    try {
        const emailHtml = generateBookingConfirmationEmail(booking);
        
        await sendEmail({
            to: userEmail,
            subject: `Booking Confirmation - ${booking.sport ? booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1) : 'Sport'} at ${booking.turf?.name || 'Turf'}`,
            html: emailHtml
        });
        
        console.log(`📧 Booking confirmation email sent to ${userEmail}`);
    } catch (error) {
        console.error('❌ Failed to send booking confirmation email:', {
            message: error.message,
            userEmail,
            bookingId: booking._id
        });
        throw error;
    }
};

// Specific function for booking cancellation email
const sendBookingCancellationEmail = async (booking) => {
    try {
        if (!booking || !booking.user || !booking.user.email) {
            console.warn('Cannot send cancellation email: Missing user details');
            return;
        }

        const emailHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Booking Cancellation - KickNClick</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
                .content { padding: 20px; }
                .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 0.8em; }
                .refund-details { background-color: #e9ecef; padding: 15px; border-radius: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Booking Cancellation</h1>
                </div>
                <div class="content">
                    <p>Dear ${booking.user.name},</p>
                    <p>Your booking for <strong>${booking.turf.name}</strong> on <strong>${new Date(booking.date).toLocaleDateString()}</strong> from <strong>${booking.startTime} to ${booking.endTime}</strong> has been cancelled.</p>
                    
                    <div class="refund-details">
                        <h3>Refund Details</h3>
                        <p>Total Booking Amount: ₹${booking.totalPrice}</p>
                        <p>Refund Amount: ₹${booking.refundAmount}</p>
                        <p>Cancellation Fee: ₹${booking.cancellationFee}</p>
                        <p>Cancellation Reason: ${booking.cancellationReason || 'Not specified'}</p>
                    </div>

                    <p>If you have any questions about your cancellation, please contact our customer support.</p>
                </div>
                <div class="footer">
                    <p> 2025 KickNClick. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        await sendEmail({
            to: booking.user.email,
            subject: `Booking Cancellation - ${booking.turf.name}`,
            html: emailHtml
        });

        console.log(`📨 Booking cancellation email sent to ${booking.user.email}`);
    } catch (error) {
        console.error('Error in booking cancellation email:', {
            message: error.message,
            stack: error.stack,
            bookingId: booking?._id,
            userEmail: booking?.user?.email
        });
        throw error;
    }
};

// Log configuration on module load
logEmailConfig();

module.exports = {
    sendEmail,
    sendBookingConfirmationEmail,
    sendBookingCancellationEmail
};
