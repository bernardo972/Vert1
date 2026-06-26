import { Product, User, Sale, Invoice } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Cadeira Ergonômica Vert',
    sku: 'VERT-CHAIR-001',
    price: 1499.00,
    costPrice: 820.00,
    category: 'Móveis',
    stock: 14,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&q=80&w=600',
    description: 'Cadeira de escritório de alto padrão com suporte lombar autoajustável, acabamento em tecido mesh verde-oliva respirável e estrutura branca de design minimalista escandinavo.'
  },
  {
    id: 'prod-2',
    name: 'Teclado Mecânico Linear Eco',
    sku: 'VERT-KEYB-002',
    price: 489.00,
    costPrice: 210.00,
    category: 'Periféricos',
    stock: 22,
    minStock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600',
    description: 'Teclado mecânico compacto com switches silenciosos lineares, case fabricada em plástico ecológico reciclado e retroiluminação suave na cor verde menta.'
  },
  {
    id: 'prod-3',
    name: 'Luminária de Mesa Bamboo Glow',
    sku: 'VERT-LIGHT-003',
    price: 259.00,
    costPrice: 110.00,
    category: 'Iluminação',
    stock: 4,
    minStock: 6, // Trigger alert
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&q=80&w=600',
    description: 'Luminária inteligente regulável confeccionada em madeira de bambu sustentável, base metálica fosca e difusor de luz natural quente.'
  },
  {
    id: 'prod-4',
    name: 'Mochila Executiva Verde Tecno',
    sku: 'VERT-BAG-004',
    price: 349.00,
    costPrice: 150.00,
    category: 'Acessórios',
    stock: 18,
    minStock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
    description: 'Mochila impermeável produzida a partir de garrafas PET resgatadas dos oceanos. Compartimento acolchoado para notebook de até 16 polegadas e bolsos organizadores.'
  },
  {
    id: 'prod-5',
    name: 'Garrafa Térmica Vert Matte',
    sku: 'VERT-BOTT-005',
    price: 189.00,
    costPrice: 65.00,
    category: 'Estilo de Vida',
    stock: 40,
    minStock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600',
    description: 'Garrafa térmica premium em aço inoxidável com isolamento a vácuo de dupla camada. Conserva líquidos gelados por até 24 horas ou quentes por 12 horas.'
  },
  {
    id: 'prod-6',
    name: 'Headphone ANC PureSound Eco',
    sku: 'VERT-HEAD-006',
    price: 799.00,
    costPrice: 380.00,
    category: 'Áudio',
    stock: 12,
    minStock: 3,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    description: 'Headphone circum-auricular com cancelamento ativo de ruído inteligente, drivers de bio-celulose de alta resolução e almofadas de couro vegano ultra confortáveis.'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Bernardo Fulem',
    email: 'bernardofulem@gmail.com',
    password: 'Rua100200@',
    role: 'manager',
    isTwoFactorEnabled: false,
    cpfOrCnpj: ''
  },
  {
    id: 'usr-2',
    name: 'Lucas Santos',
    email: 'vendedor@verde.com',
    password: 'verde',
    role: 'seller',
    isTwoFactorEnabled: false,
    cpfOrCnpj: '98.765.432/0001-10'
  },
  {
    id: 'usr-3',
    name: 'Mariana Souza',
    email: 'cliente@verde.com',
    password: 'verde',
    role: 'customer',
    isTwoFactorEnabled: false,
    cpfOrCnpj: '111.222.333-44'
  }
];

