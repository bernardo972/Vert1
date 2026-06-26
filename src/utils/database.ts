import { Product, User, Sale, Invoice, TaxBreakdown } from '../types';
import { INITIAL_PRODUCTS, INITIAL_USERS, INITIAL_SALES, INITIAL_INVOICES } from '../data/initialData';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc } from 'firebase/firestore';

// Keys for LocalStorage
const PRODUCTS_KEY = 'verde_products';
const USERS_KEY = 'verde_users';
const SALES_KEY = 'verde_sales';
const INVOICES_KEY = 'verde_invoices';
const LOGGED_USER_KEY = 'verde_logged_in_user';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Subscription Pattern to push real-time updates to React Views
type DbCallback = () => void;
const subscribers: Set<DbCallback> = new Set();

export const subscribeToDatabase = (callback: DbCallback) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

export const notifyDatabaseUpdate = () => {
  subscribers.forEach((cb) => cb());
};

let isInitializing = false;

export const dbInit = async () => {
  if (isInitializing) return;
  isInitializing = true;

  // Initialize offline LocalStorage keys to avoid empty renders while connecting to Firestore
  if (!localStorage.getItem(PRODUCTS_KEY)) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  }
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem(SALES_KEY)) {
    localStorage.setItem(SALES_KEY, JSON.stringify(INITIAL_SALES));
  }
  if (!localStorage.getItem(INVOICES_KEY)) {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(INITIAL_INVOICES));
  }

  // Set up Firebase onSnapshot real-time syncing
  try {
    const productsRef = collection(db, 'products');
    const usersRef = collection(db, 'users');
    const salesRef = collection(db, 'sales');
    const invoicesRef = collection(db, 'invoices');

    // 1. Check if database context has elements, seed initial database if empty
    const prodSnapshot = await getDocs(productsRef).catch(err => {
      console.warn("Firestore products read failed (waiting for secure deployment?):", err);
      return null;
    });

    if (prodSnapshot && prodSnapshot.empty) {
      console.log("Firestore empty. Seeding initial catalog records...");
      for (const p of INITIAL_PRODUCTS) {
        await setDoc(doc(db, 'products', p.id), p).catch(err => {
          console.warn(`Failed to seed product ${p.id}:`, err);
        });
      }
      for (const u of INITIAL_USERS) {
        await setDoc(doc(db, 'users', u.id), u).catch(err => {
          console.warn(`Failed to seed user ${u.id}:`, err);
        });
      }
      for (const s of INITIAL_SALES) {
        await setDoc(doc(db, 'sales', s.id), s).catch(err => {
          console.warn(`Failed to seed sale ${s.id}:`, err);
        });
      }
      for (const i of INITIAL_INVOICES) {
        await setDoc(doc(db, 'invoices', i.id), i).catch(err => {
          console.warn(`Failed to seed invoice ${i.id}:`, err);
        });
      }
      console.log("Firestore successfully seeded with default ERP catalogue.");
    }

    // 2. Setup real-time listeners
    onSnapshot(productsRef, (snap) => {
      const prods: Product[] = [];
      snap.forEach(d => prods.push(d.data() as Product));
      if (prods.length > 0) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));
        notifyDatabaseUpdate();
      }
    }, err => console.warn("Realtime products listen failed:", err));

    onSnapshot(usersRef, (snap) => {
      const usrs: User[] = [];
      snap.forEach(d => usrs.push(d.data() as User));
      if (usrs.length > 0) {
        localStorage.setItem(USERS_KEY, JSON.stringify(usrs));
        notifyDatabaseUpdate();
      }
    }, err => console.warn("Realtime users listen failed:", err));

    onSnapshot(salesRef, (snap) => {
      const sls: Sale[] = [];
      snap.forEach(d => sls.push(d.data() as Sale));
      if (sls.length > 0) {
        localStorage.setItem(SALES_KEY, JSON.stringify(sls));
        notifyDatabaseUpdate();
      }
    }, err => console.warn("Realtime sales listen failed:", err));

    onSnapshot(invoicesRef, (snap) => {
      const invs: Invoice[] = [];
      snap.forEach(d => invs.push(d.data() as Invoice));
      if (invs.length > 0) {
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invs));
        notifyDatabaseUpdate();
      }
    }, err => console.warn("Realtime invoices listen failed:", err));

  } catch (error) {
    console.error("Firebase database sync initialization failed:", error);
  }
};

