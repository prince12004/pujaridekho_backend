import crypto from "node:crypto";
import { env } from "../config/env.js";

export const PAYU_BASE_URL = env.PAYU_MODE === "live" ? "https://secure.payu.in/_payment" : "https://test.payu.in/_payment";

function sha512(input: string): string {
  return crypto.createHash("sha512").update(input).digest("hex");
}

export interface PayURequestParams {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
}

/** PayU's documented request-hash formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt */
export function generatePayURequestHash(params: PayURequestParams): string {
  const { txnid, amount, productinfo, firstname, email, udf1 = "", udf2 = "" } = params;
  const hashString = [
    env.PAYU_MERCHANT_KEY,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    env.PAYU_MERCHANT_SALT,
  ].join("|");
  return sha512(hashString);
}

export interface PayUResponseFields {
  status: string;
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  hash: string;
}

/** PayU's documented reverse-hash formula for verifying a callback: salt|status|||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key */
export function verifyPayUResponseHash(fields: PayUResponseFields): boolean {
  const { status, txnid, amount, productinfo, firstname, email, udf1 = "", udf2 = "", hash } = fields;
  const reverseHashString = [
    env.PAYU_MERCHANT_SALT,
    status,
    "",
    "",
    "",
    "",
    "",
    udf2,
    udf1,
    email,
    firstname,
    productinfo,
    amount,
    txnid,
    env.PAYU_MERCHANT_KEY,
  ].join("|");
  return sha512(reverseHashString) === hash;
}

export function generateTxnId(): string {
  return `PD${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
