import { Router } from "express";
import {
  getDepositQr,
  getBalance,
  payPixQr,
  payPixKey,
} from "../services/sqala.service";
import { asyncHandler } from "../helpers.ts/error";

const router = Router();

router.get(
  "/admin/deposit",
  asyncHandler(async (req, res) => {
    const depositQr = await getDepositQr({
      amountDecimal: Number(req.query.amount),
    });
    res.json({
      depositQr,
    });
  })
);

router.get(
  "/admin/balance",
  asyncHandler(async (req, res) => {
    const balance = await getBalance();
    res.json({
      balance,
    });
  })
);

router.get(
  "/user/pay",
  asyncHandler(async (req, res) => {
    if (req.query.qrCode) {
      const lookupResponse = await payPixQr(req.query.qrCode as string);
      return res.json({
        lookupResponse,
      });
    }

    if (req.query.pixKey && req.query.amount) {
      const success = await payPixKey({
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
