import crypto from "crypto";

interface EsewaFormFields {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export function buildEsewaSignature(
  totalAmount: string,
  transactionUuid: string,
  productCode: string
): string {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac("sha256", process.env.ESEWA_SECRET_KEY as string)
    .update(message)
    .digest("base64");
}

export function buildEsewaFormFields(opts: {
  amountNpr: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}): EsewaFormFields {
  const amount = opts.amountNpr.toString();
  const productCode = process.env.ESEWA_PRODUCT_CODE as string;

  const signature = buildEsewaSignature(
    amount,
    opts.transactionUuid,
    productCode
  );

  return {
    amount,
    tax_amount: "0",
    total_amount: amount,
    transaction_uuid: opts.transactionUuid,
    product_code: productCode,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: opts.successUrl,
    failure_url: opts.failureUrl,
    signed_field_names: "total_amount,transaction_uuid,product_code",
    signature,
  };
}

export function verifyEsewaCallback(decoded: {
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  signature: string;
}): boolean {
  const expected = buildEsewaSignature(
    decoded.total_amount,
    decoded.transaction_uuid,
    decoded.product_code
  );
  return expected === decoded.signature;
}

export async function checkEsewaStatus(
  productCode: string,
  totalAmount: string,
  transactionUuid: string
): Promise<{ status: string }> {
  const url = `${process.env.ESEWA_STATUS_URL}?product_code=${productCode}&total_amount=${totalAmount}&transaction_uuid=${transactionUuid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("eSewa status check failed.");
  return (await res.json()) as { status: string };
}