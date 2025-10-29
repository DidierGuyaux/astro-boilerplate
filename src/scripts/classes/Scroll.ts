import { $scroll } from '@scripts/stores/scroll';
import { gsap } from 'gsap/dist/gsap';

import LocomotiveScroll, {
    type lenisTargetScrollTo,
    type ILenisScrollToOptions,
} from 'locomotive-scroll';

export class Scroll {
    static locomotiveScroll: LocomotiveScroll;

    // =============================================================================
    // Lifecycle
    // =============================================================================
    static init() {
        this.locomotiveScroll = new LocomotiveScroll({
            lenisOptions: {
            lerp: 0.1,
            duration: 2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        },
            autoStart: true ,
            resetNativeScroll:true,
            triggerRootMargin: '-1px -1px -1px -1px',
            rafRootMargin: '100% 100% 100% 100%',
            initCustomTicker: (render) => {
                gsap.ticker.add(render);
            },
            destroyCustomTicker: (render) => {
                gsap.ticker.remove(render);
            },
            scrollCallback({ scroll, limit, velocity, direction, progress }) {
                $scroll.set({
                    scroll,
                    limit,
                    velocity,
                    direction,
                    progress
                });
                
            }
        });
        //Scroll.scrollTo(0,{immediate:true});
        //Scroll.stop();
        console.log(this.locomotiveScroll)

        
        window.__loco = this.locomotiveScroll;
window.dispatchEvent(new CustomEvent('loco:ready', { detail: { instance: this.locomotiveScroll } }));
console.log('[Scroll] locomotive ready:', { options: this.locomotiveScroll.options, old: this.locomotiveScroll.scroll?.instance?.options });

    }

    static destroy() {
        this.locomotiveScroll?.destroy();
    }

   

    // =============================================================================
    // Methods
    // =============================================================================
    static start() {
        this.locomotiveScroll?.start();
       // this.locomotiveScroll?.scrollTo(0, 0);
    }

    static stop() {
        this.locomotiveScroll?.stop();
    }

    static addScrollElements(container: HTMLElement) {
        this.locomotiveScroll?.addScrollElements(container);
    }

    static removeScrollElements(container: HTMLElement) {
        this.locomotiveScroll?.removeScrollElements(container);
    }

    static scrollTo(target: lenisTargetScrollTo, options?: ILenisScrollToOptions) {
        this.locomotiveScroll?.scrollTo(target, options);
    }


}