// --- Products / Inventory ---
export const getProducts = (): Product[] => {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    return data ? JSON.parse(data) : INITIAL_PRODUCTS;
  } catch (error) {
    console.error("Failed to parse products from localStorage:", error);
    return INITIAL_PRODUCTS;
  }
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const addProduct = (product: Omit<Product, 'id'>): Product => {
  const newId = `prod-${Date.now()}`;
  const newProduct: Product = {
    ...product,
    id: newId
  };
  const products = getProducts();
  products.push(newProduct);
  saveProducts(products);

  // Firestore Write (Fire & Forget)
  setDoc(doc(db, 'products', newId), newProduct)
    .catch(e => handleFirestoreError(e, OperationType.CREATE, `products/${newId}`));

  notifyDatabaseUpdate();
  return newProduct;
};

export const updateProduct = (updated: Product) => {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === updated.id);
  if (index !== -1) {
    products[index] = updated;
    saveProducts(products);

    // Firestore Write (Fire & Forget)
    setDoc(doc(db, 'products', updated.id), updated)
      .catch(e => handleFirestoreError(e, OperationType.UPDATE, `products/${updated.id}`));

    notifyDatabaseUpdate();
  }
};

export const deleteProduct = (id: string) => {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== id);
  saveProducts(filtered);

  // Firestore Delete (Fire & Forget)
  deleteDoc(doc(db, 'products', id))
    .catch(e => handleFirestoreError(e, OperationType.DELETE, `products/${id}`));

  notifyDatabaseUpdate();
};

// --- Users & Authentication ---
export const getUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : INITIAL_USERS;
  } catch (error) {
    console.error("Failed to parse users from localStorage:", error);
    return INITIAL_USERS;
  }
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const registerUser = (user: Omit<User, 'id' | 'isTwoFactorEnabled'>): User => {
  const users = getUsers();
  
  if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
    throw new Error('Este e-mail já está cadastrado.');
  }

  const newId = `usr-${Date.now()}`;
  const newUser: User = {
    ...user,
    id: newId,
    isTwoFactorEnabled: false
  };
  
  users.push(newUser);
  saveUsers(users);

  // Firestore Write (Fire & Forget)
  setDoc(doc(db, 'users', newId), newUser)
    .catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${newId}`));

  notifyDatabaseUpdate();
  return newUser;
};

export const getLoggedInUser = (): User | null => {
  try {
    const saved = localStorage.getItem(LOGGED_USER_KEY);
    if (!saved || saved === 'undefined' || saved === 'null') return null;
    return JSON.parse(saved);
  } catch (error) {
    console.error("Failed to parse logged user from localStorage:", error);
    return null;
  }
};

export const setLoggedInUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(LOGGED_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOGGED_USER_KEY);
  }
};

export const updateUserProfile = (updatedUser: User) => {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === updatedUser.id);
  if (idx !== -1) {
    users[idx] = updatedUser;
    saveUsers(users);
    
    const current = getLoggedInUser();
    if (current && current.id === updatedUser.id) {
      setLoggedInUser(updatedUser);
    }

    // Firestore Write (Fire & Forget)
    setDoc(doc(db, 'users', updatedUser.id), updatedUser)
      .catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${updatedUser.id}`));

    notifyDatabaseUpdate();
  }
};

// --- Invoices & Sales ---
export const getSales = (): Sale[] => {
  try {
    const data = localStorage.getItem(SALES_KEY);
    return data ? JSON.parse(data) : INITIAL_SALES;
  } catch (error) {
    console.error("Failed to parse sales from localStorage:", error);
    return INITIAL_SALES;
  }
};

export const getInvoices = (): Invoice[] => {
  try {
    const data = localStorage.getItem(INVOICES_KEY);
    return data ? JSON.parse(data) : INITIAL_INVOICES;
  } catch (error) {
    console.error("Failed to parse invoices from localStorage:", error);
    return INITIAL_INVOICES;
  }
};

export const saveSales = (sales: Sale[]) => {
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
};

export const saveInvoices = (invoices: Invoice[]) => {
  localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
};

