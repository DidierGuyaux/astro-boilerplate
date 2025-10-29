import { toDash } from '@scripts/utils/string';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import SwupScriptsPlugin from '@swup/scripts-plugin';
import SwupRouteNamePlugin from '@swup/scripts-plugin';
import Swup from 'swup';
import { Scroll } from '@scripts/classes/Scroll';
import { gsap } from 'gsap/dist/gsap';
import Typed from '/node_modules/typed.js';
import { PortfolioAccordionsMechanic } from 'src/components/PortfolioAccordions/PortfolioAccordions';

export class Transitions {
    static readonly READY_CLASS = 'is-ready';
    static readonly TRANSITION_CLASS = 'is-transitioning';

    private onVisitStartBind: any;
    private beforeContentReplaceBind: any;
    private onContentReplaceBind: any;
    private onAnimationInEndBind: any;
    private onAnimationOutStartBind: any;

    private swup: Swup | undefined;

    constructor() {
        this.onVisitStartBind = this.onVisitStart.bind(this);
        this.beforeContentReplaceBind = this.beforeContentReplace.bind(this);
        this.onContentReplaceBind = this.onContentReplace.bind(this);
        this.onAnimationInEndBind = this.onAnimationInEnd.bind(this);
        this.onAnimationOutStartBind = this.onAnimationOutStart.bind(this);
    }

    // =============================================================================
    // Lifecycle
    // =============================================================================

    init() {
        window.onbeforeunload = function () {
            window.scrollTo(0, 0);
        };
        this.initSwup();

        if (window.location.pathname == '/post') {
            const portFo = new PortfolioAccordionsMechanic();
            portFo.init();
            window.addEventListener('resize', onWindowResize);

            function onWindowResize() {
                portFo.destroy();
                portFo.init();
            }
        }

        requestAnimationFrame(() => {
            //Scroll.stop();

            document.documentElement.classList.add(Transitions.READY_CLASS);
            //Scroll.scrollTo(200, {duration:30, force:true, lock:true})

            setTimeout(srollWaitForAnim, 1800);
        });

        function srollWaitForAnim() {
            Scroll.start();
            Scroll.scrollTo(0, { immediate: true, force: true, lock: true });
        }
        if (document.getElementById('typed') != null) {
            var myEle = document.getElementById('typed');
            if (myEle) {
                var typed = new Typed('#typed', {
                    strings: ['&#60;OUR STORY/&#62;'],
                    loop: false,
                    typeSpeed: 20,
                    shuffle: true,
                    startDelay: 2000,
                    cursorChar: '▮'
                });
            }
        }
        if (document.getElementById('typedWork') != null) {
            var myEle = document.getElementById('typedWork');
            if (myEle) {
                var typed = new Typed('#typedWork', {
                    strings: ["&#60;Elephant's Memory/&#62;"],
                    loop: false,
                    typeSpeed: 20,
                    shuffle: true,
                    startDelay: 2000,
                    cursorChar: '▮'
                });
            }
        }

        //   gsap.to('.u-loader img', { scale: 0, duration: .5, ease: 'circ.in', overwrite: true,onComplete: hideLoader() });
        //   function hideLoader() {
        //   gsap.to('.u-loader', { height: 0, duration: 1.2, ease: CustomEase.create("custom", '0.075, 0.82, 0.165, 1'), overwrite: true });
        //   };
    }

    destroy() {
        this.swup?.destroy();
    }

