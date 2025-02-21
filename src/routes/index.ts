import { Router, Request, Response, NextFunction } from "express";
import {
  get_admin_deposit_qr,
  get_admin_balance_brl,
  pay_pix_via_qr,
  pay_pix_via_key,
} from "../services/sqala.service";
import { async_handler } from "../helpers.ts/error";
import {
  get_user,
  link_public_key_to_user,
  list_user_lightning_deposits,
  list_user_pix_payments,
} from "../services/database.service";
import {
  convertBRLToSats,
  getBTCPriceData,
} from "../services/conversion.service";

const router = Router();

router.get(
  "/admin/balance",
  async_handler(async (req, res) => {
    const response = await get_admin_balance_brl();
    res.json(response);
  })
);

router.get(
  "/admin/deposit",
  async_handler(async (req, res) => {
    if (isNaN(Number(req.query.amount))) {
      return res.status(400).json({
        error: "Amount must be a number",
      });
    }
    const response = await get_admin_deposit_qr({
      amount_decimal: Number(req.query.amount),
    });
    res.json(response);
  })
);

router.get(
  "/user/login",
  async_handler(async (req, res) => {
    if (req.query.user_id) {
      const response = await get_user({
        user_id: String(req.query.user_id),
      });
      return res.json(response);
    }
    if (req.query.public_key) {
      const response = await get_user({
        public_key: String(req.query.public_key),
      });
      return res.json(response);
    }
    const user = await get_user({});
    const pix_payments = await list_user_pix_payments(user.id);
    const lightning_deposits = await list_user_lightning_deposits(user.id);
    return res.json({
      user,
      pix_payments,
      lightning_deposits,
    });
  })
);

router.get(
  "/user/link",
  async_handler(async (req, res) => {
    if (req.query.user_id && req.query.public_key) {
      const response = await link_public_key_to_user({
        user_id: String(req.query.user_id),
        public_key: String(req.query.public_key),
      });
      return res.json(response);
    }
    res.status(400).json({
      error: "Missing user_id and/or public_key",
    });
  })
);

router.get(
  "/user/deposit",
  async_handler(async (req, res) => {
    if (req.query.user_id || req.query.public_key) {
      const user = await get_user({
        user_id: String(req.query.user_id),
        public_key: String(req.query.public_key),
      });
      res.status(500).json({
        error: "Not implemented",
        user,
      });
    }
    res.status(400).json({
      error: "Missing user_id or public_key",
    });
  })
);

router.get(
  "/user/pay",
  async_handler(async (req, res) => {
    if (req.query.qr_code) {
      const response = await pay_pix_via_qr(String(req.query.qr_code));
      return res.json(response);
    }
    if (req.query.pix_key && !isNaN(Number(req.query.amount))) {
      const response = await pay_pix_via_key({
        pix_key: String(req.query.pix_key),
        amount_decimal: Number(req.query.amount),
      });
      return res.json(response);
    }
    res.status(400).json({
      error: "Missing either qr_code, or both/either pix_key and amount",
    });
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
