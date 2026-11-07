/**
 * Product catalogue for the homepage collection.
 *
 * NOTE: prices and pack sizes below are PLACEHOLDERS for layout and cart
 * behaviour. Replace them with live values from the Pista House catalogue /
 * commerce backend before launch.
 */
export type ProductId = 'roat' | 'biscuits' | 'cookies' | 'hamper';

export type Variant = { id: string; label: string; price: number };

export type Product = {
  id: ProductId;
  name: string;
  eyebrow: string;
  description: string;
  notes: string[];
  variants: Variant[];
};

export const PRODUCTS: Product[] = [
  {
    id: 'roat',
    name: 'Premium Dum Ke Roat',
    eyebrow: 'The signature',
    description:
      'Semolina, pure ghee and khoa, perfumed with cardamom and slow-baked until the edges caramelise.',
    notes: ['Semolina', 'Ghee', 'Khoa', 'Cardamom'],
    variants: [
      { id: 'roat-400', label: '400 g', price: 320 },
      { id: 'roat-800', label: '800 g', price: 620 },
    ],
  },
  {
    id: 'biscuits',
    name: 'Assorted Biscuits',
    eyebrow: 'From the bakery',
    description:
      'A tin of Hyderabad’s tea-time favourites — buttery, crisp and generously studded with fruit and nuts.',
    notes: ['Butter', 'Cashew', 'Tutti-frutti', 'Pistachio'],
    variants: [
      { id: 'biscuits-500', label: '500 g', price: 280 },
      { id: 'biscuits-1000', label: '1 kg', price: 540 },
    ],
  },
  {
    id: 'cookies',
    name: 'Handmade Cookies',
    eyebrow: 'Shaped by hand',
    description:
      'Small-batch cookies with a sandy crumb, crowned with almonds and pistachios, baked to a deep gold.',
    notes: ['Almond', 'Pistachio', 'Saffron', 'Brown butter'],
    variants: [
      { id: 'cookies-400', label: '400 g', price: 300 },
      { id: 'cookies-800', label: '800 g', price: 580 },
    ],
  },
  {
    id: 'hamper',
    name: 'Premium Gift Hampers',
    eyebrow: 'For every celebration',
    description:
      'The feast, boxed. Dum Ke Roat, biscuits and cookies gathered together for Eid, weddings and festive tables.',
    notes: ['Dum Ke Roat', 'Biscuits', 'Cookies', 'Dry fruits'],
    variants: [
      { id: 'hamper-classic', label: 'Classic', price: 1499 },
      { id: 'hamper-royal', label: 'Royal', price: 2499 },
    ],
  },
];

export const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
