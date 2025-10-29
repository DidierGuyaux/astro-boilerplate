// /src/components/PortfolioAccordions/PortfolioAccordions.ts
import { gsap } from 'gsap';

type Item = {
    id: string;
    el: HTMLElement;
    inner?: HTMLElement;
    img?: HTMLElement;
    tl: gsap.core.Timeline; // paused; tl.progress(openness)
    smooth?: (p: number) => void; // gsap.quickTo cached setter for tl.progress
    expanded: number;
    lastP: number;
    ac: AbortController; // auto-unsubscribe for this item
};

const COLLAPSED = 100; // px height when visually closed

const clamp01 = (n: number) => Math.min(1, Math.max(0, n || 0));
// openness: 1 at p=0.5; 0 at p=0 and p=1
const opennessFromProgress = (p: number) => {
    const d = Math.abs(2 * p - 1); // 0 at center, 1 at extremes
    const smooth = d * d * (3 - 2 * d); // smoothstep(d)
    return 1 - smooth;
};

class PortfolioAccordionsMechanic {
    private _ctx!: gsap.Context;
    private _items: Item[] = [];
    private _ro?: ResizeObserver;

    init() {
        this._buildAndWire();
        // Optional: live re-measure if inner/image sizes change later
        this._ro = new ResizeObserver(() => this._remeasure());
        this._items.forEach((i) => {
            if (i.inner) this._ro!.observe(i.inner);
            if (i.img) this._ro!.observe(i.img);
        });
    }

    destroy() {
        // detach per-item listeners
        this._items.forEach((i) => i.ac.abort());
        this._items.forEach((i) => i.tl.kill());
        this._items = [];
        this._ro?.disconnect();
        this._ctx?.revert();
    }

    // ---------------- core ----------------

    private _buildAndWire() {
        // clear any prior GSAP styling/tweens in this file’s scope
        this._ctx?.revert();

        this._ctx = gsap.context(() => {
            const nodes = gsap.utils.toArray<HTMLElement>('.accordian');

            this._items = nodes.map((el, idx) => {
                const id = (el.dataset.scrollEventProgress?.trim() || String(idx)).toString();
                const q = gsap.utils.selector(el);
                const inner = q('.inner')[0] as HTMLElement | undefined;
                const img = q('.image')[0] as HTMLElement | undefined;

                // measure expanded height from content (your images are uniform height)
                const expanded = Math.max(COLLAPSED, inner ? inner.clientHeight : COLLAPSED);

                // baseline (collapsed)
                gsap.set(el, { height: COLLAPSED });
                gsap.set(el, { height: COLLAPSED });
                if (img) {
                    gsap.set(img, {
                        opacity: 0,
                        visibility: 'hidden',
                        filter: 'blur(10px)', // start blurred when "closed"
                        // optional polish:
                        yPercent: 3 // slight lift-in when opening
                    });
                }

                // paused TL whose progress == openness (0..1)
                const tl = gsap.timeline({
                    paused: true,
                    defaults: { ease: 'none', overwrite: 'auto' }
                });
                tl.to(el, { height: expanded, duration: 1 }, 0);

                if (img) {
                    tl.to(
                        img,
                        {
                            opacity: 1,
                            visibility: 'inherit',
                            filter: 'blur(0px)', // sharp at fully open
                            yPercent: 0, // relax to neutral
                            duration: 1
                        },
                        0
                    );
                }

                // smooth temporal interpolation for progress (feels nicer than snapping)
                const smooth = gsap.quickTo(tl, 'progress', { duration: 0.25, ease: 'power2.out' });

                // first paint: slight open if near center (geometry fallback)
                const initOpen = this._initialOpennessFromGeometry(el);
                tl.progress(initOpen);

                // per-item event listener with AbortController (simple cleanup)
                const ac = new AbortController();
                window.addEventListener(
                    `${id}`,
                    (e: CustomEvent) => {
                        const p = clamp01(e?.detail?.progress);
                        const open = opennessFromProgress(p);
                        // store last progress and glide TL toward the new openness
                        item.lastP = p;
                        smooth(open);
                    },
                    { signal: ac.signal as any }
                );

                const item: Item = { id, el, inner, img, tl, smooth, expanded, lastP: 0, ac };
                return item;
            });
        });
    }

    // re-measure expanded heights if content changed (images loaded, fonts swapped, etc.)
    private _remeasure() {
        this._items.forEach((item) => {
            const newExpanded = Math.max(
                COLLAPSED,
                item.inner ? item.inner.clientHeight : COLLAPSED
            );
            if (newExpanded !== item.expanded) {
                item.expanded = newExpanded;
                // Update the TL’s target height tween (the one at position 0)
                // We can just set the element to the correct instantaneous height for current openness:
                const open = item.tl.progress(); // current openness 0..1
                const h = gsap.utils.interpolate(COLLAPSED, item.expanded, open);
                gsap.set(item.el, { height: h });
            }
        });
    }

    // mild visual nicety: items near center start more open on first paint
    private _initialOpennessFromGeometry(el: HTMLElement): number {
        const r = el.getBoundingClientRect();
        const vpMid = window.innerHeight / 2;
        const mid = r.top + r.height / 2;
        const influence = window.innerHeight * 0.25;
        const t = clamp01(Math.abs(mid - vpMid) / influence); // 0 center → 1 far
        const smooth = t * t * (3 - 2 * t);
        return 1 - smooth;
    }
}

// Export both ways so your imports keep working
export { PortfolioAccordionsMechanic };
export default PortfolioAccordionsMechanic;
