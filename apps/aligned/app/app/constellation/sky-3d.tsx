"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import type { PlacedExtra, SkyLayout, SkyStar } from "@/lib/sky-layout";
import type { CouplePalette } from "@/lib/couple-colors";

/**
 * The couple's sky in three dimensions. Every day is a star; every month a
 * constellation; older months recede into depth. three.js is imported only
 * here, so it never weighs on the rest of the app.
 */

export type Sky3DHandle = {
  /** Fly the camera to a month (0 = newest). */
  flyToMonth: (index: number) => void;
  /** Pull back to see everything. */
  flyOverview: () => void;
};

export type Comet = { id: string; openOn: string };

type Props = {
  layout: SkyLayout;
  /** Sealed time capsules, drawn as comets ahead of the newest month. */
  comets?: Comet[];
  onSelectComet?: (id: string) => void;
  /** Constellation names by month key. */
  names?: Record<string, string>;
  onSelectExtra?: (extra: PlacedExtra) => void;
  palette: CouplePalette;
  /** Session id of a star to ignite on arrival (just revealed). */
  bornId?: string | null;
  onSelect: (star: SkyStar | null) => void;
  onBorn?: () => void;
  /** Called if WebGL can't start, so the page can fall back to the flat sky. */
  onUnsupported: () => void;
};

const VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aTwinkle;
  attribute float aScale;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = aTwinkle > 0.5 ? 0.55 + 0.45 * sin(uTime * 2.2 + aPhase) : 0.88 + 0.12 * sin(uTime * 0.9 + aPhase);
    vAlpha = tw;
    vColor = aColor;
    gl_PointSize = aSize * aScale * uPixelRatio * (260.0 / -mv.z);
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.16, 0.0, d);
    float glow = exp(-d * d * 22.0);
    float a = (core + glow * 0.55) * vAlpha;
    gl_FragColor = vec4(vColor * (0.7 + core * 0.6), a);
  }
