'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { world, useUI } from '@/lib/store';
import { BEATS, CHAPTERS } from '@/lib/story';
import { PRODUCTS, formatINR } from '@/lib/products';
import { scrollToId, scrollToProgress, setStoryTrigger } from '@/lib/scroll';

/** [fade-in start, fade-out start] per chapter, in story progress */
const TIMING: Record<string, [number, number]> = {
  opening: [0, 0.065],
  reveal: [0.135, 0.225],
  explosion: [0.285, 0.365],
  transition: [0.415, 0.49],
  journey: [0.555, 0.705],
  product: [0.785, 0.865],
};

export function Story({ compact = false }: { compact?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const setChapter = useUI((s) => s.setChapter);
  const setHovered = useUI((s) => s.setHovered);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const bounds = { trigger: root.current, start: 'top top', endTrigger: document.getElementById('collection'), end: 'top top' };
      let last = -1;
      const st = ScrollTrigger.create({
        ...bounds,
        onUpdate: (s) => {
          world.target = s.progress;
          const i = CHAPTERS.findIndex((c) => s.progress < BEATS[c.key][1]);
          const idx = i === -1 ? CHAPTERS.length - 1 : i;
          if (idx !== last) setChapter((last = idx));
        },
        onRefresh: (s) => (world.target = s.progress),
      });
      setStoryTrigger(st);

      // copy is scrubbed by the very same scroll range as the camera
      const tl = gsap.timeline({ scrollTrigger: { ...bounds, scrub: 0.6 }, defaults: { ease: 'none' } });
      tl.to({}, { duration: 1 }, 0);
      const d = 0.03;
      gsap.utils.toArray<HTMLElement>('[data-chapter]').forEach((el) => {
        const [inAt, outAt] = TIMING[el.dataset.chapter!];
        const inner = el.querySelector('.chapter-inner');
        const y = reduce ? 0 : 36;
        if (inAt > 0) tl.fromTo(inner, { autoAlpha: 0, y }, { autoAlpha: 1, y: 0, duration: d, ease: 'power2.out' }, inAt);
        tl.to(inner, { autoAlpha: 0, y: -y, duration: d, ease: 'power2.in' }, outAt);
      });
      tl.to('.scroll-cue', { autoAlpha: 0, duration: 0.02 }, 0.01);
    }, root);
    return () => {
      setStoryTrigger(null);
      ctx.revert();
    };
  }, [setChapter]);

  const featured = PRODUCTS.filter((p) => p.id !== 'hamper');

  return (
    <section ref={root} className="story" id="story" aria-label="The story" style={compact ? { height: '600vh' } : undefined}>
      <div className="story-stage">
        <div className="scroll-cue" aria-hidden>
          Scroll
          <span className="line" />
        </div>

        <div className="chapter" data-pos="hero" data-chapter="opening">
          <div className="chapter-inner">
            <span className="eyebrow">Hyderabad · Bakery &amp; Confectionery</span>
            <h1 className="display hero-title">Pista House</h1>
            <div className="hero-row">
              <p className="hero-sub">The Feast of the Deccan</p>
              <div className="hero-actions">
                <button className="btn btn-ghost" onClick={() => scrollToProgress(BEATS.reveal[1] - 0.02)}>
                  Lift the lid
                </button>
                <button className="btn btn-gold" onClick={() => scrollToId('collection')}>
                  Shop the collection
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="chapter" data-pos="left" data-chapter="reveal">
          <div className="chapter-inner">
            <span className="chapter-index">II — The Dum</span>
            <h2 className="display">
              Sealed with dough. <em>Kept by time.</em>
            </h2>
            <p className="lede">
              In the old kitchens of the Deccan, the pot is sealed and left to breathe over embers. Patience is the first
              ingredient.
            </p>
          </div>
        </div>

        <div className="chapter" data-pos="bottom-right" data-chapter="explosion">
          <div className="chapter-inner">
            <span className="chapter-index">III — The Bloom</span>
            <h2 className="display">
              One golden <em>breath.</em>
            </h2>
            <p className="lede">Saffron, pistachio, cashew and almond — the treasures of the Deccan, released at once.</p>
          </div>
        </div>

        <div className="chapter" data-pos="left" data-chapter="transition">
          <div className="chapter-inner">
            <span className="chapter-index">IV — The Spiral</span>
            <h2 className="display">
              Follow the <em>steam.</em>
            </h2>
            <p className="lede">It curls into a path, and the path leads to the bakery.</p>
          </div>
        </div>

        <div className="chapter" data-pos="bottom-left" data-chapter="journey">
          <div className="chapter-inner">
            <span className="chapter-index">V — The Bakery</span>
            <h2 className="display">
              Crackled, crisp, <em>made by hand.</em>
            </h2>
            <div className="mini-shelf" role="list">
              {featured.map((p) => (
                <button
                  key={p.id}
                  role="listitem"
                  onClick={() => {
                    setHovered(p.id);
                    scrollToId('collection');
                  }}
                >
                  {p.name}
                  <small>from {formatINR(Math.min(...p.variants.map((v) => v.price)))}</small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="chapter" data-pos="right" data-chapter="product">
          <div className="chapter-inner">
            <span className="chapter-index">VI — The Gift</span>
            <h2 className="display">
              A box worth <em>opening.</em>
            </h2>
            <p className="lede">The whole feast, gathered for Eid, weddings and every table that deserves a celebration.</p>
            <button
              className="btn btn-gold"
              onClick={() => {
                setHovered('hamper');
                scrollToId('collection');
              }}
            >
              Explore gift hampers
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
