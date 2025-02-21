import { cpf, cnpj } from "cpf-cnpj-validator";
import { phone } from "phone";
import * as email_validator from "email-validator";
import { validate as uuidValidate } from "uuid";

export const validate_pix_key = (pix_key: string): string => {
  if (cpf.isValid(pix_key)) {
    return cpf.strip(pix_key);
  }
  if (cnpj.isValid(pix_key)) {
    return cnpj.strip(pix_key);
  }
  const phone_result = pix_key.includes("+")
    ? phone(pix_key)
    : phone(pix_key, { country: "BRA" });
  if (phone_result.isValid) {
    return phone_result.phoneNumber;
  }
  if (email_validator.validate(pix_key)) {
    return pix_key;
  }
  if (uuidValidate(pix_key)) {
    return pix_key;
  }
  throw new Error("Invalid Pix key");
};

export const validate_pix_payment_amount = (amount_decimal: number): number => {
  if (amount_decimal < 15) {
    throw new Error("Amount must be greater than 15");
  }
  if (amount_decimal > 150) {
    throw new Error("Amount must be less than 150");
  }
  return amount_decimal * 100;
};

export const validate_pix_deposit_amount = (amount_decimal: number): number => {
  if (amount_decimal < 15) {
    throw new Error("Amount must be greater than 15");
  }
  if (amount_decimal > 1000) {
    throw new Error("Amount must be less than 150");
  }
  const adjusted_amount = amount_decimal / (1 - 0.01);
  return adjusted_amount * 100;
};
