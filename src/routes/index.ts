import { Router } from "express";
import {
  topupAccount,
  lookupPixQr,
  payStaticPix,
} from "../services/sqala.service";
import { parseError, asyncHandler } from "../helpers.ts/error";

const router = Router();

router.get(
  "/topup/:amount",
  asyncHandler(async (req, res) => {
    const depositQr = await topupAccount({
      amountDecimal: Number(req.params.amount),
    });
    res.json({
      depositQr,
    });
  })
);

router.get(
  "/pay-pix",
  asyncHandler(async (req, res) => {
    if (req.query.qrCode) {
      const lookupResponse = await lookupPixQr(req.query.qrCode as string);
      return res.json({
        lookupResponse,
      });
    }

    if (req.query.pixKey && req.query.amount) {
      const success = await payStaticPix({
        pixKey: req.query.pixKey as string,
        amountDecimal: Number(req.query.amount),
      });
      return res.json({
        success,
      });
    }

    res.status(400).json({ error: "Missing pixKey + amount, or qrCode" });
  })
);

export default router;