`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const Sky3D = forwardRef<Sky3DHandle, Props>(function Sky3D(
  { layout, comets = [], onSelectComet, names = {}, onSelectExtra, palette, bornId, onSelect, onBorn, onUnsupported },
  ref
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const api = useRef<Sky3DHandle>({ flyToMonth: () => {}, flyOverview: () => {} });
  const cb = useRef({ onSelect, onBorn, onUnsupported, onSelectComet, onSelectExtra });
  cb.current = { onSelect, onBorn, onUnsupported, onSelectComet, onSelectExtra };

  useImperativeHandle(ref, () => ({
    flyToMonth: (i) => api.current.flyToMonth(i),
    flyOverview: () => api.current.flyOverview(),
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (disposed) return;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
      } catch {
        cb.current.onUnsupported();
        return;
      }
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pixelRatio);
      renderer.setClearColor(0x050b14, 1);
      host.appendChild(renderer.domElement);
      renderer.domElement.style.display = "block";
      renderer.domElement.style.touchAction = "none";

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050b14, 0.0042);
      const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.55;
      controls.zoomSpeed = 0.8;
      controls.enablePan = false;
      controls.minDistance = 6;
      controls.maxDistance = 120 + layout.months.length * 40;

      const uniforms = { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio } };
      const makeMaterial = () =>
        new THREE.ShaderMaterial({
          uniforms,
          vertexShader: VERT,
          fragmentShader: FRAG,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });

      // ── distant dust ─────────────────────────────────────────────
      const dustCount = 1400;
      const depth = Math.max(layout.months.length, 1) * 70 + 300;
      const dust = new THREE.BufferGeometry();
      const dp = new Float32Array(dustCount * 3);
      const dc = new Float32Array(dustCount * 3);
      const ds = new Float32Array(dustCount);
      const dt = new Float32Array(dustCount);
      const dsc = new Float32Array(dustCount).fill(1);
      const dph = new Float32Array(dustCount);
      for (let i = 0; i < dustCount; i++) {
        dp[i * 3] = (Math.random() - 0.5) * 520;
        dp[i * 3 + 1] = (Math.random() - 0.5) * 360;
        dp[i * 3 + 2] = 120 - Math.random() * depth;
        const warm = Math.random() < 0.15;
        dc.set(warm ? [1, 0.82, 0.68] : [0.75, 0.82, 1], i * 3);
        ds[i] = 0.6 + Math.random() * 1.2;
        dph[i] = Math.random() * 6.28;
      }
      dust.setAttribute("position", new THREE.BufferAttribute(dp, 3));
      dust.setAttribute("aColor", new THREE.BufferAttribute(dc, 3));
      dust.setAttribute("aSize", new THREE.BufferAttribute(ds, 1));
      dust.setAttribute("aTwinkle", new THREE.BufferAttribute(dt, 1));
      dust.setAttribute("aScale", new THREE.BufferAttribute(dsc, 1));
      dust.setAttribute("aPhase", new THREE.BufferAttribute(dph, 1));
      const dustPoints = new THREE.Points(dust, makeMaterial());
      scene.add(dustPoints);

      // ── the couple's stars ───────────────────────────────────────
      const n = layout.stars.length;
      const pos = new Float32Array(n * 3);
      const col = new Float32Array(n * 3);
      const size = new Float32Array(n);
      const twinkle = new Float32Array(n);
      const scale = new Float32Array(n).fill(1);
      const phase = new Float32Array(n);
      const cream: [number, number, number] = [1, 0.95, 0.88];
      const warm = hexToRgb(palette.secondary);
      const cool = hexToRgb(palette.primary).map((c) => Math.min(1, c * 1.8 + 0.15)) as [number, number, number];
      const gold: [number, number, number] = [1, 0.82, 0.45];
      let bornIndex = -1;
      layout.stars.forEach((s, i) => {
        pos.set([s.x, s.y, s.z], i * 3);
        const c =
          s.milestone ? cool : s.aligned === "deeplyAligned" || s.aligned === "aligned" ? warm : cream;
        col.set(c, i * 3);
        size[i] = s.milestone ? 9 : s.aligned === "deeplyAligned" ? 8 : s.aligned === "aligned" ? 6.5 : 4.6;
        twinkle[i] = s.saved ? 1 : 0;
        phase[i] = (i * 2.399) % 6.28;
        if (s.id === bornId) {
          bornIndex = i;
          scale[i] = 0;
        }
      });
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      starGeo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
      starGeo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
      starGeo.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkle, 1));
      const scaleAttr = new THREE.BufferAttribute(scale, 1);
      starGeo.setAttribute("aScale", scaleAttr);
      starGeo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
      const starPoints = new THREE.Points(starGeo, makeMaterial());
      scene.add(starPoints);

      // Golden weeks: a soft gold halo behind the star.
      const goldIdx = layout.stars.map((s, i) => (s.golden ? i : -1)).filter((i) => i >= 0);
      if (goldIdx.length) {
        const g = new THREE.BufferGeometry();
        const gp = new Float32Array(goldIdx.length * 3);
        const gc = new Float32Array(goldIdx.length * 3);
        goldIdx.forEach((si, k) => {
          gp.set([pos[si * 3]!, pos[si * 3 + 1]!, pos[si * 3 + 2]! - 0.2], k * 3);
          gc.set(gold.map((v) => v * 0.55), k * 3);
        });
        g.setAttribute("position", new THREE.BufferAttribute(gp, 3));
        g.setAttribute("aColor", new THREE.BufferAttribute(gc, 3));
        g.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(goldIdx.length).fill(16), 1));
        g.setAttribute("aTwinkle", new THREE.BufferAttribute(new Float32Array(goldIdx.length), 1));
        g.setAttribute("aScale", new THREE.BufferAttribute(new Float32Array(goldIdx.length).fill(1), 1));
        g.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(goldIdx.length), 1));
        scene.add(new THREE.Points(g, makeMaterial()));
      }

      // Constellation paths: each month's days joined in order.
      const lp = new Float32Array(layout.paths.length * 6);
      layout.paths.forEach(([a, b], k) => {
        lp.set([pos[a * 3]!, pos[a * 3 + 1]!, pos[a * 3 + 2]!, pos[b * 3]!, pos[b * 3 + 1]!, pos[b * 3 + 2]!], k * 6);
      });
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute("position", new THREE.BufferAttribute(lp, 3));
      const lines = new THREE.LineSegments(
        lineGeo,
        new THREE.LineBasicMaterial({ color: new THREE.Color(...warm), transparent: true, opacity: 0.22, depthWrite: false })
      );
      scene.add(lines);

      // Month names float above each constellation.
      const labels: import("three").Sprite[] = [];
      for (const m of layout.months) {
        const c = document.createElement("canvas");
        c.width = 512;
        c.height = 96;
        const ctx = c.getContext("2d")!;
        ctx.textAlign = "center";
        const given = names[m.key];
        if (given) {
          ctx.font = "italic 600 42px Georgia, serif";
          ctx.fillStyle = "rgba(255,217,168,0.95)";
          ctx.fillText(given, 256, 46, 500);
          ctx.font = "600 22px Georgia, serif";
          ctx.fillStyle = "rgba(245,239,227,0.6)";
          ctx.fillText(m.label.toUpperCase().split("").join(String.fromCharCode(8202)), 256, 84);
        } else {
          ctx.font = "600 40px Georgia, serif";
          ctx.fillStyle = "rgba(245,239,227,0.82)";
          ctx.fillText(m.label.toUpperCase().split("").join(String.fromCharCode(8202)), 256, 60);
        }
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.85 })
        );
        sprite.scale.set(22, 4.1, 1);
        sprite.position.set(m.center.x, m.center.y + 19, m.center.z);
        scene.add(sprite);
        labels.push(sprite);
      }

      // Appreciations glow rose; completed dares are shooting stars.
      const ex = layout.extras;
      let extraPoints: import("three").Points | null = null;
      const dareRuns: { from: import("three").Vector3; to: import("three").Vector3; offset: number }[] = [];
      let dareHeads: import("three").BufferAttribute | null = null;
      if (ex.length) {
        const ep = new Float32Array(ex.length * 3);
        const ec = new Float32Array(ex.length * 3);
        const es = new Float32Array(ex.length);
        const streak = new Float32Array(ex.length * 6);
        const streakCol = new Float32Array(ex.length * 6);
        ex.forEach((e, k) => {
          ep.set([e.x, e.y, e.z], k * 3);
          if (e.kind === "appreciation") {
            ec.set([0.95, 0.55, 0.66], k * 3);
            es[k] = 6.5;
          } else {
            ec.set([1, 0.92, 0.75], k * 3);
            es[k] = 5.5;
            const to = new THREE.Vector3(e.x - 10, e.y - 5, e.z + 3);
            streak.set([e.x, e.y, e.z, to.x, to.y, to.z], k * 6);
            streakCol.set([0.9, 0.82, 0.62, 0, 0, 0], k * 6);
            dareRuns.push({ from: new THREE.Vector3(e.x + 10, e.y + 5, e.z - 3), to, offset: (k * 1.7) % 7 });
          }
        });
        const eg = new THREE.BufferGeometry();
        eg.setAttribute("position", new THREE.BufferAttribute(ep, 3));
        eg.setAttribute("aColor", new THREE.BufferAttribute(ec, 3));
        eg.setAttribute("aSize", new THREE.BufferAttribute(es, 1));
        eg.setAttribute("aTwinkle", new THREE.BufferAttribute(new Float32Array(ex.length), 1));
        eg.setAttribute("aScale", new THREE.BufferAttribute(new Float32Array(ex.length).fill(1), 1));
        eg.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(ex.length).map((_, i) => i * 2.1), 1));
        extraPoints = new THREE.Points(eg, makeMaterial());
        scene.add(extraPoints);
        const sg = new THREE.BufferGeometry();
        sg.setAttribute("position", new THREE.BufferAttribute(streak, 3));
        sg.setAttribute("color", new THREE.BufferAttribute(streakCol, 3));
        scene.add(
          new THREE.LineSegments(
            sg,
            new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
          )
        );
        if (dareRuns.length) {
          // A bright head races along each dare's streak every few seconds.
          const hg = new THREE.BufferGeometry();
          dareHeads = new THREE.BufferAttribute(new Float32Array(dareRuns.length * 3), 3);
          hg.setAttribute("position", dareHeads);
          hg.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(dareRuns.length * 3).fill(1), 3));
          hg.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(dareRuns.length).fill(7), 1));
          hg.setAttribute("aTwinkle", new THREE.BufferAttribute(new Float32Array(dareRuns.length), 1));
          hg.setAttribute("aScale", new THREE.BufferAttribute(new Float32Array(dareRuns.length).fill(1), 1));
          hg.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(dareRuns.length), 1));
          scene.add(new THREE.Points(hg, makeMaterial()));
        }
      }

      // Sealed time capsules: comets hanging just ahead of "now".
      const front = layout.months[0]?.center ?? { x: 0, y: 0, z: 0 };
      let cometPoints: import("three").Points | null = null;
      if (comets.length) {
        const cp = new Float32Array(comets.length * 3);
        const tail = new Float32Array(comets.length * 6);
        const tailCol = new Float32Array(comets.length * 6);
        comets.forEach((c, k) => {
          // Up and to the side of the newest month, inside the default view.
          const x = front.x - 9 + ((k * 7) % 21);
          const y = front.y + 12 + (k % 2) * 4;
          const z = front.z + 4 - k * 3;
          cp.set([x, y, z], k * 3);
          tail.set([x, y, z, x + 9, y + 5, z - 12], k * 6);
          tailCol.set([0.75, 0.85, 1, 0, 0, 0], k * 6);
        });
        const cg = new THREE.BufferGeometry();
        cg.setAttribute("position", new THREE.BufferAttribute(cp, 3));
        cg.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(comets.length * 3).fill(0.9), 3));
        cg.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(comets.length).fill(10), 1));
        cg.setAttribute("aTwinkle", new THREE.BufferAttribute(new Float32Array(comets.length).fill(1), 1));
        cg.setAttribute("aScale", new THREE.BufferAttribute(new Float32Array(comets.length).fill(1), 1));
        cg.setAttribute("aPhase", new THREE.BufferAttribute(new Float32Array(comets.length).map((_, i) => i * 1.7), 1));
        cometPoints = new THREE.Points(cg, makeMaterial());
        scene.add(cometPoints);
        const tg = new THREE.BufferGeometry();
        tg.setAttribute("position", new THREE.BufferAttribute(tail, 3));
        tg.setAttribute("color", new THREE.BufferAttribute(tailCol, 3));
        scene.add(
          new THREE.LineSegments(
            tg,
            new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
          )
        );
      }

      // ── camera choreography ──────────────────────────────────────
      const V = THREE.Vector3;
      const viewFor = (c: { x: number; y: number; z: number }, dist = 46) => ({
        target: new V(c.x, c.y, c.z),
        position: new V(c.x, c.y + 6, c.z + dist),
      });
      let flight: null | { from: { p: import("three").Vector3; t: import("three").Vector3 }; to: { position: import("three").Vector3; target: import("three").Vector3 }; start: number; dur: number } = null;
      const fly = (to: { position: import("three").Vector3; target: import("three").Vector3 }, dur = 1100) => {
        flight = { from: { p: camera.position.clone(), t: controls.target.clone() }, to, start: performance.now(), dur };
      };
      const newest = layout.months[0]?.center ?? { x: 0, y: 0, z: 0 };
      const home = viewFor(newest);

      api.current = {
        flyToMonth: (i) => {
          const m = layout.months[i];
          if (m) fly(viewFor(m.center));
        },
        flyOverview: () => {
          const last = layout.months[layout.months.length - 1]?.center ?? newest;
          const mid = { x: (newest.x + last.x) / 2, y: (newest.y + last.y) / 2, z: (newest.z + last.z) / 2 };
          fly({ target: new V(mid.x, mid.y, mid.z), position: new V(mid.x + 70, mid.y + 40, newest.z + 90) }, 1500);
        },
      };

      // Star birth: start low and far, rise into place, then ignite.
      const birth = bornIndex >= 0 ? { start: performance.now() + 1500, fired: false } : null;
      if (birth) {
        const s = layout.stars[bornIndex]!;
        const near = { x: s.x, y: s.y, z: s.z };
        camera.position.set(near.x, near.y - 40, near.z + 110);
        controls.target.set(near.x, near.y - 10, near.z);
        fly({ target: new V(near.x, near.y, near.z), position: new V(near.x, near.y + 4, near.z + 30) }, 2200);
      } else {
        camera.position.copy(home.position);
        controls.target.copy(home.target);
      }

      // ── picking ──────────────────────────────────────────────────
      const raycaster = new THREE.Raycaster();
      raycaster.params.Points = { threshold: 1.6 };
      const ndc = new THREE.Vector2();
      let down: { x: number; y: number } | null = null;
      const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
      const onUp = (e: PointerEvent) => {
        if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
        const r = renderer.domElement.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        if (cometPoints) {
          const ch = raycaster.intersectObject(cometPoints);
          if (ch.length) {
            cb.current.onSelect(null);
            cb.current.onSelectComet?.(comets[ch[0]!.index!]!.id);
            return;
          }
        }
        if (extraPoints) {
          const eh = raycaster.intersectObject(extraPoints);
          if (eh.length) {
            eh.sort((a, b) => (a.distanceToRay ?? 0) - (b.distanceToRay ?? 0));
            const e = ex[eh[0]!.index!]!;
            cb.current.onSelect(null);
            cb.current.onSelectExtra?.(e);
            fly({ target: new V(e.x, e.y, e.z), position: new V(e.x, e.y + 3, e.z + 22) }, 900);
            return;
          }
        }
        const hits = raycaster.intersectObject(starPoints);
        if (!hits.length) {
          cb.current.onSelect(null);
          return;
        }
        // Nearest to the ray, not nearest to the camera: small stars are hard to tap.
        hits.sort((a, b) => (a.distanceToRay ?? 0) - (b.distanceToRay ?? 0));
        const star = layout.stars[hits[0]!.index!]!;
        cb.current.onSelect(star);
        fly({ target: new V(star.x, star.y, star.z), position: new V(star.x, star.y + 3, star.z + 22) }, 900);
      };
      renderer.domElement.addEventListener("pointerdown", onDown);
      renderer.domElement.addEventListener("pointerup", onUp);

      // ── sizing + loop ────────────────────────────────────────────
      const resize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        renderer.setSize(w, h, false);
        renderer.domElement.style.width = w + "px";
        renderer.domElement.style.height = h + "px";
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      const t0 = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick);
        uniforms.uTime.value = (now - t0) / 1000;
        if (flight) {
          const p = Math.min((now - flight.start) / flight.dur, 1);
          const e = ease(p);
          camera.position.lerpVectors(flight.from.p, flight.to.position, e);
          controls.target.lerpVectors(flight.from.t, flight.to.target, e);
          if (p >= 1) flight = null;
        }
        if (birth && now >= birth.start) {
          const p = Math.min((now - birth.start) / 1300, 1);
          // Overshoot then settle: a flare, not a fade.
          scale[bornIndex] = p < 0.45 ? (p / 0.45) * 2.4 : 2.4 - ((p - 0.45) / 0.55) * 1.2;
          scaleAttr.needsUpdate = true;
          if (!birth.fired && p > 0.3) {
            birth.fired = true;
            cb.current.onBorn?.();
          }
        }
        if (dareHeads) {
          const t = (now - t0) / 1000;
          dareRuns.forEach((r, i) => {
            const p = ((t + r.offset) % 7) / 0.9; // a 0.9s dash every 7s
            const v = p < 1 ? r.from.clone().lerp(r.to, p) : r.to;
            const hidden = p >= 1 ? -9999 : 0;
            dareHeads!.setXYZ(i, v.x, v.y + hidden, v.z);
          });
          dareHeads.needsUpdate = true;
        }
        // Labels fade as you fly through them.
        for (const l of labels) {
          const d = camera.position.distanceTo(l.position);
          (l.material as import("three").SpriteMaterial).opacity = Math.min(0.85, Math.max(0, (d - 14) / 40));
        }
        controls.update();
        renderer.render(scene, camera);
      };
      raf = requestAnimationFrame(tick);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.domElement.removeEventListener("pointerdown", onDown);
        renderer.domElement.removeEventListener("pointerup", onUp);
        controls.dispose();
        scene.traverse((o) => {
          const obj = o as import("three").Mesh;
          obj.geometry?.dispose();
          const m = obj.material as import("three").Material | undefined;
          if (m) {
            (m as import("three").SpriteMaterial).map?.dispose();
            m.dispose();
          }
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
      if (disposed) cleanup();
    })().catch(() => cb.current.onUnsupported());

    return () => {
      disposed = true;
      cleanup();
    };
    // comets keyed by content so an equal re-render doesn't rebuild the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, palette, bornId, JSON.stringify(comets), JSON.stringify(names)]);

  return <div ref={hostRef} className="absolute inset-0" />;
});
