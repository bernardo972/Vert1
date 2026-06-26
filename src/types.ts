export type UserRole = 'customer' | 'seller' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  twoFactorSecret?: string;
  isTwoFactorEnabled: boolean;
  cpfOrCnpj?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  costPrice: number; // For Profit & Performance reporting
  category: string;
  stock: number;
  minStock: number;
  imageUrl: string;
  description: string;
  externalUrl?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: {
    productId: string;
    productName: string;
    price: number;
    costPrice: number;
    quantity: number;
  }[];
  total: number;
  costTotal: number;
  profit: number;
  paymentMethod: 'Pix' | 'Cartão de Crédito' | 'Boleto';
  timestamp: string; // ISO String
  invoiceId?: string;
}

export interface TaxBreakdown {
  icms: number; // 18% approx
  ipi: number; // 5% approx
  pis: number; // 1.65% approx
  cofins: number; // 7.6% approx
  totalTaxes: number;
}

export interface Invoice {
  id: string; // NF-e number
  saleId: string;
  accessKey: string; // 44 digit key
  emitterName: string;
  emitterCNPJ: string;
  receiverName: string;
  receiverCPF_CNPJ: string;
  items: {
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
  }[];
  subtotal: number;
  taxes: TaxBreakdown;
  total: number;
  timestamp: string;
  status: 'Emitida' | 'Cancelada';
  xmlMock?: string;
}
