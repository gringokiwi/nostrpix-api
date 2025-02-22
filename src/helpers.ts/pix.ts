import { cpf, cnpj } from "cpf-cnpj-validator";
import { phone } from "phone";
import * as email_validator from "email-validator";
import { validate as uuidValidate } from "uuid";
import {
  convert_brl_to_sats,
  get_btc_price_data,
} from "../services/conversion.service";

export const validate_pix_key = (
  pix_key: string
): {
  is_valid: boolean;
  formatted_key?: string;
} => {
  if (cpf.isValid(pix_key)) {
    return {
      is_valid: true,
      formatted_key: cpf.strip(pix_key),
    };
  }
  if (cnpj.isValid(pix_key)) {
    return {
      is_valid: true,
      formatted_key: cnpj.strip(pix_key),
    };
  }
  const phone_result = pix_key.includes("+")
    ? phone(pix_key)
    : phone(pix_key, { country: "BRA" });
  if (phone_result.isValid) {
    return {
      is_valid: true,
      formatted_key: phone_result.phoneNumber,
    };
  }
  if (email_validator.validate(pix_key)) {
    return {
      is_valid: true,
      formatted_key: pix_key,
    };
  }
  if (uuidValidate(pix_key)) {
    return {
      is_valid: true,
      formatted_key: pix_key,
    };
  }
  return {
    is_valid: false,
  };
};

export const validate_pix_amount = async (
  amount_brl_decimal: number,
  override_limits?: boolean
): Promise<{
  is_valid: boolean;
  amount_brl_cents: number;
  amount_brl_decimal: number;
  adjusted_amount_brl_cents: number;
  adjusted_amount_brl_decimal: number;
  adjusted_amount_sats: number;
}> => {
  if (!override_limits && amount_brl_decimal < 15) {
    throw new Error("Amount must be greater than 15");
  }
  if (!override_limits && amount_brl_decimal > 150) {
    throw new Error("Amount must be less than 150");
  }
  // Account for Sqala's 1% fee
  const adjusted_amount_brl_decimal = amount_brl_decimal / (1 - 0.01);
  const adjusted_amount_brl_cents = adjusted_amount_brl_decimal * 100;
  const { btc_price_brl } = await get_btc_price_data();
  const adjusted_amount_sats = convert_brl_to_sats(
    // Adjust for 5% BTCBRL spread
    adjusted_amount_brl_decimal / (1 - 0.05),
    btc_price_brl
  );
  return {
    is_valid: true,
    amount_brl_cents: amount_brl_decimal * 100,
    amount_brl_decimal,
    adjusted_amount_brl_cents,
    adjusted_amount_brl_decimal,
    adjusted_amount_sats,
  };
};
