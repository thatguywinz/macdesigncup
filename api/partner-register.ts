import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const formData = req.body;

    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    const sheetId = process.env.GOOGLE_SHEET_ID;

    if (!clientEmail || !privateKey || !sheetId) {
      throw new Error('Missing Google Sheets API credentials');
    }

    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: formattedPrivateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Flatten arrays into comma-separated strings and handle empty fields
    // Skip file fields (companyLogo, brandGuidelines) as they cannot be stored in sheets
    const excludedFields = ['companyLogo', 'brandGuidelines'];
    const rowValues = [
      new Date().toISOString(),
      ...Object.keys(formData)
        .filter(key => !excludedFields.includes(key))
        .map(key => {
          const val = (formData as any)[key];
          return Array.isArray(val) ? val.join(', ') : val ?? '';
        }),
    ];

    // Append submission starting after header row (increments to next empty row automatically)
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:A',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowValues],
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error submitting to Google Sheets:', error);
    return res.status(500).json({
      message: 'Failed to submit form data',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}