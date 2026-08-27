import axios from "axios";

export interface SendMailParams {
  subject: string;
  body?: string;
  to: string;
  templateName: string;
  replacements: Record<string, string>;
  consoleMessage?: string;
}

export async function sendMail({
  subject,
  body = "",
  to,
  templateName,
  replacements,
  consoleMessage,
}: SendMailParams) {
  try {
    const url = process.env.MAIL_URL;
    if (!url) {
      throw new Error("MAIL_URL environment variable is not set");
    }

    const response = await axios.post(url, {
      to,
      subject,
      body,
      templateName,
      replacements,
    });

    if (consoleMessage) {
      console.log(consoleMessage);
    }

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Failed to send email via Cloud Function:",
        error.response?.data || error.message
      );
    } else {
      console.error("Failed to send email:", (error as Error).message);
    }
    throw error;
  }
}
