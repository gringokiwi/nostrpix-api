import { Router, Request, Response } from "express";
import {
  get_admin_deposit_qr,
  get_admin_balance_brl,
  pay_pix_via_qr,
  pay_pix_via_key,
} from "../services/sqala.service";
import { async_handler, CustomError } from "../services/error.service";
import {
  insert_user,
  get_user,
  list_user_lightning_deposits,
  list_user_pix_payments,
} from "../services/supabase.service";
import { validate_pix_amount } from "../services/pix.service";
import {
  check_lightning_deposit_status,
  check_lightning_deposit_statuses,
  generate_lightning_deposit,
} from "../services/strike.service";

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
    res.status(500).send("Disabled");
  })
);

router.get(
  "/quote",
  async_handler(async (req: Request, res: Response) => {
    const amount_brl_decimal = Number(req.query.amount_brl);
    if (isNaN(amount_brl_decimal)) {
      throw new CustomError(`Invalid or missing 'amount_brl'`);
    }
    const { adjusted_amount_sats } = await validate_pix_amount(
      amount_brl_decimal
    );
    const response = {
      amount_brl: amount_brl_decimal,
      amount_sats: adjusted_amount_sats,
    };
    res.json(response);
  })
);

router.get(
  "/user/new",
  async_handler(async (req, res) => {
    const user = await insert_user();
    return res.json(user);
  })
);

router.get(
  "/user/:user_id/details",
  async_handler(async (req, res) => {
    if (!req.params.user_id) {
      throw new CustomError(`Missing 'user_id'`);
    }
    const user = await get_user(String(req.params.user_id));
    const pix_payments = await list_user_pix_payments(user.id);
    const lightning_deposits = await list_user_lightning_deposits(user.id);
    const response = {
      user,
      pix_payments,
      lightning_deposits,
    };
    return res.json(response);
  })
);

router.get(
  "/user/:user_id/details/refresh",
  async_handler(async (req, res) => {
    if (!req.params.user_id) {
      throw new CustomError(`Missing 'user_id'`);
    }
    await check_lightning_deposit_statuses(String(req.params.user_id));
    const user = await get_user(String(req.params.user_id));
    const pix_payments = await list_user_pix_payments(user.id);
    const lightning_deposits = await list_user_lightning_deposits(user.id);
    const response = {
      user,
      pix_payments,
      lightning_deposits,
    };
    return res.json(response);
  })
);

router.get(
  "/user/:user_id/deposit/new",
  async_handler(async (req, res) => {
    if (!req.params.user_id) {
      throw new CustomError(`Missing 'user_id'`);
    }
    const amount_sats = Number(req.query.amount_sats);
    if (isNaN(amount_sats)) {
      throw new CustomError(`Missing 'amount_sats'`);
    }
    const response = await generate_lightning_deposit(
      amount_sats,
      String(req.params.user_id)
    );
    res.json(response);
  })
);

router.get(
  "/user/:user_id/deposit/:lnurl",
  async_handler(async (req, res) => {
    if (!req.params.lnurl) {
      throw new CustomError(`Missing 'lnurl'`);
    }
    const response = await check_lightning_deposit_status(
      String(req.params.lnurl)
    );
    res.json(response);
  })
);

router.get(
  "/user/:user_id/pay",
  async_handler(async (req, res) => {
    if (!req.params.user_id) {
      throw new CustomError(`Missing 'user_id'`);
    }
    if (!req.query.qr_code && !req.query.pix_key) {
      throw new CustomError(`Missing 'qr_code' or 'pix_key'`);
    }
    if (req.query.qr_code) {
      const response = await pay_pix_via_qr({
        qr_code: String(req.query.qr_code),
        user_id: String(req.params.user_id),
      });
      return res.json(response);
    }
    const amount_brl_decimal = Number(req.query.amount_brl);
    if (isNaN(amount_brl_decimal)) {
      throw new CustomError(`Invalid or missing 'amount_brl'`);
    }
    const response = await pay_pix_via_key({
      pix_key: String(req.query.pix_key),
      amount_brl_decimal,
      user_id: String(req.params.user_id),
    });
    return res.json(response);
  })
);

export default router;
