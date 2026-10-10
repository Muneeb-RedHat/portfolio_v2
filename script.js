/* ==========================================================
   MUNEEB SAJID — PORTFOLIO v2 SCRIPT
   Part A: normal page features (menu, scroll, reveal, year)
   Part B: 3D robots with Three.js (arm, solar tracker, gesture hand, rover)
   ========================================================== */

(() => {
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // CSS only hides ".reveal" items when this class exists, so the page
  // stays readable if JavaScript ever fails.
  root.classList.add("js");

  /* =========================================================
     PART A — PAGE FEATURES
     ========================================================= */

  // ---------- Mobile menu ----------
  const menuToggle = document.getElementById("menu-toggle");
  const siteNav = document.getElementById("site-nav");
  const navLinks = document.querySelectorAll("[data-nav]");

  function setMenuOpen(isOpen) {
    siteNav.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  }

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  navLinks.forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });

  window.matchMedia("(min-width: 761px)").addEventListener("change", (event) => {
    if (event.matches) setMenuOpen(false);
  });

  // ---------- Highlight the nav link of the section on screen ----------
  const sections = document.querySelectorAll("main section[id]");

  function highlightLink(sectionId) {
    navLinks.forEach((link) => {
      const isCurrent = link.getAttribute("href") === "#" + sectionId;
      link.classList.toggle("is-active", isCurrent);
      if (isCurrent) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) highlightLink(entry.target.id); }),
      { rootMargin: "-45% 0px -50% 0px" } // counts as "current" in the middle band of the screen
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  // ---------- Reveal on scroll ----------
  const revealItems = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  // ---------- Back to top ----------
  const topAnchor = document.getElementById("top");
  document.getElementById("back-to-top").addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
    topAnchor.setAttribute("tabindex", "-1");
    topAnchor.focus({ preventScroll: true });
  });

  // ---------- Footer year ----------
  document.getElementById("current-year").textContent = new Date().getFullYear();


  /* =========================================================
     PART B — 3D ROBOTS (Three.js)
     How it works:
       1. Each ".viewer" in the HTML has a data-model name.
       2. A "builder" function makes that robot out of simple shapes.
       3. One animation loop updates and draws every viewer that is on screen.
     ========================================================= */

  const viewerElements = document.querySelectorAll(".viewer");

  // If Three.js didn't load (offline, blocked CDN), show the fallback text and stop.
  if (typeof THREE === "undefined") {
    viewerElements.forEach((el) => el.classList.add("no-webgl"));
    return;
  }

  // ---------- Shared materials (so every robot looks like one family) ----------
  const materials = {
    metal: new THREE.MeshStandardMaterial({ color: 0x23262b, metalness: 0.85, roughness: 0.38 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: 0x121316, metalness: 0.8, roughness: 0.45 }),
    light: new THREE.MeshStandardMaterial({ color: 0xc9cfd3, metalness: 0.7, roughness: 0.3 }),
    accent: new THREE.MeshStandardMaterial({ color: 0xff6a00, metalness: 0.4, roughness: 0.4, emissive: 0x401a00 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xff6a00 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x0c1a3d, metalness: 0.6, roughness: 0.25 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x0a0b0d, metalness: 0.3, roughness: 0.6, emissive: 0x08090b }),
  };

  // Small helpers so builders stay short and readable
  function box(width, height, depth, material) {
    return new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  }
  function cylinder(radiusTop, radiusBottom, height, material, segments = 28) {
    return new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  }
  // A joint is a cylinder lying on its side (axis along X) — the pin of a hinge
  function hingePin(radius, length, material) {
    const pin = cylinder(radius, radius, length, material);
    pin.rotation.z = Math.PI / 2;
    return pin;
  }

  /* ---------- Robot 1: six-axis robotic arm (hero) ---------- */
  function buildRoboticArm() {
    const arm = new THREE.Group();

    // Base plate and pedestal
    const plate = cylinder(1.5, 1.6, 0.25, materials.darkMetal, 48);
    plate.position.y = 0.125;
    arm.add(plate);

    // Turret: this part spins left/right
    const turret = new THREE.Group();
    turret.position.y = 0.25;
    arm.add(turret);

    const turretBody = cylinder(0.85, 1.0, 0.7, materials.metal);
    turretBody.position.y = 0.35;
    turret.add(turretBody);
    const turretRing = cylinder(0.9, 0.9, 0.08, materials.accent);
    turretRing.position.y = 0.72;
    turret.add(turretRing);

    // Shoulder joint: tilts the whole arm forward/back
    const shoulder = new THREE.Group();
    shoulder.position.y = 1.15;
    turret.add(shoulder);
    shoulder.add(hingePin(0.42, 1.25, materials.accent));

    const upperArm = box(0.5, 2.1, 0.5, materials.metal);
    upperArm.position.y = 1.05;
    shoulder.add(upperArm);
    const piston = cylinder(0.08, 0.08, 1.5, materials.light, 16);
    piston.position.set(0.38, 0.95, 0);
    shoulder.add(piston);

    // Elbow joint
    const elbow = new THREE.Group();
    elbow.position.y = 2.1;
    shoulder.add(elbow);
    elbow.add(hingePin(0.34, 0.95, materials.accent));

    const forearm = box(0.38, 1.8, 0.38, materials.metal);
    forearm.position.y = 0.9;
    elbow.add(forearm);

    // Wrist joint
    const wrist = new THREE.Group();
    wrist.position.y = 1.8;
    elbow.add(wrist);
    wrist.add(hingePin(0.24, 0.7, materials.accent));

    // Gripper: palm plus two fingers that open and close
    const palm = box(0.8, 0.22, 0.34, materials.darkMetal);
    palm.position.y = 0.2;
    wrist.add(palm);
    const fingerLeft = box(0.12, 0.6, 0.26, materials.light);
    const fingerRight = box(0.12, 0.6, 0.26, materials.light);
    fingerLeft.position.y = fingerRight.position.y = 0.6;
    wrist.add(fingerLeft, fingerRight);

    arm.position.y = -0.2;

    return {
      group: arm,
      // t = time in seconds; each joint swings on its own sine wave
      update(t) {
        turret.rotation.y = Math.sin(t * 0.5) * 0.7;
        shoulder.rotation.z = -0.35 + Math.sin(t * 0.8) * 0.25;
        elbow.rotation.z = 0.9 + Math.sin(t * 1.1 + 1) * 0.3;
        wrist.rotation.z = -0.5 + Math.sin(t * 1.4) * 0.3;
        const grip = 0.2 + (Math.sin(t * 2) + 1) * 0.08;
        fingerLeft.position.x = -grip;
        fingerRight.position.x = grip;
      },
    };
  }

  /* ---------- Robot 2: solar tracker + weather mast ---------- */
  function buildSolarTracker() {
    const station = new THREE.Group();

    const foot = cylinder(1.1, 1.2, 0.2, materials.darkMetal, 36);
    foot.position.y = 0.1;
    station.add(foot);

    const post = cylinder(0.14, 0.18, 1.6, materials.metal);
    post.position.y = 1.0;
    station.add(post);

    // Tilting solar panel on top of the post
    const tilt = new THREE.Group();
    tilt.position.set(-0.3, 1.9, 0);
    station.add(tilt);
    tilt.add(hingePin(0.12, 0.5, materials.accent));
    const panelBoard = box(2.6, 0.08, 1.7, materials.panel);
    panelBoard.position.y = 0.12;
    tilt.add(panelBoard);
    const frame = box(2.7, 0.05, 1.8, materials.light);
    frame.position.y = 0.07;
    tilt.add(frame);
    // Thin lines to look like solar cells
    for (let i = -2; i <= 2; i++) {
      const line = box(0.02, 0.01, 1.7, materials.light);
      line.position.set(i * 0.5, 0.17, 0);
      tilt.add(line);
    }

    // Weather mast with a sensor ball and a spinning anemometer
    const mast = cylinder(0.04, 0.05, 2.2, materials.light, 12);
    mast.position.set(1.7, 1.2, -0.3);
    station.add(mast);
    const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 20), materials.accent);
    sensor.position.set(1.7, 1.55, -0.3);
    station.add(sensor);

    const anemometer = new THREE.Group();
    anemometer.position.set(1.7, 2.35, -0.3);
    station.add(anemometer);
    for (let i = 0; i < 3; i++) {
      const arm = box(0.55, 0.03, 0.03, materials.light);
      arm.rotation.y = (i * Math.PI * 2) / 3;
      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), materials.accent);
      cup.position.set(Math.cos(arm.rotation.y) * -0.27, 0, Math.sin(arm.rotation.y) * 0.27);
      anemometer.add(arm, cup);
    }

    station.position.y = -0.4;

    return {
      group: station,
      update(t) {
        tilt.rotation.z = Math.sin(t * 0.6) * 0.55;   // the panel "follows the sun"
        anemometer.rotation.y = t * 3;
      },
    };
  }

  /* ---------- Robot 3: robotic hand moving a cursor on a screen ---------- */
  function buildGestureDemo() {
    const scene = new THREE.Group();

    // Monitor
    const monitor = box(3.2, 2, 0.12, materials.darkMetal);
    monitor.position.set(0, 1.9, -0.6);
    scene.add(monitor);
    const screen = box(3.0, 1.8, 0.04, materials.screen);
    screen.position.set(0, 1.9, -0.52);
    scene.add(screen);
    const stand = cylinder(0.1, 0.14, 0.7, materials.metal, 16);
    stand.position.set(0, 0.55, -0.6);
    scene.add(stand);
    const standBase = cylinder(0.7, 0.8, 0.08, materials.metal, 32);
    standBase.position.set(0, 0.2, -0.6);
    scene.add(standBase);

    // Cursor: a small orange cone on the screen
    const cursor = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 3), materials.accent);
    cursor.position.z = -0.45;
    scene.add(cursor);

    // Robotic hand in front of the screen
    const hand = new THREE.Group();
    hand.position.set(0, 0.7, 0.9);
    scene.add(hand);
    const palm = box(0.9, 0.2, 0.8, materials.metal);
    hand.add(palm);
    const wristBand = box(0.7, 0.18, 0.4, materials.accent);
    wristBand.position.z = 0.55;
    hand.add(wristBand);

    const fingers = [];
    for (let i = 0; i < 4; i++) {
      const knuckle = new THREE.Group();
      knuckle.position.set(-0.33 + i * 0.22, 0, -0.4);
      const segment = box(0.14, 0.14, 0.5, materials.light);
      segment.position.z = -0.25;
      knuckle.add(segment);
      hand.add(knuckle);
      fingers.push(knuckle);
    }
    const thumb = new THREE.Group();
    thumb.position.set(0.5, 0, 0.1);
    const thumbSegment = box(0.4, 0.13, 0.14, materials.light);
    thumbSegment.position.x = 0.2;
    thumb.add(thumbSegment);
    hand.add(thumb);

    scene.position.y = -0.7;

    return {
      group: scene,
      update(t) {
        // The hand and the cursor move together in a gentle loop
        const x = Math.sin(t * 0.9) * 0.9;
        const y = Math.cos(t * 0.7) * 0.4;
        hand.position.x = x * 0.7;
        hand.position.y = 0.9 + y * 0.4;
        cursor.position.x = x;
        cursor.position.y = 1.9 + y;
        fingers.forEach((finger, i) => {
          finger.rotation.x = -0.15 - (Math.sin(t * 1.6 + i * 0.5) + 1) * 0.25;
        });
        thumb.rotation.y = Math.sin(t * 1.6) * 0.25;
      },
    };
  }

  /* ---------- Robot 4: six-wheel rover ---------- */
  function buildRover() {
    const rover = new THREE.Group();

    const body = box(2.4, 0.6, 1.5, materials.metal);
    body.position.y = 0.85;
    rover.add(body);
    const stripe = box(2.42, 0.08, 1.52, materials.accent);
    stripe.position.y = 1.05;
    rover.add(stripe);

    // Solar panel on top
    const topPanel = box(2.0, 0.06, 1.2, materials.panel);
    topPanel.position.y = 1.3;
    rover.add(topPanel);

    // Sensor mast with a camera head that scans left/right
    const mast = cylinder(0.05, 0.06, 1.0, materials.light, 12);
    mast.position.set(0.7, 1.85, 0);
    rover.add(mast);
    const head = new THREE.Group();
    head.position.set(0.7, 2.4, 0);
    rover.add(head);
    head.add(box(0.5, 0.25, 0.3, materials.darkMetal));
    const lens = cylinder(0.07, 0.07, 0.12, materials.glow, 16);
    lens.rotation.z = Math.PI / 2;
    lens.position.x = 0.28;
    head.add(lens);

    // Six wheels: three on each side
    const wheels = [];
    const wheelX = [-0.9, 0, 0.9];
    [-1, 1].forEach((side) => {
      wheelX.forEach((x) => {
        const wheel = new THREE.Group();
        wheel.position.set(x, 0.42, side * 0.95);
        const tire = cylinder(0.42, 0.42, 0.3, materials.darkMetal, 28);
        tire.rotation.x = Math.PI / 2;           // lay the tyre on its side (axle along Z)
        const hub = cylinder(0.16, 0.16, 0.34, materials.accent, 16);
        hub.rotation.x = Math.PI / 2;
        wheel.add(tire, hub);
        rover.add(wheel);
        wheels.push(wheel);
        // Link bar from body to wheel
        const bar = box(0.1, 0.1, 0.5, materials.light);
        bar.position.set(x, 0.62, side * 0.72);
        rover.add(bar);
      });
    });

    rover.position.y = -0.5;

    return {
      group: rover,
      update(t) {
        wheels.forEach((wheel) => { wheel.rotation.z = -t * 3; });
        head.rotation.y = Math.sin(t * 1.2) * 0.9;
        rover.position.y = -0.5 + Math.sin(t * 6) * 0.01;   // tiny bump from driving
      },
    };
  }

  // Which builder and camera each data-model uses
  const modelSetup = {
    arm:     { build: buildRoboticArm,   camera: { position: [5.2, 3.6, 7],   lookAt: [0, 2.0, 0], fov: 38 } },
    solar:   { build: buildSolarTracker, camera: { position: [4.6, 3.2, 5.6], lookAt: [0.2, 1.4, 0], fov: 40 } },
    gesture: { build: buildGestureDemo,  camera: { position: [3.6, 2.6, 5.6], lookAt: [0, 1.3, 0], fov: 40 } },
    rover:   { build: buildRover,        camera: { position: [4.2, 2.8, 5],   lookAt: [0, 1.0, 0], fov: 40 } },
  };

  /* ---------- Viewer: sets up one canvas ---------- */
  const viewers = [];

  function createViewer(element) {
    const canvas = element.querySelector("canvas");
    const setup = modelSetup[element.dataset.model];
    if (!canvas || !setup) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (error) {
      element.classList.add("no-webgl");   // WebGL not available on this device
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);   // transparent, so the glass shows through

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(setup.camera.fov, 1, 0.1, 100);
    camera.position.set(...setup.camera.position);
    camera.lookAt(new THREE.Vector3(...setup.camera.lookAt));

    // Lights: soft fill, white key light, orange and blue rim lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(4, 8, 5);
    scene.add(key);
    const orangeRim = new THREE.PointLight(0xff6a00, 1.4, 30);
    orangeRim.position.set(-5, 3, -2);
    scene.add(orangeRim);
    const blueRim = new THREE.PointLight(0x3a6bff, 0.9, 30);
    blueRim.position.set(5, 2, -5);
    scene.add(blueRim);

    // Glowing ring on the floor
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.9, 2.96, 80), materials.glow);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.62;
    scene.add(ring);

    // "pivot" is what the user rotates by dragging
    const pivot = new THREE.Group();
    const model = setup.build();
    pivot.add(model.group);
    scene.add(pivot);

    const viewer = { element, canvas, renderer, scene, camera, pivot, model, isVisible: false, needsRender: true, isDragging: false };
    viewers.push(viewer);

    // Resize with the container
    function resize() {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      viewer.needsRender = true;
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(element);
    window.addEventListener("resize", resize);
    resize();

    // Only animate viewers that are on screen (saves battery)
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        viewer.isVisible = entries[0].isIntersecting;
      }).observe(element);
    } else {
      viewer.isVisible = true;
    }

    // Drag to rotate (mouse, touch and pen)
    let lastX = 0;
    canvas.addEventListener("pointerdown", (event) => {
      viewer.isDragging = true;
      lastX = event.clientX;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!viewer.isDragging) return;
      pivot.rotation.y += (event.clientX - lastX) * 0.01;
      lastX = event.clientX;
      viewer.needsRender = true;
    });
    const stopDragging = () => { viewer.isDragging = false; };
    canvas.addEventListener("pointerup", stopDragging);
    canvas.addEventListener("pointercancel", stopDragging);

    // Keyboard: left and right arrows rotate (for keyboard users)
    canvas.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { pivot.rotation.y -= 0.15; viewer.needsRender = true; event.preventDefault(); }
      if (event.key === "ArrowRight") { pivot.rotation.y += 0.15; viewer.needsRender = true; event.preventDefault(); }
    });

    // Reduced motion: show one nice still pose instead of animating
    if (prefersReducedMotion) model.update(2);
  }

  viewerElements.forEach(createViewer);

  /* ---------- One loop for all viewers ---------- */
  function animate(now) {
    const seconds = now / 1000;
    viewers.forEach((viewer) => {
      if (!viewer.isVisible) return;

      if (!prefersReducedMotion) {
        viewer.model.update(seconds);
        if (!viewer.isDragging) viewer.pivot.rotation.y += 0.002;   // slow auto-turn
      } else if (!viewer.needsRender) {
        return;                                                      // nothing changed
      }

      viewer.renderer.render(viewer.scene, viewer.camera);
      viewer.needsRender = false;
    });
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
})();
