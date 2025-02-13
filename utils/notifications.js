const twilio = require('twilio');
const { google } = require('googleapis');
const { sendEmail } = require('./nodemailer');

class NotificationService {
    constructor() {
        // Twilio SMS configuration (optional)
        try {
            if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
                this.twilioClient = twilio(
                    process.env.TWILIO_ACCOUNT_SID, 
                    process.env.TWILIO_AUTH_TOKEN
                );
                this.twilioConfigured = true;
            } else {
                console.warn('Twilio SMS/WhatsApp notifications are not configured');
                this.twilioConfigured = false;
            }
        } catch (error) {
            console.error('Twilio configuration error:', error);
            this.twilioConfigured = false;
        }

        // Google Calendar configuration (optional)
        try {
            if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
                this.oauth2Client = new google.auth.OAuth2(
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_CLIENT_SECRET,
                    process.env.GOOGLE_REDIRECT_URL
                );
                this.googleCalendarConfigured = true;
            } else {
                console.warn('Google Calendar integration is not configured');
                this.googleCalendarConfigured = false;
            }
        } catch (error) {
            console.error('Google Calendar configuration error:', error);
            this.googleCalendarConfigured = false;
        }
    }

    // Send SMS notification
    async sendSMS(to, message) {
        if (!this.twilioConfigured) {
            console.warn('SMS sending skipped: Twilio not configured');
            return null;
        }

        try {
            const smsResponse = await this.twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            console.log('SMS sent:', smsResponse.sid);
            return smsResponse;
        } catch (error) {
            console.error('SMS sending error:', error);
            return null;
        }
    }

    // Send WhatsApp notification
    async sendWhatsAppMessage(to, message) {
        if (!this.twilioConfigured) {
            console.warn('WhatsApp message skipped: Twilio not configured');
            return null;
        }

        try {
            const whatsappResponse = await this.twilioClient.messages.create({
                body: message,
                from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
                to: `whatsapp:${to}`
            });
            console.log('WhatsApp message sent:', whatsappResponse.sid);
            return whatsappResponse;
        } catch (error) {
            console.error('WhatsApp message error:', error);
            return null;
        }
    }

    // Create Google Calendar event
    async createCalendarEvent(booking, userEmail) {
        if (!this.googleCalendarConfigured) {
            console.warn('Calendar event creation skipped: Google Calendar not configured');
            return null;
        }

        try {
            // Set OAuth2 credentials
            this.oauth2Client.setCredentials({
                access_token: process.env.GOOGLE_ACCESS_TOKEN,
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN
            });

            const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

            const event = {
                summary: `Turf Booking: ${booking.turf.name}`,
                location: booking.turf.location,
                description: `Booking for ${booking.sport} at ${booking.turf.name}`,
                start: {
                    dateTime: new Date(`${booking.date}T${booking.startTime}`),
                    timeZone: 'Asia/Kolkata'
                },
                end: {
                    dateTime: new Date(`${booking.date}T${booking.endTime}`),
                    timeZone: 'Asia/Kolkata'
                },
                attendees: [{ email: userEmail }],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 60 }
                    ]
                }
            };

            const calendarResponse = await calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });

            console.log('Calendar event created:', calendarResponse.data.htmlLink);
            return calendarResponse.data;
        } catch (error) {
            console.error('Calendar event creation error:', error);
            return null;
        }
    }

    // Comprehensive booking notification
    async sendBookingNotifications(booking, user) {
        try {
            // Email notification (always attempt)
            await sendEmail({
                to: user.email,
                subject: `Booking Confirmation - ${booking.turf.name}`,
                html: `Your booking is confirmed for ${booking.sport} at ${booking.turf.name}`
            });

            // SMS notification (optional)
            if (user.phone) {
                await this.sendSMS(user.phone, 
                    `Your turf booking for ${booking.sport} at ${booking.turf.name} is confirmed.`
                );
            }

            // WhatsApp notification (optional)
            if (user.phone) {
                await this.sendWhatsAppMessage(user.phone, 
                    `Your turf booking for ${booking.sport} at ${booking.turf.name} is confirmed.`
                );
            }

            // Google Calendar event (optional)
            await this.createCalendarEvent(booking, user.email);

        } catch (error) {
            console.error('Comprehensive notification error:', error);
            // Non-critical, so we don't rethrow
        }
    }
}

module.exports = new NotificationService();
