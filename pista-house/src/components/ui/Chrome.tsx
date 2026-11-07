'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUI } from '@/lib/store';
import { BEATS, CHAPTERS } from '@/lib/story';
import { BRAND_ASSETS } from '@/lib/brand';
import { scrollToId, scrollToProgress } from '@/lib/scroll';

function Wordmark() {
  // Official logo is used verbatim when supplied; otherwise the name is simply set in type.
  return BRAND_ASSETS.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={BRAND_ASSETS.logo} alt="Pista House" />
  ) : (
    <>Pista House</>
  );
}

export function Nav() {
  const [solid, setSolid] = useState(false);
  const count = useUI((s) => s.cart.reduce((n, l) => n + l.qty, 0));
  const open = useUI((s) => s.setCartOpen);

  useEffect(() => {
    const on = () => setSolid(window.scrollY > 60);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <motion.header
      className="nav"
      data-solid={solid}
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <button className="wordmark" onClick={() => scrollToProgress(0)} aria-label="Pista House — back to the beginning">
        <Wordmark />
      </button>
      <nav className="nav-links" aria-label="Primary">
        <button className="optional" onClick={() => scrollToProgress(0)}>
          The Story
        </button>
        <button onClick={() => scrollToId('collection')}>Collection</button>
        <button className="optional" onClick={() => { useUI.getState().setHovered('hamper'); scrollToId('collection'); }}>
          Gift Hampers
        </button>
      </nav>
      <button className="bag-btn" onClick={() => open(true)} aria-label={`Open bag, ${count} items`}>
        Bag
        <motion.span key={count} className="bag-count" initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
          {count}
        </motion.span>
      </button>
    </motion.header>
  );
}

export function ChapterRail() {
  const active = useUI((s) => s.chapter);
  return (
    <nav className="rail" aria-label="Chapters" data-hidden={active === CHAPTERS.length - 1}>
      {CHAPTERS.map((c, i) => (
        <button
          key={c.key}
          aria-current={i === active ? 'step' : undefined}
          onClick={() => (c.key === 'collection' ? scrollToId('collection') : scrollToProgress(i === 0 ? 0 : (BEATS[c.key][0] + BEATS[c.key][1]) / 2))}
        >
          <span className="label">
            {c.index} · {c.label}
          </span>
          <span className="tick" />
        </button>
      ))}
    </nav>
  );
}

export function Loader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="loader" initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}>
          <div className="loader-inner">
            <motion.span className="wordmark" initial={{ opacity: 0, letterSpacing: '0.5em' }} animate={{ opacity: 1, letterSpacing: '0.3em' }} transition={{ duration: 1.6 }}>
              Pista House
            </motion.span>
            <span className="eyebrow" style={{ gap: 0 }}>
              The Feast of the Deccan
            </span>
            <div className="bar">
              <motion.i initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toast() {
  const toast = useUI((s) => s.toast);
  const [visible, setVisible] = useState<typeof toast>(null);
  useEffect(() => {
    if (!toast) return;
    setVisible(toast);
    const t = setTimeout(() => setVisible(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={visible.id}
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 10, x: '-50%' }}
        >
          {visible.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div>
        <p className="display">
          Pista House, <em>Hyderabad.</em>
        </p>
      </div>
      <nav aria-label="Footer">
        <button onClick={() => scrollToProgress(0)}>The Story</button>
        <button onClick={() => scrollToId('collection')}>Collection</button>
        <button onClick={() => useUI.getState().setCartOpen(true)}>Your Bag</button>
      </nav>
      <small>© {new Date().getFullYear()} Pista House. Prices shown are indicative.</small>
    </footer>
  );
}
