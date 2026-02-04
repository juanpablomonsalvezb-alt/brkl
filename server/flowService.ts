import crypto from 'crypto';
import axios from 'axios';

interface FlowPaymentParams {
  commerceOrder: string;
  subject: string;
  currency: string;
  amount: number;
  email: string;
  urlConfirmation: string;
  urlReturn: string;
  optional?: Record<string, any>;
}

interface FlowPaymentResponse {
  url: string;
  token: string;
  flowOrder: number;
}

interface FlowPaymentStatus {
  flowOrder: number;
  commerceOrder: string;
  requestDate: string;
  status: number;
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  optional?: Record<string, any>;
  pending_info?: {
    media: string;
    date: string;
  };
  paymentData?: {
    date: string;
    media: string;
    conversionDate: string;
    conversionRate: number;
    amount: number;
    currency: string;
    fee: number;
    balance: number;
    transferDate: string;
  };
  merchantId?: string;
}

class FlowService {
  private apiKey: string;
  private secretKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.FLOW_API_KEY || '';
    this.secretKey = process.env.FLOW_SECRET_KEY || '';
    this.apiUrl = process.env.FLOW_API_URL || 'https://sandbox.flow.cl/api';

    if (!this.apiKey || !this.secretKey) {
      console.warn('⚠️  Flow.cl credentials not configured. Payment processing will not work.');
    }
  }

  /**
   * Genera la firma para autenticar las peticiones a Flow
   */
  private generateSignature(params: Record<string, any>): string {
    // Ordenar parámetros alfabéticamente
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          acc[key] = params[key];
        }
        return acc;
      }, {} as Record<string, any>);

    // Crear string de parámetros
    const paramsString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}${value}`)
      .join('');

    // Generar HMAC SHA256
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(paramsString)
      .digest('hex');

    return signature;
  }

  /**
   * Crea un pago en Flow.cl
   */
  async createPayment(params: FlowPaymentParams): Promise<FlowPaymentResponse> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Flow.cl credentials not configured');
    }

    const paymentParams = {
      apiKey: this.apiKey,
      commerceOrder: params.commerceOrder,
      subject: params.subject,
      currency: params.currency,
      amount: params.amount,
      email: params.email,
      urlConfirmation: params.urlConfirmation,
      urlReturn: params.urlReturn,
      ...(params.optional && { optional: JSON.stringify(params.optional) }),
    };

    const signature = this.generateSignature(paymentParams);
    const requestParams = {
      ...paymentParams,
      s: signature,
    };

    // Log solo en desarrollo (no exponer credenciales en producción)
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== Flow.cl Payment Request ===');
      console.log('URL:', `${this.apiUrl}/payment/create`);
      console.log('Amount:', params.amount);
      console.log('Email:', params.email);
      console.log('================================');
    }

    try {
      // Flow.cl requiere form-urlencoded en el body
      const formData = new URLSearchParams();
      Object.entries(requestParams).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      
      const response = await axios.post(
        `${this.apiUrl}/payment/create`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log('Flow.cl response success');
      }
      return response.data;
    } catch (error: any) {
      console.error('Error creating Flow payment:', error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || 'Error al crear el pago en Flow');
    }
  }

  /**
   * Obtiene el estado de un pago
   */
  async getPaymentStatus(token: string): Promise<FlowPaymentStatus> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Flow.cl credentials not configured');
    }

    const params = {
      apiKey: this.apiKey,
      token: token,
    };

    const signature = this.generateSignature(params);
    const requestParams = {
      ...params,
      s: signature,
    };

    try {
      const response = await axios.get(
        `${this.apiUrl}/payment/getStatus`,
        {
          params: requestParams,
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error getting Flow payment status:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Error al obtener el estado del pago');
    }
  }

  /**
   * Convierte un monto en formato chileno (ej: "$480.000") a número
   */
  parseChileanAmount(amount: string): number {
    // Remover símbolo $ y puntos, convertir a número
    return parseInt(amount.replace(/[$.\s]/g, ''), 10);
  }

  /**
   * Valida la firma de una respuesta de Flow
   */
  validateSignature(params: Record<string, any>, signature: string): boolean {
    const calculatedSignature = this.generateSignature(params);
    return calculatedSignature === signature;
  }
}

export const flowService = new FlowService();
export type { FlowPaymentParams, FlowPaymentResponse, FlowPaymentStatus };