// Helper to construct mock sales with varied dates in 2026 to populate reports (assuming today is Jun 4, 2026)
export const INITIAL_SALES: Sale[] = [
  {
    id: 'venda-101',
    userId: 'usr-3',
    customerName: 'Mariana Souza',
    customerEmail: 'cliente@verde.com',
    items: [
      { productId: 'prod-1', productName: 'Cadeira Ergonômica Vert', price: 1499.00, costPrice: 820.00, quantity: 1 },
      { productId: 'prod-5', productName: 'Garrafa Térmica Vert Matte', price: 189.00, costPrice: 65.00, quantity: 2 }
    ],
    total: 1877.00,
    costTotal: 950.00,
    profit: 927.00,
    paymentMethod: 'Cartão de Crédito',
    timestamp: '2026-01-15T14:30:00Z',
    invoiceId: 'NFE-000101'
  },
  {
    id: 'venda-102',
    userId: 'usr-3',
    customerName: 'Mariana Souza',
    customerEmail: 'cliente@verde.com',
    items: [
      { productId: 'prod-3', productName: 'Luminária de Mesa Bamboo Glow', price: 259.00, costPrice: 110.00, quantity: 1 }
    ],
    total: 259.00,
    costTotal: 110.00,
    profit: 149.00,
    paymentMethod: 'Pix',
    timestamp: '2026-02-05T10:15:00Z',
    invoiceId: 'NFE-000102'
  },
  {
    id: 'venda-103',
    userId: 'usr-anon-1',
    customerName: 'Roberto Carlos',
    customerEmail: 'roberto@gmail.com',
    items: [
      { productId: 'prod-4', productName: 'Mochila Executiva Verde Tecno', price: 349.00, costPrice: 150.00, quantity: 1 },
      { productId: 'prod-2', productName: 'Teclado Mecânico Linear Eco', price: 489.00, costPrice: 210.00, quantity: 1 }
    ],
    total: 838.00,
    costTotal: 360.00,
    profit: 478.00,
    paymentMethod: 'Pix',
    timestamp: '2026-02-22T18:45:00Z',
    invoiceId: 'NFE-000103'
  },
  {
    id: 'venda-104',
    userId: 'usr-anon-2',
    customerName: 'Clara Nunes',
    customerEmail: 'clara.nunes@hotmail.com',
    items: [
      { productId: 'prod-1', productName: 'Cadeira Ergonômica Vert', price: 1499.00, costPrice: 820.00, quantity: 2 }
    ],
    total: 2998.00,
    costTotal: 1640.00,
    profit: 1358.00,
    paymentMethod: 'Boleto',
    timestamp: '2026-03-10T11:00:00Z',
    invoiceId: 'NFE-000104'
  },
  {
    id: 'venda-105',
    userId: 'usr-anon-3',
    customerName: 'Fernando Henrique',
    customerEmail: 'fhc@consultoria.com.br',
    items: [
      { productId: 'prod-6', productName: 'Headphone ANC PureSound Eco', price: 799.00, costPrice: 380.00, quantity: 1 },
      { productId: 'prod-5', productName: 'Garrafa Térmica Vert Matte', price: 189.00, costPrice: 65.00, quantity: 1 }
    ],
    total: 988.00,
    costTotal: 445.00,
    profit: 543.00,
    paymentMethod: 'Cartão de Crédito',
    timestamp: '2026-03-29T16:20:00Z',
    invoiceId: 'NFE-000105'
  },
  {
    id: 'venda-106',
    userId: 'usr-3',
    customerName: 'Mariana Souza',
    customerEmail: 'cliente@verde.com',
    items: [
      { productId: 'prod-2', productName: 'Teclado Mecânico Linear Eco', price: 489.00, costPrice: 210.00, quantity: 2 },
      { productId: 'prod-3', productName: 'Luminária de Mesa Bamboo Glow', price: 259.00, costPrice: 110.00, quantity: 1 }
    ],
    total: 1237.00,
    costTotal: 530.00,
    profit: 707.00,
    paymentMethod: 'Pix',
    timestamp: '2026-04-12T09:40:00Z',
    invoiceId: 'NFE-000106'
  },
  {
    id: 'venda-107',
    userId: 'usr-anon-4',
    customerName: 'Bruno Gagliasso',
    customerEmail: 'bruno@gagliasso.tv',
    items: [
      { productId: 'prod-1', productName: 'Cadeira Ergonômica Vert', price: 1499.00, costPrice: 820.00, quantity: 1 },
      { productId: 'prod-6', productName: 'Headphone ANC PureSound Eco', price: 799.00, costPrice: 380.00, quantity: 1 }
    ],
    total: 2298.00,
    costTotal: 1200.00,
    profit: 1098.00,
    paymentMethod: 'Cartão de Crédito',
    timestamp: '2026-04-28T15:10:00Z',
    invoiceId: 'NFE-000107'
  },
  {
    id: 'venda-108',
    userId: 'usr-anon-5',
    customerName: 'Patrícia Poeta',
    customerEmail: 'patricia.poeta@globo.br',
    items: [
      { productId: 'prod-4', productName: 'Mochila Executiva Verde Tecno', price: 349.00, costPrice: 150.00, quantity: 2 },
      { productId: 'prod-5', productName: 'Garrafa Térmica Vert Matte', price: 189.00, costPrice: 65.00, quantity: 3 }
    ],
    total: 1265.00,
    costTotal: 495.00,
    profit: 770.00,
    paymentMethod: 'Pix',
    timestamp: '2026-05-18T13:00:00Z',
    invoiceId: 'NFE-000108'
  },
  {
    id: 'venda-109',
    userId: 'usr-anon-6',
    customerName: 'Carlos Drummond',
    customerEmail: 'drummond@poesia.org',
    items: [
      { productId: 'prod-2', productName: 'Teclado Mecânico Linear Eco', price: 489.00, costPrice: 210.00, quantity: 1 },
      { productId: 'prod-3', productName: 'Luminária de Mesa Bamboo Glow', price: 259.00, costPrice: 110.00, quantity: 2 }
    ],
    total: 1007.00,
    costTotal: 430.00,
    profit: 577.00,
    paymentMethod: 'Boleto',
    timestamp: '2026-05-30T17:55:00Z',
    invoiceId: 'NFE-000109'
  },
  {
    id: 'venda-110',
    userId: 'usr-3',
    customerName: 'Mariana Souza',
    customerEmail: 'cliente@verde.com',
    items: [
      { productId: 'prod-1', productName: 'Cadeira Ergonômica Vert', price: 1499.00, costPrice: 820.00, quantity: 1 }
    ],
    total: 1499.00,
    costTotal: 820.00,
    profit: 679.00,
    paymentMethod: 'Cartão de Crédito',
    timestamp: '2026-06-02T11:22:00Z',
    invoiceId: 'NFE-000110'
  },
  {
    id: 'venda-111',
    userId: 'usr-anon-7',
    customerName: 'Gabriela Prioli',
    customerEmail: 'gabriela@prioli.com',
    items: [
      { productId: 'prod-4', productName: 'Mochila Executiva Verde Tecno', price: 349.00, costPrice: 150.00, quantity: 1 },
      { productId: 'prod-5', productName: 'Garrafa Térmica Vert Matte', price: 189.00, costPrice: 65.00, quantity: 2 }
    ],
    total: 727.00,
    costTotal: 280.00,
    profit: 447.00,
    paymentMethod: 'Pix',
    timestamp: '2026-06-03T20:10:00Z',
    invoiceId: 'NFE-000111'
  }
];

