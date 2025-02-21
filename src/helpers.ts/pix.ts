import { cpf, cnpj } from "cpf-cnpj-validator";
import { phone } from "phone";
import * as emailValidator from "email-validator";
import { validate as uuidValidate } from "uuid";

export const processPixKey = (pixKey: string): string => {
  if (cpf.isValid(pixKey)) {
    return cpf.strip(pixKey);
  }
  if (cnpj.isValid(pixKey)) {
    return cnpj.strip(pixKey);
  }
  const phoneResult = pixKey.includes("+")
    ? phone(pixKey)
    : phone(pixKey, { country: "BRA" });
  if (phoneResult.isValid) {
    return phoneResult.phoneNumber;
  }
  if (emailValidator.validate(pixKey)) {
    return pixKey;
  }
  if (uuidValidate(pixKey)) {
    return pixKey;
  }
  throw new Error("Invalid Pix key");
};

export const processPixAmount = (amountDecimal: number): number => {
  if (amountDecimal < 1) {
    throw new Error("Amount must be greater than 1");
  }
  if (amountDecimal > 150) {
    throw new Error("Amount must be less than 150");
  }
  return amountDecimal * 100;
};