    // =============================================================================
    // Methods
    // =============================================================================
    initSwup() {
        this.swup = new Swup({
            //animateHistoryBrowsing: true,

            plugins: [
                new SwupRouteNamePlugin({
                    routes: [
                        { name: 'home', path: '/' },
                        { name: 'post', path: '/post' },
                        { name: 'about', path: '/about' }
                    ],
                    paths: true
                }),
                new SwupHeadPlugin({
                    persistAssets: true,
                    awaitAssets: true
                }),
                new SwupPreloadPlugin({
                    preloadHoveredLinks: true,
                    preloadInitialPage: !import.meta.env.DEV
                }),
                new SwupScriptsPlugin()
            ]
        });
        this.swup.hooks.on('visit:start', (visit) => {
            console.log('Coming from route', visit.from.route);
            console.log('Going to route', visit.to.route);
        });
        this.swup.hooks.on('visit:start', this.onVisitStartBind);
        this.swup.hooks.before('content:replace', this.beforeContentReplaceBind);
        this.swup.hooks.on('content:replace', this.onContentReplaceBind);
        this.swup.hooks.on('animation:in:end', this.onAnimationInEndBind);
        this.swup.hooks.on('animation:out:start', this.onAnimationOutStartBind);

        this.swup.hooks.on('fetch:error', (e) => {
            console.log('fetch:error:', e);
            debugger;
        });
        this.swup.hooks.on('fetch:timeout', (e) => {
            console.log('fetch:timeout:', e);
            debugger;
        });
    }

    /**
     * Retrieve HTML dataset on next container and update our real html element dataset accordingly
     *
     * @param visit: VisitType
     */
    updateDocumentAttributes(visit: VisitType) {
        if (visit.fragmentVisit) return;

        const parser = new DOMParser();
        const nextDOM = parser.parseFromString(visit.to.html, 'text/html');
        const newDataset = {
            ...nextDOM.querySelector('html')?.dataset
        };

        Object.entries(newDataset).forEach(([key, val]) => {
            document.documentElement.setAttribute(`data-${toDash(key)}`, val ?? '');
        });
    }

    // =============================================================================
    // Hooks
    // =============================================================================

    /**
     * On visit:start
     * Transition to a new page begins
     *
     * @see https://swup.js.org/hooks/#visit-start
     * @param visit: VisitType
     */
    onVisitStart() {
        document.documentElement.classList.add(Transitions.TRANSITION_CLASS);
        document.documentElement.classList.remove(Transitions.READY_CLASS);
        window.onbeforeunload = function () {
            window.scrollTo(0, 0);
        };
    }

    /**
     * On before:content:replace
     * The old content of the page is replaced by the new content.
     *
     * @see https://swup.js.org/hooks/#content-replace
     * @param visit: VisitType
     */
    beforeContentReplace() {
        Scroll?.destroy();
        if (window.location.pathname === '/post') {
            const portFo = new PortfolioAccordionsMechanic();
            portFo.destroy();
        }
    }

    /**
     * On content:replace
     * The old content of the page is replaced by the new content.
     *
     * @see https://swup.js.org/hooks/#content-replace
     * @param visit: VisitType
     */
    onContentReplace(visit: VisitType) {
        Scroll?.init();
        this.updateDocumentAttributes(visit);
    }

    /**
     * On animation:out:start
     * Current content starts animating out. Class `.is-animating` is added.
     *
     * @see https://swup.js.org/hooks/#animation-out-start
     * @param visit: VisitType
     */
    onAnimationOutStart() {}

    /**
     * On animation:in:end
     * New content finishes animating out.
     *
     * @see https://swup.js.org/hooks/#animation-in-end
     * @param visit: VisitType
     */
    onAnimationInEnd() {
        if (window.location.pathname == '/post') {
            const portFo = new PortfolioAccordionsMechanic();
            portFo.init();
        }
        if (document.getElementById('typed') != null) {
            var myEle = document.getElementById('typed');
            if (myEle) {
                var typed = new Typed('#typed', {
                    strings: ['&#60;OUR STORY/&#62;'],
                    loop: false,
                    typeSpeed: 20,
                    shuffle: true,
                    startDelay: 2000,
                    cursorChar: '▮'
                });
            }
        }

        document.documentElement.classList.remove(Transitions.TRANSITION_CLASS);
        document.documentElement.classList.add(Transitions.READY_CLASS);

        //const section1 = document.getElementById("section_1");
        //const body = document.getElementById("body");
        //section1.style.zIndex = '999';
        //body.style.position = 'relative';
        Scroll.start();

        Scroll.scrollTo(0, { duration: 30, force: true, lock: true });
    }
}
