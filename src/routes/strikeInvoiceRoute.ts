// src/routes/strikeInvoiceRoute.ts

import { Router, Request, Response } from "express";
import { createStrikeInvoice } from "../services/strikeInvoice.service";
import { v4 as uuidv4 } from "uuid";

const router = Router();

router.post("/create-strike-invoice", async (req: Request, res: Response) => {
  const { description, amount } = req.body;
  const correlationId = uuidv4();

  try {
    const invoice = await createStrikeInvoice({
      correlationId,
      description,
      amount,
    });
    res.json(invoice);
  } catch (error) {
    console.error("Error creating Strike invoice:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
