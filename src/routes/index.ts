import { Router, Request, Response, NextFunction } from "express";
import {
  getDepositQr,
  getBalance,
  payPixQr,
  payPixKey,
} from "../services/sqala.service";
import { asyncHandler } from "../helpers.ts/error";
import {
  convertBRLToSats,
  getBTCPriceData,
} from "../services/conversion.service";

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

router.get(
  "/convert-sats",
  async (req: Request, res: Response, next: NextFunction) => {
    const brlQuery = req.query.brl;
    if (!brlQuery) {
      res.status(400).json({
        error:
          "Please provide a 'brl' query parameter, e.g., /convert-sats?brl=100",
      });
      return;
    }
    const brlAmount = parseFloat(brlQuery as string);
    if (isNaN(brlAmount)) {
      res.status(400).json({ error: "Invalid BRL amount provided." });
      return;
    }
    try {
      // Get the cached price data (price + last updated timestamp)
      const btcPriceData = await getBTCPriceData();
      const sats = convertBRLToSats(brlAmount, btcPriceData.price);
      res.json({
        brl: brlAmount,
        btcPriceInBRL: btcPriceData.price,
        sats,
        lastUpdatedTime: btcPriceData.lastUpdated,
      });
    } catch (error) {
      console.error("Error during conversion:", error);
      res.status(500).json({
        error: "Failed to convert BRL to satoshis. Please try again later.",
      });
    }
  }
);

export default router;
