import crypto from "crypto";

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  isProduction: boolean;
}

export interface SnapTransactionPayload {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  customer_details?: {
    first_name: string;
    email: string;
  };
  callbacks?: {
    finish?: string;
  };
}

export interface SnapResponse {
  token: string;
  redirect_url: string;
}

export class MidtransClient {
  private serverKey: string;
  private isProduction: boolean;

  constructor(config?: Partial<MidtransConfig>) {
    this.serverKey = config?.serverKey || process.env.MIDTRANS_SERVER_KEY || "";
    this.isProduction =
      config?.isProduction ?? (process.env.MIDTRANS_IS_PRODUCTION === "true");
  }

  get snapBaseUrl(): string {
    return this.isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";
  }

  get coreApiBaseUrl(): string {
    return this.isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";
  }

  private get authHeader(): string {
    if (!this.serverKey) {
      throw new Error("MIDTRANS_SERVER_KEY is missing. Check your environment configuration.");
    }
    const token = Buffer.from(`${this.serverKey}:`).toString("base64");
    return `Basic ${token}`;
  }

  async createSnapTransaction(payload: SnapTransactionPayload): Promise<SnapResponse> {
    const res = await fetch(this.snapBaseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: this.authHeader,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Midtrans Snap error (${res.status}): ${errorBody}`);
    }

    return (await res.json()) as SnapResponse;
  }

  async getTransactionStatus(orderId: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${this.coreApiBaseUrl}/${encodeURIComponent(orderId)}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: this.authHeader,
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Midtrans status check error (${res.status}): ${errorBody}`);
    }

    return (await res.json()) as Record<string, unknown>;
  }

  verifySignature(
    orderId: string,
    statusCode: string,
    grossAmount: string | number,
    signatureKey: string
  ): boolean {
    const amountStr = typeof grossAmount === "number" ? grossAmount.toFixed(2) : grossAmount;
    // Midtrans signature: SHA512(order_id + status_code + gross_amount + ServerKey)
    const raw = `${orderId}${statusCode}${amountStr}${this.serverKey}`;
    const calculatedHash = crypto.createHash("sha512").update(raw).digest("hex");
    return calculatedHash.toLowerCase() === signatureKey.toLowerCase();
  }
}

export const midtrans = new MidtransClient();
