const Handlebars = require('handlebars');

// Booking Confirmation Email Template
const bookingConfirmationTemplate = Handlebars.compile(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation - KickNClick</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background-color: #4CAF50;
            color: white;
            text-align: center;
            padding: 20px;
            border-radius: 10px 10px 0 0;
        }
        .booking-details {
            margin-top: 20px;
        }
        .booking-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .booking-details td {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #777;
            font-size: 12px;
        }
        .cta-button {
            display: block;
            width: 200px;
            margin: 20px auto;
            padding: 12px 20px;
            background-color: #4CAF50;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 5px;
        }
        .loyalty-section {
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Confirmed!</h1>
        </div>
        
        <div class="booking-details">
            <h2>Booking Details</h2>
            <table>
                <tr>
                    <td><strong>Booking ID:</strong></td>
                    <td>{{bookingId}}</td>
                </tr>
                <tr>
                    <td><strong>Turf Name:</strong></td>
                    <td>{{turfName}}</td>
                </tr>
                <tr>
                    <td><strong>Date:</strong></td>
                    <td>{{bookingDate}}</td>
                </tr>
                <tr>
                    <td><strong>Time Slot:</strong></td>
                    <td>{{startTime}} - {{endTime}}</td>
                </tr>
                <tr>
                    <td><strong>Total Price:</strong></td>
                    <td>₹{{totalPrice}}</td>
                </tr>
                <tr>
                    <td><strong>Sport:</strong></td>
                    <td>{{sport}}</td>
                </tr>
            </table>
        </div>

        <a href="{{dashboardLink}}" class="cta-button">View Booking</a>

        <div class="footer">
            <p> 2025 KickNClick. All rights reserved.</p>
            <p>If you have any questions, contact our support team.</p>
        </div>
    </div>
</body>
</html>
`);

// Function to generate booking confirmation email
const generateBookingConfirmationEmail = (booking) => {
    // Extensive logging for debugging
    console.log('🔍 Booking Object for Email:', JSON.stringify(booking, null, 2));

    // Ensure all required fields are present and handle potential undefined values
    const context = {
        bookingId: booking._id ? booking._id.toString() : 'N/A',
        turfName: booking.turfName || (booking.turf && booking.turf.name) || 'Unknown Turf',
        bookingDate: booking.date ? new Date(booking.date).toLocaleDateString() : 'N/A',
        startTime: booking.startTime || 'N/A',
        endTime: booking.endTime || 'N/A',
        totalPrice: booking.totalPrice ? booking.totalPrice.toFixed(2) : 'N/A',
        sport: booking.sport ? booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1) : 'N/A',
        loyaltyPointsEarned: booking.loyaltyPointsEarned || 0,
        newLoyaltyTier: booking.newLoyaltyTier || 'Bronze',
        dashboardLink: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/bookings` : '#'
    };

    console.log('📧 Email Context:', JSON.stringify(context, null, 2));

    // Modify email template to include loyalty information
    const loyaltyHtml = context.loyaltyPointsEarned > 0 
        ? `
        <div class="loyalty-section">
            <h3>Loyalty Rewards</h3>
            <p>🌟 You've earned ${context.loyaltyPointsEarned} loyalty points!</p>
            <p>Your current loyalty tier: ${context.newLoyaltyTier}</p>
        </div>
        `
        : '';

    // Inject loyalty HTML into the existing template
    const emailHtml = bookingConfirmationTemplate(context);
    return emailHtml.replace('</div>', `${loyaltyHtml}</div>`);
};

module.exports = {
    generateBookingConfirmationEmail
};
