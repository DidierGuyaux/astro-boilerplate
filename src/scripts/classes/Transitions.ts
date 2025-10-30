import { toDash } from '@scripts/utils/string';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import SwupScriptsPlugin from '@swup/scripts-plugin';
import SwupRouteNamePlugin from '@swup/scripts-plugin';
import Swup from 'swup';
import { Scroll } from '@scripts/classes/Scroll';
import { gsap } from 'gsap/dist/gsap';
import Typed from 'typed.js';
import GUI from 'lil-gui';

import { PortfolioAccordionsMechanic } from 'src/components/PortfolioAccordions/PortfolioAccordions';

import {
  getSceneManager,
  destroyManager,
  type SceneSubject,
} from 'src/components/ElephantModel/sceneManager';
import { elephantScene } from 'src/components/ElephantModel/elephantScene';

const emptySubject: SceneSubject = async () => {};

type VisitType = any; // keep or import your project's VisitType

export class Transitions {
  static readonly READY_CLASS = 'is-ready';
  static readonly TRANSITION_CLASS = 'is-transitioning';

  private swup: Swup | undefined;

  // class fields for handlers so we can remove them
  private onVisitStartBind: any;
  private beforeContentReplaceBind: any;
  private onContentReplaceBind: any;
  private onAnimationInEndBind: any;
  private onAnimationOutStartBind: any;

  private onSceneSetHandler?: (e: Event) => void;
  private onSceneSubjectHandler?: (e: Event) => void;
  private resizeHandler?: () => void;

  // keep GUI and manager on the instance
  private gui!: GUI;
  private mgr: ReturnType<typeof getSceneManager> | null = null;

  private pageHasScene = false;

  constructor() {
    this.onVisitStartBind = this.onVisitStart.bind(this);
    this.beforeContentReplaceBind = this.beforeContentReplace.bind(this);
    this.onContentReplaceBind = this.onContentReplace.bind(this);
    this.onAnimationInEndBind = this.onAnimationInEnd.bind(this);
    this.onAnimationOutStartBind = this.onAnimationOutStart.bind(this);
  }

  init() {
    this.initSwup();

    // --- GUI (visible, persistent; outside Swup container)
    this.gui = new GUI({ autoPlace: false });
    document.body.appendChild(this.gui.domElement);
    Object.assign(this.gui.domElement.style, {
      position: 'fixed',
      top: '12px',
      right: '12px',
      zIndex: '2147483647',
      pointerEvents: 'auto',
    });

    // --- SceneManager boot (persistent; mount outside Swup)
    const threeRoot = document.getElementById('threeWrapper');
    if (threeRoot) {
      this.mgr = getSceneManager(threeRoot, emptySubject, this.gui);
    
      // Helper: show/hide the canvas
      const setVisible = (v: boolean) => {
        const el = this.mgr?.renderer?.domElement;
        if (el) el.style.display = v ? 'block' : 'none';
      };
      // Start hidden
      setVisible(false);
    
      // When a page dispatches a concrete subject, apply & show
      this.onSceneSubjectHandler = (e: Event) => {
        const subject = (e as CustomEvent).detail as SceneSubject;
        console.log('[Transitions] scene:subject received', subject?.name || subject);
        this.pageHasScene = true;
        this.mgr?.setSubject?.(subject);
        setVisible(true);
      };
      window.addEventListener('scene:subject', this.onSceneSubjectHandler);
      //document.addEventListener('scene:subject', this.onSceneSubjectHandler);
    
      // Optional: simple models array support
      this.onSceneSetHandler = async (e: Event) => {
        const models = (e as CustomEvent).detail as { src: string; position?: [number,number,number]; scale?: number }[];
        if (!models || !Array.isArray(models)) return;
    
        const subject: SceneSubject = async (_canvas, scene) => {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          const loader = new GLTFLoader();
          for (const m of models) {
            const gltf = await loader.loadAsync(m.src);
            const root = gltf.scene;
            if (m.position) root.position.set(...m.position);
            if (m.scale) root.scale.setScalar(m.scale);
            scene.add(root);
          }
        };
    
        console.log('[Transitions] scene:set → adhoc subject for models:', models);
        this.pageHasScene = true;
        this.mgr?.setSubject?.(subject);
        setVisible(true);
      };
      window.addEventListener('scene:set', this.onSceneSetHandler);
    
      // Pick up an early-dispatched subject (if any)
      // @ts-ignore
      if (window.__pendingSceneSubject) {
        // @ts-ignore
        const pending = window.__pendingSceneSubject as SceneSubject;
        console.log('[Transitions] applying pending scene subject');
        this.pageHasScene = true;
        this.mgr?.setSubject?.(pending);
        setVisible(true);
      }
    
      // Store helper to reuse below
      // @ts-ignore
      this._set3DVisible = setVisible;
    }

    // Page-local features (typed, accordions, etc.)
    this.mountPageFeatures();

    // Ready flags
    requestAnimationFrame(() => {
      document.documentElement.classList.add(Transitions.READY_CLASS);
      setTimeout(() => Scroll.start(), 1500);
    });
  }