export const performCheckout = (
  userId: string,
  customerName: string,
  customerEmail: string,
  customerCpf: string,
  items: { product: Product; quantity: number }[],
  paymentMethod: 'Pix' | 'Cartão de Crédito' | 'Boleto'
): { sale: Sale; invoice: Invoice } => {
  const products = getProducts();
  const sales = getSales();
  const invoices = getInvoices();
  
  const saleItems: Sale['items'] = [];
  let total = 0;
  let costTotal = 0;

  items.forEach((item) => {
    const product = products.find(p => p.id === item.product.id);
    if (!product) {
      throw new Error(`Produto ${item.product.name} não encontrado.`);
    }
    if (product.stock < item.quantity) {
      throw new Error(`Produto ${product.name} possui estoque insuficiente (Apenas ${product.stock} restantes).`);
    }
    
    product.stock -= item.quantity;
    
    saleItems.push({
      productId: product.id,
      productName: product.name,
      price: product.price,
      costPrice: product.costPrice,
      quantity: item.quantity
    });

    total += product.price * item.quantity;
    costTotal += product.costPrice * item.quantity;

    // Async stock update to Firestore
    setDoc(doc(db, 'products', product.id), product)
      .catch(e => handleFirestoreError(e, OperationType.UPDATE, `products/${product.id}`));
  });

  saveProducts(products);

  const saleId = `venda-${Date.now().toString().slice(-4)}`;
  const invoiceNum = (invoices.length + 101).toString().padStart(6, '0');
  const invoiceId = `NFE-${invoiceNum}`;

  const profit = +(total - costTotal).toFixed(2);
  const nowStr = new Date().toISOString();

  const newSale: Sale = {
    id: saleId,
    userId,
    customerName,
    customerEmail,
    items: saleItems,
    total: +total.toFixed(2),
    costTotal: +costTotal.toFixed(2),
    profit,
    paymentMethod,
    timestamp: nowStr,
    invoiceId
  };

  sales.push(newSale);
  saveSales(sales);

  // Async Sale Write
  setDoc(doc(db, 'sales', saleId), newSale)
    .catch(e => handleFirestoreError(e, OperationType.CREATE, `sales/${saleId}`));

  const icms = +(total * 0.18).toFixed(2);
  const ipi = +(total * 0.05).toFixed(2);
  const pis = +(total * 0.0165).toFixed(2);
  const cofins = +(total * 0.076).toFixed(2);
  const totalTaxes = +(icms + ipi + pis + cofins).toFixed(2);

  const taxes: TaxBreakdown = {
    icms,
    ipi,
    pis,
    cofins,
    totalTaxes
  };

  let accessKey = '352606';
  for (let i = 0; i < 38; i++) {
    accessKey += Math.floor(Math.random() * 10).toString();
  }

  const invoiceItems = items.map((it) => ({
    name: it.product.name,
    sku: it.product.sku,
    price: it.product.price,
    quantity: it.quantity,
    total: +(it.product.price * it.quantity).toFixed(2)
  }));

  const newInvoice: Invoice = {
    id: invoiceId,
    saleId,
    accessKey,
    emitterName: 'VERT TECH COMÉRCIO LTDA',
    emitterCNPJ: '11.111.222/0001-33',
    receiverName: customerName,
    receiverCPF_CNPJ: customerCpf || '000.000.000-00',
    items: invoiceItems,
    subtotal: +total.toFixed(2),
    taxes,
    total: +total.toFixed(2),
    timestamp: nowStr,
    status: 'Emitida',
    xmlMock: `<?xml version="1.0" encoding="UTF-8"?>\n<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">\n  <NFe>\n    <infNFe Id="NFe${accessKey}">\n      <ide>\n        <cUF>35</cUF>\n        <cNF>${Math.floor(Math.random() * 90000000 + 10000000)}</cNF>\n        <natOp>Venda de Mercadorias e Servicos</natOp>\n        <mod>55</mod>\n        <serie>1</serie>\n        <nNF>${invoiceNum}</nNF>\n        <dhEmi>${nowStr}</dhEmi>\n      </ide>\n      <emit>\n        <CNPJ>11111222000133</CNPJ>\n        <xNome>VERT TECH COMÉRCIO LTDA</xNome>\n      </emit>\n      <dest>\n        <xNome>${customerName}</xNome>\n        <CPF>${customerCpf || '000.000.000-00'}</CPF>\n      </dest>\n    </infNFe>\n  </NFe>\n</nfeProc>`
  };

  invoices.push(newInvoice);
  saveInvoices(invoices);

  // Async Invoice Write
  setDoc(doc(db, 'invoices', invoiceId), newInvoice)
    .catch(e => handleFirestoreError(e, OperationType.CREATE, `invoices/${invoiceId}`));

  notifyDatabaseUpdate();
  return { sale: newSale, invoice: newInvoice };
};

// Cancel Invoice
export const cancelInvoice = (invoiceId: string) => {
  const invoices = getInvoices();
  const idx = invoices.findIndex((i) => i.id === invoiceId);
  if (idx !== -1) {
    invoices[idx].status = 'Cancelada';
    saveInvoices(invoices);

    const updated = invoices[idx];
    setDoc(doc(db, 'invoices', invoiceId), updated)
      .catch(e => handleFirestoreError(e, OperationType.UPDATE, `invoices/${invoiceId}`));

    notifyDatabaseUpdate();
  }
};
