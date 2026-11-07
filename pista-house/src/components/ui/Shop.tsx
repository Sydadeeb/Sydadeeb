'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PRODUCTS, formatINR, type Product } from '@/lib/products';
import { world, useUI } from '@/lib/store';
import { ProductArt } from './Fallback';

function ProductCard({ product, index, show3D }: { product: Product; index: number; show3D: boolean }) {
  const [variant, setVariant] = useState(product.variants[0]);
  const hovered = useUI((s) => s.hovered === product.id);
  const setHovered = useUI((s) => s.setHovered);
  const add = useUI((s) => s.add);
  const notify = useUI((s) => s.notify);
  const ref = useRef<HTMLElement>(null);

  // nav shortcuts ("Gift Hampers") highlight the card they jump to
  useEffect(() => {
    if (hovered && ref.current && !ref.current.matches(':hover')) {
      const t = setTimeout(() => !ref.current?.matches(':hover') && useUI.getState().hovered === product.id && setHovered(null), 3200);
      return () => clearTimeout(t);
    }
  }, [hovered, product.id, setHovered]);

  return (
    <motion.article
      ref={ref}
      className="card"
      data-active={hovered}
      onPointerEnter={() => setHovered(product.id)}
      onPointerLeave={() => {
        setHovered(null);
        delete world.tilt[product.id];
      }}
      onFocus={() => setHovered(product.id)}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="stage"
        ref={(el) => {
          world.slots[product.id] = el;
        }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          world.tilt[product.id] = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
        }}
        aria-hidden
      >
        <span className="num">0{index + 1}</span>
        {!show3D && (
          <div className="fallback-art">
            <ProductArt id={product.id} />
          </div>
        )}
      </div>
      <div className="info">
        <span className="eyebrow">{product.eyebrow}</span>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <div className="notes">
          {product.notes.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
        <div className="buy">
          <div className="variants" role="group" aria-label={`${product.name} size`}>
            {product.variants.map((v) => (
              <button key={v.id} aria-pressed={v.id === variant.id} onClick={() => setVariant(v)}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="buy-row">
            <span className="price" aria-live="polite">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={variant.price}
                  style={{ display: 'inline-block' }}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  {formatINR(variant.price)}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.button
              className="btn btn-gold"
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                add(product.id, variant.id);
                notify(`${product.name} · ${variant.label} added to your bag`);
              }}
            >
              Add to bag
            </motion.button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export function CollectionSection({ show3D }: { show3D: boolean }) {
  return (
    <section id="collection" className="collection" aria-labelledby="collection-title">
      <div className="collection-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="chapter-index">VII — The Collection</span>
          <h2 id="collection-title" className="display">
            Take the feast <em>home.</em>
          </h2>
        </div>
        <p className="lede">Hover to turn each piece in the light. Every order is packed to travel — across the city or across the world.</p>
      </div>
      <div className="grid">
        {PRODUCTS.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} show3D={show3D} />
        ))}
      </div>
    </section>
  );
}

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, notify } = useUI();
  const closeRef = useRef<HTMLButtonElement>(null);
  const lines = cart
    .map((l) => {
      const product = PRODUCTS.find((p) => p.id === l.productId);
      const variant = product?.variants.find((v) => v.id === l.variantId);
      return product && variant ? { ...l, product, variant } : null;
    })
    .filter(Boolean) as (typeof cart[number] & { product: Product; variant: Product['variants'][number] })[];
  const total = lines.reduce((s, l) => s + l.qty * l.variant.price, 0);

  useEffect(() => {
    if (!cartOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setCartOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cartOpen, setCartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} />
          <motion.aside
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Your bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <header>
              <h2>Your bag</h2>
              <button ref={closeRef} className="btn btn-ghost" style={{ height: 38 }} onClick={() => setCartOpen(false)}>
                Close
              </button>
            </header>
            <div className="lines">
              {lines.length === 0 ? (
                <div className="empty">
                  <p style={{ margin: 0 }}>Your bag is waiting for its first treasure.</p>
                  <button
                    className="btn btn-gold"
                    onClick={() => {
                      setCartOpen(false);
                      document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Browse the collection
                  </button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {lines.map((l) => (
                    <motion.div key={l.variantId} className="line" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                      <h3>{l.product.name}</h3>
                      <strong>{formatINR(l.qty * l.variant.price)}</strong>
                      <span className="meta">
                        {l.variant.label} · {formatINR(l.variant.price)} each
                      </span>
                      <div className="stepper">
                        <button aria-label="Decrease quantity" onClick={() => setQty(l.variantId, l.qty - 1)}>
                          −
                        </button>
                        <span>{l.qty}</span>
                        <button aria-label="Increase quantity" onClick={() => setQty(l.variantId, l.qty + 1)}>
                          +
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
            {lines.length > 0 && (
              <footer>
                <div className="total">
                  <span className="eyebrow">Subtotal</span>
                  <strong>{formatINR(total)}</strong>
                </div>
                <button className="btn btn-gold" onClick={() => notify('Checkout is not connected in this preview')}>
                  Checkout
                </button>
                <span className="price-note">Delivery and taxes calculated at checkout.</span>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
