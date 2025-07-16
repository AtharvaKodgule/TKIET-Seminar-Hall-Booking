const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'yashkodgule@gmail.com',
        pass: 'xlgq ltsu pykg pufw' // App password
    }
});

// Function to send booking notification to admin
const sendBookingNotificationToAdmin = async (bookingDetails) => {
    try {
        const {
            id,
            user_id,
            hall_name,
            full_name,
            department,
            booking_date,
            start_time,
            end_time,
            purpose
        } = bookingDetails;

        const emailContent = `
            <h2>New Hall Booking Request</h2>
            <p>A new booking request has been received with the following details:</p>
            <table style="border-collapse: collapse; width: 100%; margin-top: 20px;">
                <tr style="background-color: #f2f2f2;">
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Booking ID:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>User Name:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${full_name}</td>
                </tr>
                <tr style="background-color: #f2f2f2;">
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Department:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${department}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Hall Name:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${hall_name}</td>
                </tr>
                <tr style="background-color: #f2f2f2;">
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${booking_date}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${start_time} - ${end_time}</td>
                </tr>
                <tr style="background-color: #f2f2f2;">
                    <td style="padding: 8px; border: 1px solid #ddd;"><strong>Purpose:</strong></td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${purpose}</td>
                </tr>
            </table>
            <p style="margin-top: 20px;">Please review this request in the admin dashboard.</p>
            <p><a href="http://localhost:3005/admin-dashboard.html" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        `;

        const mailOptions = {
            from: 'yashkodgule@gmail.com',
            to: 'yashkodgule@gmail.com', // Admin email
            subject: `New Hall Booking Request - ${hall_name}`,
            html: emailContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

module.exports = {
    sendBookingNotificationToAdmin
}; 