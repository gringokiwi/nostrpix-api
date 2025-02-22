// src/routes/strikeInvoiceRoute.ts

import { Router, Request, Response } from "express";
import { createStrikeInvoice } from "../services/strikeInvoice.service";
import { generateCorrelationId } from "../helpers/generateCorrelationId";

const router = Router();

router.post("/create-strike-invoice", async (req: Request, res: Response) => {
  try {
    // Always generate a new, unique correlation id
    const correlationId = generateCorrelationId();
    const invoice = await createStrikeInvoice({
      correlationId,
      description: req.body.description || "Invoice for order 123",
      amount: req.body.amount || { currency: "BTC", amount: "0.00001" },
    });
    res.json(invoice);
  } catch (error) {
    console.error("Error creating Strike invoice:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
