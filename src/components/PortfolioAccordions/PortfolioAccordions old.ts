import { gsap } from 'gsap';
import { $scroll, type IScrollValues } from '@scripts/stores/scroll';

export class PortfolioAccordionsMechanic {
    body = document.body;
    html = document.documentElement;
    height = Math.max(
        this.body.scrollHeight,
        this.body.offsetHeight,
        this.html.clientHeight,
        this.html.scrollHeight,
        this.html.offsetHeight
    );

    constructor() {
        console.log('wow');
    }
    init() {
        var accordian = gsap.utils.toArray('.accordian');
        let cumulativeHeight = 0;
        let drawerNum = 0;
        let portfolioProgress = 0;
        let totalNum = 1;
        let fullHeight = 0;
        var accordian = gsap.utils.toArray('.accordian');
        const master = gsap.timeline();
        master.pause();

        console.log('yessir');
        accordian.forEach((drawer, i) => {
            totalNum += 1;
        });

        accordian.forEach((drawer, i) => {
            const q = gsap.utils.selector(drawer);
            const inner = q('.inner')[0];
            const accordianContentImage = q('.image');
            const paragraph = q('.paragraph');
            const accordianloader = q('.portfolioLoader')[0];
            const h2 = q('h2 a')[0];

            master
                .to(
                    drawer,
                    {
                        duration: 1 / totalNum,
                        height: '35vw',
                        ease: 'circ.inOut'
                    },
                    '<0%'
                )
                .to(
                    accordianContentImage,
                    {
                        duration: 1 / totalNum,
                        //      scale: "1.01",
                        autoAlpha: 1,
                        height: '100%',
                        ease: 'power1.inOut'
                    },
                    '<50%'
                )
                .to(
                    drawer,
                    {
                        duration: 1 / totalNum,
                        height: '140px',
                        ease: 'circ.inOut'
                        //      borderTop:"1px solid blue",
                        //      backgroundColor: "white",
                    },
                    '+=45%'
                )
                .to(
                    accordianContentImage,
                    {
                        duration: 1 / totalNum,
                        //           scale: 0.99,
                        ease: 'power2.inOut',
                        autoAlpha: 0
                    },
                    '<0%'
                );

            cumulativeHeight += inner.clientHeight;
            drawerNum += 1;
            h2.setAttribute('data-count', '' + (totalNum - drawerNum) + '');
        });

        master.timeScale(0.5);
        console.log('duration is: ' + master.duration());
        console.log(drawerNum + ' projects!');
        fullHeight = drawerNum * 140 + window.innerHeight / 2;

        document.getElementById('portfoliosContainer').style.height = '' + fullHeight + 'px';

        window.addEventListener('progressEvent', (e) => {
            const { target, progress } = e.detail;
            master.seek(master.duration() * progress);
        });

        window.addEventListener('resize', onWindowResize);

        function onWindowResize(fullHeight) {
            document.getElementById('portfoliosContainer').style.height = '' + fullHeight + 'px';
        }
    }
    destroy() {
        gsap.globalTimeline.getChildren().forEach((el) => {
            el.kill();
            el = null;
        });
    }
}