// Generates some initial invoices for the above transactions
export const INITIAL_INVOICES: Invoice[] = INITIAL_SALES.map((sale, index) => {
  // ICMS (18%), IPI (5%), PIS (1.65%), COFINS (7.6%)
  const subtotal = sale.total;
  const icms = +(subtotal * 0.18).toFixed(2);
  const ipi = +(subtotal * 0.05).toFixed(2);
  const pis = +(subtotal * 0.0165).toFixed(2);
  const cofins = +(subtotal * 0.076).toFixed(2);
  const totalTaxes = +(icms + ipi + pis + cofins).toFixed(2);

  const parsedIndex = (index + 101).toString().padStart(6, '0');
  
  return {
    id: `NFE-${parsedIndex}`,
    saleId: sale.id,
    accessKey: `3526061111222333445555${parsedIndex}1000001019283746561`, // Mock 44-digit NF-e Key
    emitterName: 'VERT TECH COMÉRCIO LTDA',
    emitterCNPJ: '11.111.222/0001-33',
    receiverName: sale.customerName,
    receiverCPF_CNPJ: sale.userId === 'usr-3' ? '111.222.333-44' : '000.000.000-00',
    items: sale.items.map(it => ({
      name: it.productName,
      sku: 'VERT-MOCK',
      price: it.price,
      quantity: it.quantity,
      total: it.price * it.quantity
    })),
    subtotal: subtotal,
    taxes: {
      icms,
      ipi,
      pis,
      cofins,
      totalTaxes
    },
    total: subtotal,
    timestamp: sale.timestamp,
    status: 'Emitida',
    xmlMock: `<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">\n  <NFe>\n    <infNFe Id="NFe3526061111222333445555${parsedIndex}">\n      <ide>\n        <cUF>35</cUF>\n        <cNF>00028192</cNF>\n        <natOp>Venda de Mercadorias</natOp>\n        <mod>55</mod>\n        <serie>1</serie>\n        <nNF>${parsedIndex}</nNF>\n        <dhEmi>${sale.timestamp}</dhEmi>\n      </ide>\n      <emit>\n        <CNPJ>11111222000133</CNPJ>\n        <xNome>VERT TECH COMÉRCIO LTDA</xNome>\n      </emit>\n      <dest>\n        <xNome>${sale.customerName}</xNome>\n      </dest>\n    </infNFe>\n  </NFe>\n</nfeProc>`
  };
});
