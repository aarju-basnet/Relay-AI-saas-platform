interface KhaltiInitiateResponse {
  pidx: string;
  payment_url: string;
}

interface KhaltiLookupResponse {
  pidx: string;
  status: "Completed" | "Pending" | "Expired" | "User canceled" | "Refunded";
  total_amount: number;
  transaction_id: string | null;
}

export async function initiateKhaltiPayment(opts: {
  amountNpr: number;
  purchaseOrderId: string;
  purchaseOrderName: string;
  returnUrl: string;
  websiteUrl: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<KhaltiInitiateResponse> {
  const res = await fetch(`${process.env.KHALTI_API_URL}/initiate/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url: opts.returnUrl,
      website_url: opts.websiteUrl,
      amount: opts.amountNpr * 100, // Khalti expects paisa
      purchase_order_id: opts.purchaseOrderId,
      purchase_order_name: opts.purchaseOrderName,
      customer_info: {
        name: opts.customerName ?? "Relay Customer",
        email: opts.customerEmail ?? "customer@example.com",
      },
    }),
  });

    if (!res.ok) {
    const body = await res.text();
    throw new Error(`Khalti initiate failed: ${body}`);
  }

  return (await res.json()) as KhaltiInitiateResponse;
}


export async function lookupKhaltiPayment(
  pidx: string
): Promise<KhaltiLookupResponse> {
  const res = await fetch(`${process.env.KHALTI_API_URL}/lookup/`, {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pidx }),
  });

    if (!res.ok) {
    const body = await res.text();
    throw new Error(`Khalti lookup failed: ${body}`);
  }

  return (await res.json()) as KhaltiLookupResponse;
}