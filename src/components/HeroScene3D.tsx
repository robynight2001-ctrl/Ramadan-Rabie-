import {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

interface HeroScene3DProps {
  enabled: boolean;
}

const _targetMouse = new THREE.Vector2(0, 0);

export function HeroScene3D({enabled}: HeroScene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;

    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x08090d, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.2, 8.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    // 3-point lighting with warm/cool contrast
    const hemiLight = new THREE.HemisphereLight(0xa855f7, 0x08090d, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xf5f5f7, 2.2);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x8b5cf6, 14, 22);
    rimLight.position.set(-4.5, -2.5, 3);
    scene.add(rimLight);

    const violetAccent = new THREE.PointLight(0xa855f7, 10, 18);
    violetAccent.position.set(3.5, 2.5, -2);
    scene.add(violetAccent);

    // Composite 3D assembly (positioned slightly right on desktop, centered subtly behind)
    const assembly = new THREE.Group();
    assembly.position.set(isMobile ? 0 : 1.75, isMobile ? 0.4 : 0.1, 0);
    scene.add(assembly);

    // 1. Inner faceted dark obsidian core
    const coreGeo = new THREE.IcosahedronGeometry(1.12, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x11131b,
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.12,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    assembly.add(coreMesh);

    // 2. Wireframe harmonic lattice shell
    const latticeGeo = new THREE.IcosahedronGeometry(1.42, 1);
    const latticeMat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      emissive: 0x5b21b6,
      emissiveIntensity: 0.55,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      roughness: 0.4,
      metalness: 0.6,
    });
    const latticeMesh = new THREE.Mesh(latticeGeo, latticeMat);
    assembly.add(latticeMesh);

    // 3. Three precision orbital rings with varied metallic roughness
    const ring1Geo = new THREE.TorusGeometry(1.95, 0.018, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.2,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.set(Math.PI * 0.34, Math.PI * 0.12, 0);
    assembly.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(2.38, 0.012, 16, 110);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      metalness: 0.9,
      roughness: 0.45,
      transparent: true,
      opacity: 0.55,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.set(-Math.PI * 0.28, Math.PI * 0.35, 0.2);
    assembly.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(2.85, 0.01, 14, 120);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0x8b5cf6,
      metalness: 0.7,
      roughness: 0.35,
      transparent: true,
      opacity: 0.32,
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.set(Math.PI * 0.15, -Math.PI * 0.22, 0.5);
    assembly.add(ring3);

    // 4. Instanced orbiting micro-nodes (24 instances)
    const nodeCount = 24;
    const nodeGeo = new THREE.OctahedronGeometry(0.045, 0);
    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f7,
      emissive: 0xa855f7,
      emissiveIntensity: 0.9,
      metalness: 0.8,
      roughness: 0.2,
    });
    const nodesInstanced = new THREE.InstancedMesh(nodeGeo, nodeMat, nodeCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = i % 2 === 0 ? 1.95 : 2.38;
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      dummy.scale.setScalar(i % 3 === 0 ? 1.25 : 0.85);
      dummy.updateMatrix();
      nodesInstanced.setMatrixAt(i, dummy.matrix);
    }
    nodesInstanced.instanceMatrix.needsUpdate = true;
    nodesInstanced.computeBoundingSphere();
    ring1.add(nodesInstanced);

    // 5. Subtle background particle field (radial glow canvas texture)
    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 64;
    particleCanvas.height = 64;
    const pCtx = particleCanvas.getContext('2d');
    if (pCtx) {
      const grad = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(245, 245, 247, 1)');
      grad.addColorStop(0.35, 'rgba(168, 85, 247, 0.55)');
      grad.addColorStop(1, 'rgba(8, 9, 13, 0)');
      pCtx.fillStyle = grad;
      pCtx.fillRect(0, 0, 64, 64);
    }
    const particleTex = new THREE.CanvasTexture(particleCanvas);
    particleTex.colorSpace = THREE.SRGBColorSpace;

    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1.5;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.09,
      map: particleTex,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onPointerMove = (e: PointerEvent) => {
      _targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      _targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('pointermove', onPointerMove, {passive: true});

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
      const mobileNow = window.innerWidth < 768;
      assembly.position.set(mobileNow ? 0 : 1.75, mobileNow ? 0.4 : 0.1, 0);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let frameId = 0;
    let disposed = false;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null;
      gl.flush();
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const poll = () => {
        if (disposed) return;
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      if (!reducedMotion) {
        coreMesh.rotation.y += delta * 0.22;
        coreMesh.rotation.x += delta * 0.1;
        latticeMesh.rotation.y -= delta * 0.15;
        ring1.rotation.z += delta * 0.18;
        ring2.rotation.z -= delta * 0.12;
        ring3.rotation.y += delta * 0.08;
        particles.rotation.y = elapsed * 0.015;
        assembly.position.y = (window.innerWidth < 768 ? 0.4 : 0.1) + Math.sin(elapsed * 0.85) * 0.12;
      }

      // Smooth exponential damping parallax toward pointer
      assembly.rotation.y = THREE.MathUtils.damp(assembly.rotation.y, _targetMouse.x * 0.28, 3.2, delta);
      assembly.rotation.x = THREE.MathUtils.damp(assembly.rotation.x, -_targetMouse.y * 0.2, 3.2, delta);

      renderer.render(scene, camera);

      if (reducedMotion) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);

      coreGeo.dispose();
      coreMat.dispose();
      latticeGeo.dispose();
      latticeMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      ring3Geo.dispose();
      ring3Mat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTex.dispose();
      envTarget.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-90"
      aria-hidden="true"
    />
  );
}
