import { Request, Response } from 'express';
import { reconcileIdentity } from '../services/identityService';

export const identifyContact = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    // Convert phoneNumber to string if provided, as per schema needs
    const parsedPhone = phoneNumber ? String(phoneNumber) : undefined;
    const parsedEmail = email ? String(email) : undefined;

    if (!parsedEmail && !parsedPhone) {
      return res.status(400).json({ error: "Email or phoneNumber is required" });
    }

    const consolidatedContact = await reconcileIdentity(parsedEmail, parsedPhone);
    
    // Returns HTTP 200 response with JSON payload 
    return res.status(200).json({ contact: consolidatedContact });
  } catch (error) {
    console.error("Error identifying contact:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};