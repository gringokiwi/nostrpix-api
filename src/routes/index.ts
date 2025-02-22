import { Router, Request, Response } from "express";
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
  convert_brl_to_sats,
  get_btc_price_data,
} from "../services/conversion.service";
import { validate_pix_amount } from "../helpers.ts/pix";

const router = Router();

router.get(
  "/quote/:amount_brl_decimal",
  async_handler(async (req: Request, res: Response) => {
    const amount_brl_decimal = Number(req.params.amount_brl_decimal);
    if (isNaN(amount_brl_decimal)) {
      throw new Error(
        "Please provide a decimal amount in BRL, e.g. /convert/21.21"
      );
    }
    const { is_valid, adjusted_amount_sats } = await validate_pix_amount(
      amount_brl_decimal
    );
    if (!is_valid) {
      throw new Error("Invalid amount");
    }
    res.json({
      amount_brl: amount_brl_decimal,
      amount_sats: adjusted_amount_sats,
    });
  })
);

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
      amount_brl_decimal: Number(req.query.amount),
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
    if (!req.query.user_id || !req.query.public_key) {
      throw new Error("Missing user_id and/or public_key");
    }
    const response = await link_public_key_to_user({
      user_id: String(req.query.user_id),
      public_key: String(req.query.public_key),
    });
    return res.json(response);
  })
);

router.get(
  "/user/deposit",
  async_handler(async (req, res) => {
    if (!req.query.user_id && !req.query.public_key) {
      throw new Error("Missing user_id or public_key");
    }
    const user = await get_user({
      user_id: String(req.query.user_id),
      public_key: String(req.query.public_key),
    });
    res.status(500).json({
      error: "Not implemented",
      user,
    });
  })
);

router.get(
  "/user/pay",
  async_handler(async (req, res) => {
    if (!req.query.user_id) {
      throw new Error("Missing user_id");
    }
    if (!req.query.qr_code && !req.query.pix_key) {
      throw new Error("Must include either qr_code or pix_key");
    }
    if (req.query.qr_code) {
      const response = await pay_pix_via_qr({
        qr_code: String(req.query.qr_code),
        user_id: String(req.query.user_id),
      });
      return res.json(response);
    }
    if (isNaN(Number(req.query.amount))) {
      throw new Error("Amount must be a number");
    }
    const response = await pay_pix_via_key({
      pix_key: String(req.query.pix_key),
      amount_brl_decimal: Number(req.query.amount),
      user_id: String(req.query.user_id),
    });
    return res.json(response);
  })
);

export default router;
