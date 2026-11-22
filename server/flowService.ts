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

export interface FlowPlanParams {
  planId: string;
  name: string;
  currency: string;
  amount: number;
  interval: 1 | 2 | 3 | 4;
  periods_number: number;
  urlCallback?: string;
}

export interface FlowPlanResponse {
  planId: string;
  name: string;
  currency: string;
  amount: number;
  interval: number;
  periods_number?: number;
  status: number;
}

export interface FlowCustomerParams {
  name: string;
  email: string;
  externalId: string;
}

export interface FlowCustomerResponse {
  customerId: string;
  created: string;
  email: string;
  name: string;
  externalId: string;
  status: string;
}

export interface FlowCardRegisterParams {
  customerId: string;
  url_return: string;
}

export interface FlowCardRegisterResponse {
  url: string;
  token: string;
}

export interface FlowCardRegisterStatus {
  status: number; // 1 = tarjeta registrada, 0 = pendiente/fallida
  customerId: string;
  creditCardType?: string;
  last4CardDigits?: string;
}

export interface FlowSubscriptionParams {
  planId: string;
  customerId: string;
  periods_number?: number;
  subscription_start?: string;
}

export interface FlowSubscriptionResponse {
  subscriptionId: string;
  planId: string;
  customerId: string;
  status: number; // 1 = activa, 2 = vencida/mora, 3 = suspendida, 4 = cancelada
  periods_number?: number;
}

export interface FlowInvoiceResponse {
  id: number | string;
  subscriptionId: string;
  amount: number;
  status: number; // 1 = pagada, 0 = pendiente, 2 = anulada/fallida
  paidDate?: string;
}

export interface FlowServiceConfig {
  apiKey?: string;
  secretKey?: string;
  apiUrl?: string;
}

export class FlowService {
  private apiKey: string;
  private secretKey: string;
  private apiUrl: string;

  constructor(config?: FlowServiceConfig) {
    this.apiKey = config?.apiKey ?? process.env.FLOW_API_KEY ?? '';
    this.secretKey = config?.secretKey ?? process.env.FLOW_SECRET_KEY ?? '';
    const rawUrl = config?.apiUrl ?? process.env.FLOW_API_URL ?? 'https://sandbox.flow.cl/api';
    this.apiUrl = rawUrl.replace(/\/+$/, '');

    if (!this.apiKey || !this.secretKey) {
      console.warn('⚠️  Flow.cl credentials not configured. Payment processing will not work.');
    }
  }

  getWebBaseUrl(): string {
    return this.apiUrl.includes('www.flow.cl') ? 'https://www.flow.cl' : 'https://sandbox.flow.cl';
  }

  private assertConfigured(): void {
    if (!this.apiKey || !this.secretKey) {
      throw new Error('Flow.cl credentials not configured');
    }
  }

