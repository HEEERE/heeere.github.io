(() => {
  const root = document.documentElement;
  const preloader = document.querySelector(".preloader");

  const showStaticPage = () => {
    root.classList.remove("is-loading");
    if (preloader) preloader.style.display = "none";
  };

  if (!window.gsap || !window.ScrollTrigger) {
    showStaticPage();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    showStaticPage();
    gsap.set("[data-hero-reveal], [data-portrait], .reveal", {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      clearProps: "clipPath"
    });
    return;
  }

  const loaderCounter = document.querySelector("[data-loader-counter]");
  const counter = { value: 0 };

  gsap.set("[data-hero-reveal]", { y: 28, autoAlpha: 0 });
  gsap.set(".title-line > span", { yPercent: 115 });
  gsap.set("[data-portrait]", {
    clipPath: "inset(100% 0 0 0)",
    scale: 1.08,
    autoAlpha: 1
  });
  gsap.set(".graph-line", { scaleX: 0 });
  gsap.set(".preloader__name span", { yPercent: 120, rotation: 7 });
  gsap.set(".preloader__track span, .preloader__signals span", { scaleX: 0 });

  const intro = gsap.timeline({
    defaults: { ease: "power4.out" },
    onComplete: initPageAnimations
  });

  intro
    .fromTo(".preloader__meta", { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.42 })
    .to(".preloader__name span", {
      yPercent: 0,
      rotation: 0,
      stagger: 0.09,
      duration: 0.78
    }, "<0.08")
    .to(".preloader__signals span", {
      scaleX: 1,
      stagger: 0.055,
      duration: 0.5
    }, "<0.15")
    .to(counter, {
      value: 100,
      duration: 1.15,
      ease: "power2.inOut",
      onUpdate: () => {
        loaderCounter.textContent = String(Math.round(counter.value)).padStart(3, "0");
      }
    }, "<0.05")
    .to(".preloader__track span", {
      scaleX: 1,
      duration: 1.15,
      ease: "power2.inOut"
    }, "<")
    .to(".preloader__name span", {
      yPercent: -125,
      rotation: -5,
      stagger: 0.055,
      duration: 0.58,
      ease: "power4.in"
    }, "+=0.12")
    .to(".preloader__meta, .preloader__track, .preloader__signals", {
      autoAlpha: 0,
      y: -12,
      stagger: 0.035,
      duration: 0.3
    }, "<0.1")
    .to(preloader, {
      clipPath: "inset(0 0 100% 0)",
      duration: 0.84,
      ease: "power4.inOut"
    })
    .add(() => {
      root.classList.remove("is-loading");
      preloader.style.display = "none";
    })
    .to(".site-header", { y: 0, autoAlpha: 1, duration: 0.6 })
    .to(".hero .title-line > span", { yPercent: 0, duration: 0.95 }, "<0.06")
    .to(".hero__copy [data-hero-reveal]", {
      y: 0,
      autoAlpha: 1,
      stagger: 0.1,
      duration: 0.7
    }, "<0.12")
    .to("[data-portrait]", {
      clipPath: "inset(0% 0 0 0)",
      scale: 1,
      duration: 1.05
    }, "<0.06")
    .to(".graph-line", {
      scaleX: 1,
      stagger: 0.14,
      duration: 0.9
    }, "<0.08")
    .to(".hero__footer", { y: 0, autoAlpha: 1, duration: 0.58 }, "<0.15");

  function initPageAnimations() {
    const mm = gsap.matchMedia();

    gsap.to(".scroll-progress span", {
      scaleX: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.15
      }
    });

    gsap.to(".signal-strip__track", {
      xPercent: -50,
      duration: 28,
      ease: "none",
      repeat: -1
    });

    gsap.set(".reveal", { y: 48, autoAlpha: 0 });
    ScrollTrigger.batch(".reveal", {
      start: "top 86%",
      once: true,
      onEnter: (elements) => {
        gsap.to(elements, {
          y: 0,
          autoAlpha: 1,
          stagger: 0.08,
          overwrite: true
        });
      }
    });

    document.querySelectorAll(".project").forEach((project) => {
      const elements = project.querySelectorAll(
        ".project__number, .project__date, .project__type, h3, .project__subtitle, .project__description, .project__evidence > p, .tags"
      );

      gsap.from(elements, {
        y: 42,
        autoAlpha: 0,
        stagger: 0.055,
        duration: 0.72,
        scrollTrigger: {
          trigger: project,
          start: "top 75%",
          once: true
        }
      });

      ScrollTrigger.create({
        trigger: project,
        start: "top 48%",
        end: "bottom 48%",
        toggleClass: "is-active"
      });
    });

    gsap.fromTo(".contact__title .title-line > span", {
      yPercent: 110
    }, {
      yPercent: 0,
      stagger: 0.12,
      duration: 0.95,
      scrollTrigger: {
        trigger: ".contact__title",
        start: "top 82%",
        once: true
      }
    });

    const header = document.querySelector(".site-header");
    ScrollTrigger.create({
      start: 80,
      end: "max",
      onToggle: (self) => header.classList.toggle("is-scrolled", self.isActive)
    });

    gsap.to(".graph-node", {
      scale: 1.8,
      autoAlpha: 0.35,
      duration: 1.45,
      stagger: {
        each: 0.3,
        repeat: -1,
        yoyo: true
      },
      ease: "sine.inOut"
    });

    mm.add("(min-width: 981px)", () => {
      gsap.to("[data-portrait]", {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 0.7
        }
      });

      const hero = document.querySelector(".hero");
      const portrait = document.querySelector("[data-portrait]");
      const moveX = gsap.quickTo(portrait, "x", { duration: 0.7, ease: "power3.out" });
      const moveY = gsap.quickTo(portrait, "y", { duration: 0.7, ease: "power3.out" });

      const handlePointer = (event) => {
        const bounds = hero.getBoundingClientRect();
        moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * 18);
        moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * 14);
      };

      const resetPointer = () => {
        moveX(0);
        moveY(0);
      };

      hero.addEventListener("pointermove", handlePointer);
      hero.addEventListener("pointerleave", resetPointer);

      return () => {
        hero.removeEventListener("pointermove", handlePointer);
        hero.removeEventListener("pointerleave", resetPointer);
      };
    });

    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  }
})();