  destroy() {
    if (this.onSceneSetHandler) {
      window.removeEventListener('scene:set', this.onSceneSetHandler);
    }
    if (this.onSceneSubjectHandler) {
      window.removeEventListener('scene:subject', this.onSceneSubjectHandler);
     document.removeEventListener('scene:subject', this.onSceneSubjectHandler);
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }

    destroyManager();
    this.swup?.destroy();
    this.gui?.destroy?.();
  }

  // ---------------- SWUP ----------------
  private initSwup() {
    this.swup = new Swup({
      plugins: [
        new SwupRouteNamePlugin({
          routes: [
            { name: 'home', path: '/' },
            { name: 'post', path: '/post' },
            { name: 'about', path: '/about' },
          ],
          paths: true,
        }),
        new SwupHeadPlugin({ persistAssets: true, awaitAssets: true }),
        new SwupPreloadPlugin({ preloadHoveredLinks: true, preloadInitialPage: !import.meta.env.DEV }),
        new SwupScriptsPlugin(),
      ],
    });

    this.swup.hooks.on('visit:start', this.onVisitStartBind);
    this.swup.hooks.before('content:replace', this.beforeContentReplaceBind);
    this.swup.hooks.on('content:replace', this.onContentReplaceBind);
    this.swup.hooks.on('animation:in:end', this.onAnimationInEndBind);
    this.swup.hooks.on('animation:out:start', this.onAnimationOutStartBind);

    // helpful logs
    this.swup.hooks.on('visit:start', (visit) => {
      console.log('Coming from route', visit.from.route, '→ to', visit.to.route);
    });
    this.swup.hooks.on('fetch:error', (e) => console.log('fetch:error:', e));
    this.swup.hooks.on('fetch:timeout', (e) => console.log('fetch:timeout:', e));
  }

  private updateDocumentAttributes(visit: VisitType) {
    if (visit.fragmentVisit) return;
    const parser = new DOMParser();
    const nextDOM = parser.parseFromString(visit.to.html, 'text/html');
    const newDataset = { ...(nextDOM.querySelector('html')?.dataset || {}) };
    Object.entries(newDataset).forEach(([key, val]) => {
      document.documentElement.setAttribute(`data-${toDash(key)}`, val ?? '');
    });
  }

  // ---------------- Hooks ----------------
  private onVisitStart() {
    document.documentElement.classList.add(Transitions.TRANSITION_CLASS);
    document.documentElement.classList.remove(Transitions.READY_CLASS);
  }

  private beforeContentReplace(_visit: VisitType) {
    window.scrollTo(0, 0);
    Scroll?.scrollTo(0, { immediate: true });
    Scroll?.destroy();
    // Reset the flag for the next page; the next page must opt-in again
  this.pageHasScene = false;

  // Optionally clear to empty immediately (avoids “old scene” flashing)
  if (this.mgr) this.mgr.setSubject?.(emptySubject);
  // Hide until a page dispatches a subject
  // @ts-ignore
  this._set3DVisible?.(false);
  }

  private onContentReplace(visit: VisitType) {
    Scroll?.init();
    this.updateDocumentAttributes(visit);
  }

  private onAnimationOutStart() {
    const easing: Lenis['easing'] = (x: number): number => {
        // easeInOutExpo
        return x === 0
          ? 0
          : x === 1
          ? 1
          : x < 0.5
          ? Math.pow(2, 20 * x - 10) / 2
          : (2 - Math.pow(2, -20 * x + 10)) / 2;
      };
    Scroll?.scrollTo(0, { easing, duration: 2.5  });

  }

  private onAnimationInEnd() {
    this.mountPageFeatures();
    document.documentElement.classList.remove(Transitions.TRANSITION_CLASS);
    document.documentElement.classList.add(Transitions.READY_CLASS);
    
    // If this page didn't declare a scene, keep 3D hidden + empty
  if (!this.pageHasScene) {
    if (this.mgr) this.mgr.setSubject?.(emptySubject);
    // @ts-ignore
    this._set3DVisible?.(false);
  }
    
    Scroll.start();


  }

  // ---------------- Page features ----------------
  private mountPageFeatures() {
    // Accordions (page: /post)
    if (window.location.pathname === '/post') {
      const portFo = new PortfolioAccordionsMechanic();
      portFo.init();

      if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = () => {
        portFo.destroy();
        portFo.init();
      };
      window.addEventListener('resize', this.resizeHandler);
    }

    // Typed headings
    const typedEl = document.getElementById('typed');
    if (typedEl) {
      new Typed('#typed', {
        strings: ['&#60;OUR STORY/&#62;'],
        loop: false,
        typeSpeed: 20,
        shuffle: true,
        startDelay: 2000,
        cursorChar: '▮',
      });
    }
    const typedWorkEl = document.getElementById('typedWork');
    if (typedWorkEl) {
      new Typed('#typedWork', {
        strings: ["&#60;Elephant's Memory/&#62;"],
        loop: false,
        typeSpeed: 20,
        shuffle: true,
        startDelay: 2000,
        cursorChar: '▮',
      });
    }
  }
}