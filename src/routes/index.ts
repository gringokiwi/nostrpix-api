import { Router } from "express";
import {
  topupAccount,
  lookupPixQr,
  payStaticPix,
} from "../services/sqala.service";
import { parseError } from "../helpers.ts/error";

const router = Router();

router.get("/topup/:amount", async (req, res) => {
  const topupResponse = await topupAccount({
    amountDecimal: Number(req.params.amount),
  });
  res.json({
    topupResponse,
  });
});

router.get("/pay-pix", async (req, res) => {
  if (req.query.qrCode) {
    try {
      const lookupResponse = await lookupPixQr(req.query.qrCode as string);
      res.json({
        lookupResponse,
      });
    } catch (error) {
      const parsedError = parseError(error);
      res.status(500).json({ error: parsedError });
    }
  }
  if (req.query.pixKey && req.query.amount) {
    try {
      const paymentResponse = await payStaticPix({
        pixKey: req.query.pixKey as string,
        amountDecimal: Number(req.query.amount),
      });
      res.json({
        paymentResponse,
      });
    } catch (error) {
      const parsedError = parseError(error);
      res.status(500).json({ error: parsedError });
    }
  }
  res.status(400).json({ error: "Missing pixKey + amount or qrCode" });
});

export default router;