  /**
   * Genera la firma para autenticar las peticiones a Flow
   */
  private generateSignature(params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .filter((key) => key !== 's')
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          acc[key] = params[key];
        }
        return acc;
      }, {} as Record<string, any>);

    const paramsString = Object.entries(sortedParams)
      .map(([key, value]) => `${key}${value}`)
      .join('');

    return crypto
      .createHmac('sha256', this.secretKey)
      .update(paramsString)
      .digest('hex');
  }

  private async postForm<T>(endpoint: string, params: Record<string, any>, errMessage: string): Promise<T> {
    this.assertConfigured();
    const signedInput = { apiKey: this.apiKey, ...params };
    const signature = this.generateSignature(signedInput);
    const requestParams = { ...signedInput, s: signature };

    try {
      const formData = new URLSearchParams();
      Object.entries(requestParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(key, String(value));
        }
      });

      const response = await axios.post<T>(`${this.apiUrl}${endpoint}`, formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error Flow ${endpoint}:`, error.response?.data?.message || error.message);
      throw new Error(error.response?.data?.message || errMessage);
    }
  }

  private async getSigned<T>(endpoint: string, params: Record<string, any>, errMessage: string): Promise<T> {
    this.assertConfigured();
    const signedInput = { apiKey: this.apiKey, ...params };
    const signature = this.generateSignature(signedInput);
    const requestParams = { ...signedInput, s: signature };

    try {
      const response = await axios.get<T>(`${this.apiUrl}${endpoint}`, {
        params: requestParams,
        timeout: 30000,
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error Flow ${endpoint}:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || errMessage);
    }
  }

  /**
   * Crea un pago en Flow.cl
   */
  async createPayment(params: FlowPaymentParams): Promise<FlowPaymentResponse> {
    this.assertConfigured();

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
    const requestParams = { ...paymentParams, s: signature };

    if (process.env.NODE_ENV !== 'production') {
      console.log('=== Flow.cl Payment Request ===');
      console.log('URL:', `${this.apiUrl}/payment/create`);
      console.log('Amount:', params.amount);
      console.log('Email:', params.email);
      console.log('================================');
    }

    try {
      const formData = new URLSearchParams();
      Object.entries(requestParams).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const response = await axios.post(
        `${this.apiUrl}/payment/create`,
        formData.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 30000,
        },
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
    return this.getSigned<FlowPaymentStatus>('/payment/getStatus', { token }, 'Error al obtener el estado del pago');
  }

  async createPlan(params: FlowPlanParams): Promise<FlowPlanResponse> {
    return this.postForm<FlowPlanResponse>('/plans/create', params, 'Error al crear el plan en Flow');
  }

  async getPlan(planId: string): Promise<FlowPlanResponse> {
    return this.getSigned<FlowPlanResponse>('/plans/get', { planId }, 'Error al obtener el plan en Flow');
  }

  async createCustomer(params: FlowCustomerParams): Promise<FlowCustomerResponse> {
    return this.postForm<FlowCustomerResponse>('/customer/create', params, 'Error al crear el cliente en Flow');
  }

  async registerCustomerCard(params: FlowCardRegisterParams): Promise<FlowCardRegisterResponse> {
    return this.postForm<FlowCardRegisterResponse>('/customer/register', params, 'Error al registrar tarjeta en Flow');
  }

  async getCustomerRegisterStatus(token: string): Promise<FlowCardRegisterStatus> {
    return this.getSigned<FlowCardRegisterStatus>(
      '/customer/getRegisterStatus',
      { token },
      'Error al obtener estado de registro de tarjeta en Flow',
    );
  }

  async createSubscription(params: FlowSubscriptionParams): Promise<FlowSubscriptionResponse> {
    return this.postForm<FlowSubscriptionResponse>('/subscription/create', params, 'Error al crear la suscripción en Flow');
  }

  async getSubscription(subscriptionId: string): Promise<FlowSubscriptionResponse> {
    return this.getSigned<FlowSubscriptionResponse>(
      '/subscription/get',
      { subscriptionId },
      'Error al consultar la suscripción en Flow',
    );
  }

  async cancelSubscription(subscriptionId: string, at_period_end: 0 | 1 = 1): Promise<FlowSubscriptionResponse> {
    return this.postForm<FlowSubscriptionResponse>(
      '/subscription/cancel',
      { subscriptionId, at_period_end },
      'Error al cancelar la suscripción en Flow',
    );
  }

  async getInvoice(invoiceId: string): Promise<FlowInvoiceResponse> {
    return this.getSigned<FlowInvoiceResponse>('/invoice/get', { invoiceId }, 'Error al consultar la factura en Flow');
  }

  /**
   * Convierte un monto en formato chileno (ej: "$480.000") a número
   */
  parseChileanAmount(amount: string): number {
    return parseInt(amount.replace(/[$.\s]/g, ''), 10);
  }

  /**
   * Valida la firma de una respuesta de Flow en tiempo constante
   */
  validateSignature(params: Record<string, any>, signature: string): boolean {
    if (!signature) return false;
    const calculatedSignature = this.generateSignature(params);
    const a = Buffer.from(calculatedSignature, 'utf8');
    const b = Buffer.from(String(signature), 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  }
}

export function createFlowService(config?: FlowServiceConfig): FlowService {
  return new FlowService(config);
}

/**
 * Crea un FlowService a partir de la configuración de la factoría de suscripciones (F1).
 * Las rutas de suscripción deben usar esta función en lugar del singleton flowService.
 */
export function crearFlowServiceDesdePasarela(pasarela: { apiUrl: string; apiKey: string; secretKey: string }): FlowService {
  return new FlowService({
    apiKey: pasarela.apiKey,
    secretKey: pasarela.secretKey,
    apiUrl: pasarela.apiUrl,
  });
}

export const flowService = new FlowService();
export type { FlowPaymentParams, FlowPaymentResponse, FlowPaymentStatus };
