import { google } from 'googleapis';

const OAuth2 = google.auth.OAuth2;

/**
 * Creates an email transporter using Gmail REST API (not SMTP).
 * This bypasses SMTP port restrictions on platforms like Render.
 */
const createTransporter = async () => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
            throw new Error('Missing Google OAuth2 credentials in environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN');
        }

        const oauth2Client = new OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });

        // Verify credentials by getting access token
        await oauth2Client.getAccessToken();
        console.log('✓ Gmail OAuth2 access token fetched successfully');

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Return an object that mimics nodemailer's transporter interface
        return {
            sendMail: async (mailOptions) => {
                const { from, to, subject, html, text } = mailOptions;

                // Build RFC 2822 formatted email
                const messageParts = [
                    `From: ${from}`,
                    `To: ${to}`,
                    `Subject: ${subject}`,
                    'MIME-Version: 1.0',
                    'Content-Type: text/html; charset=utf-8',
                    '',
                    html || text || '',
                ];
                const message = messageParts.join('\n');

                // Encode to base64url format
                const encodedMessage = Buffer.from(message)
                    .toString('base64')
                    .replace(/\+/g, '-')
                    .replace(/\//g, '_')
                    .replace(/=+$/, '');

                const result = await gmail.users.messages.send({
                    userId: 'me',
                    requestBody: {
                        raw: encodedMessage,
                    },
                });

                return { messageId: result.data.id };
            },
        };
    } catch (error) {
        console.error('✗ Transporter creation failed:', error.message);
        throw error;
    }
};

export default createTransporter;
