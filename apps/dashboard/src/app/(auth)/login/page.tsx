"use client";

import * as React from "react";
import { useState, useRef, useEffect, FormEvent, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { register, forgotPassword, resetPassword } from "@/actions/auth";
import NavBar from "@/components/NavBar";

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { Renderer, Program, Mesh, Color, Triangle } from "ogl";

// --- WebGL Shaders & Component ---
const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform float uFlowSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseAttraction;
uniform float uPulseIntensity;
uniform float uWebComplexity;
uniform float uAttractionStrength;
uniform float uMouseActiveFactor;
uniform float uEnergyFlow;
uniform bool uTransparent;
uniform float uBrightness;
varying vec2 vUv;
#define NUM_LAYERS 3.0
#define PI 3.14159265359
float Hash21(vec2 p) {
  p = fract(p * vec2(234.67, 891.23));
  p += dot(p, p + 56.78);
  return fract(p.x * p.y);
}
float Hash11(float p) {
  p = fract(p * 345.23);
  p += p * p;
  return fract(p);
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(Hash21(i + vec2(0.0,0.0)), Hash21(i + vec2(1.0,0.0)), u.x), mix(Hash21(i + vec2(0.0,1.0)), Hash21(i + vec2(1.0,1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for(int i = 0; i < 4; i++) {
    value += amplitude * noise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return value;
}
vec2 curl(vec2 p) {
  float eps = 0.01;
  float n1 = fbm(p + vec2(eps, 0.0));
  float n2 = fbm(p - vec2(eps, 0.0));
  float n3 = fbm(p + vec2(0.0, eps));
  float n4 = fbm(p - vec2(0.0, eps));
  return vec2(n4 - n3, n1 - n2) / (2.0 * eps);
}
float PlasmaNode(vec2 uv, vec2 offset, float seed, float time) {
  vec2 nodePos = offset;
  nodePos += 0.3 * sin(time * 0.5 + seed * 6.28) * vec2(cos(seed * 12.34), sin(seed * 23.45));
  float dist = length(uv - nodePos);
  float pulse = sin(time * 2.0 + seed * 10.0) * 0.5 + 0.5;
  float intensity = (0.02 + 0.01 * pulse) / (dist + 0.01);
  return intensity * smoothstep(0.8, 0.0, dist);
}
vec3 PlasmaWeb(vec2 uv) {
  vec3 col = vec3(0.0);
  float time = uTime * uSpeed;
  vec2 flow = curl(uv * 2.0 + time * 0.1);
  uv += flow * uEnergyFlow * 0.1;
  vec2 gridSize = vec2(4.0 * uDensity, 3.0 * uDensity);
  vec2 grid = uv * gridSize;
  vec2 gridId = floor(grid);
  vec2 gridUv = fract(grid) - 0.5;
  for(int y = -1; y <= 1; y++) {
    for(int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 nodeId = gridId + offset;
      float seed = Hash21(nodeId);
      vec2 nodeOffset = vec2(Hash21(nodeId + 1.0), Hash21(nodeId + 2.0)) - 0.5;
      nodeOffset *= 0.8;
      float node = PlasmaNode(gridUv, offset + nodeOffset, seed, time);
      float hue = Hash21(nodeId + 3.0) + uHueShift / 360.0 + time * 0.05;
      hue = fract(hue);
      vec3 nodeColor = hsv2rgb(vec3(hue, uSaturation, uBrightness));
      col += node * nodeColor;
    }
  }
  float streamNoise = fbm(uv * 8.0 + time * 0.2);
  float streams = smoothstep(0.3, 0.7, streamNoise);
  streams *= smoothstep(0.0, 0.1, sin(uv.x * 15.0 + time)) * 0.3;
  streams += smoothstep(0.0, 0.1, sin(uv.y * 12.0 + time * 1.2)) * 0.3;
  float streamHue = fract(uHueShift / 360.0 + 0.5 + time * 0.03);
  vec3 streamColor = hsv2rgb(vec3(streamHue, uSaturation * 0.8, uBrightness * 0.6));
  col += streams * streamColor * uGlowIntensity;
  vec2 particleUv = uv * 20.0 + time * vec2(0.5, 0.3);
  float particles = 0.0;
  for(int i = 0; i < 3; i++) {
    vec2 pid = floor(particleUv + float(i) * 123.45);
    float pseed = Hash21(pid);
    if(pseed > 0.85) {
      vec2 ppos = fract(particleUv + float(i) * 123.45) - 0.5;
      ppos += 0.3 * sin(time + pseed * 20.0) * vec2(cos(pseed * 15.0), sin(pseed * 18.0));
      float pdist = length(ppos);
      float particle = (0.005 * uGlowIntensity) / (pdist + 0.001);
      particle *= smoothstep(0.3, 0.0, pdist);
      float particleHue = fract(pseed + uHueShift / 360.0 + time * 0.1);
      vec3 particleColor = hsv2rgb(vec3(particleHue, uSaturation, uBrightness));
      particles += particle;
    }
  }
  col += particles * hsv2rgb(vec3(fract(uHueShift / 360.0 + 0.8), uSaturation, uBrightness));
  return col;
}
void main() {
  vec2 focalPx = uFocal * uResolution.xy;
  vec2 uv = (vUv * uResolution.xy - focalPx) / uResolution.y;
  if(uMouseAttraction && uMouseActiveFactor > 0.0) {
    vec2 mousePosUV = (uMouse * uResolution.xy - focalPx) / uResolution.y;
    vec2 toMouse = mousePosUV - uv;
    float mouseDist = length(toMouse);
    vec2 attraction = normalize(toMouse) * (uAttractionStrength / (mouseDist * mouseDist + 1.0));
    uv += attraction * 0.1 * uMouseActiveFactor;
  }
  vec3 col = vec3(0.0);
  for(float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYERS) {
    float depth = i + 0.5;
    float scale = mix(1.0, 2.0, depth);
    float fade = (1.0 - depth * depth) * 0.8;
    vec3 layerCol = PlasmaWeb(uv * scale + i * 100.0);
    col += layerCol * fade;
  }
  float pulse = sin(uTime * uSpeed * 2.0) * 0.5 + 0.5;
  col *= 1.0 + pulse * uPulseIntensity * 0.3;
  if(uTransparent) {
    float alpha = length(col);
    alpha = smoothstep(0.0, 0.5, alpha);
    alpha = min(alpha, 1.0);
    gl_FragColor = vec4(col, alpha);
  } else {
    gl_FragColor = vec4(col, 1.0);
  }
}
`;

interface PlasmaWebProps {
  focal?: [number, number];
  flowSpeed?: number;
  density?: number;
  hueShift?: number;
  disableAnimation?: boolean;
  speed?: number;
  mouseInteraction?: boolean;
  glowIntensity?: number;
  saturation?: number;
  mouseAttraction?: boolean;
  pulseIntensity?: number;
  webComplexity?: number;
  attractionStrength?: number;
  energyFlow?: number;
  transparent?: boolean;
  brightness?: number;
}

function PlasmaWeb({
  focal = [0.5, 0.5],
  flowSpeed = 0.5,
  density = 1,
  hueShift = 270,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.8,
  saturation = 0.7,
  mouseAttraction = true,
  pulseIntensity = 0.4,
  webComplexity = 1.0,
  attractionStrength = 1.0,
  energyFlow = 1.0,
  transparent = true,
  brightness = 0.9,
}: PlasmaWebProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const targetMousePos = useRef({ x: 0.5, y: 0.5 });
  const smoothMousePos = useRef({ x: 0.5, y: 0.5 });
  const targetMouseActive = useRef(0.0);
  const smoothMouseActive = useRef(0.0);

  useEffect(() => {
    if (!ctnDom.current) return;

    // Early check to gracefully fail without triggering OGL's internal console.error
    try {
      const testCanvas = document.createElement("canvas");
      const testCtx = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
      if (!testCtx) return;
    } catch {
      return;
    }

    const ctn = ctnDom.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let renderer: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let gl: any;
    try {
      renderer = new Renderer({ alpha: transparent, premultipliedAlpha: false });
      gl = renderer.gl;
      if (!gl) return;
    } catch {
      return;
    }

    if (transparent) {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
    } else {
      gl.clearColor(0, 0, 0, 1);
    }

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uFocal: { value: new Float32Array(focal) },
        uFlowSpeed: { value: flowSpeed },
        uDensity: { value: density },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uMouse: { value: new Float32Array([smoothMousePos.current.x, smoothMousePos.current.y]) },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uMouseAttraction: { value: mouseAttraction },
        uPulseIntensity: { value: pulseIntensity },
        uWebComplexity: { value: webComplexity },
        uAttractionStrength: { value: attractionStrength },
        uMouseActiveFactor: { value: 0.0 },
        uEnergyFlow: { value: energyFlow },
        uTransparent: { value: transparent },
        uBrightness: { value: brightness },
      },
    });

    function resize() {
      const scale = 1;
      renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
      if (program) {
        program.uniforms.uResolution.value = new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
      }
    }
    window.addEventListener("resize", resize, false);
    resize();

    const mesh = new Mesh(gl, { geometry, program });
    let animateId: number;

    function update(t: number) {
      animateId = requestAnimationFrame(update);
      if (!disableAnimation) {
        program.uniforms.uTime.value = t * 0.001;
      }

      const lerpFactor = 0.08;
      smoothMousePos.current.x += (targetMousePos.current.x - smoothMousePos.current.x) * lerpFactor;
      smoothMousePos.current.y += (targetMousePos.current.y - smoothMousePos.current.y) * lerpFactor;
      smoothMouseActive.current += (targetMouseActive.current - smoothMouseActive.current) * lerpFactor;

      program.uniforms.uMouse.value[0] = smoothMousePos.current.x;
      program.uniforms.uMouse.value[1] = smoothMousePos.current.y;
      program.uniforms.uMouseActiveFactor.value = smoothMouseActive.current;

      renderer.render({ scene: mesh });
    }
    animateId = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);

    function handleMouseMove(e: MouseEvent) {
      const rect = ctn.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = 1.0 - (e.clientY - rect.top) / rect.height;
      targetMousePos.current = { x, y };
      targetMouseActive.current = 1.0;
    }

    function handleMouseLeave() {
      targetMouseActive.current = 0.0;
    }

    if (mouseInteraction) {
      ctn.addEventListener("mousemove", handleMouseMove);
      ctn.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      cancelAnimationFrame(animateId);
      window.removeEventListener("resize", resize);
      if (mouseInteraction) {
        ctn.removeEventListener("mousemove", handleMouseMove);
        ctn.removeEventListener("mouseleave", handleMouseLeave);
      }
      ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    focal,
    flowSpeed,
    density,
    hueShift,
    disableAnimation,
    speed,
    mouseInteraction,
    glowIntensity,
    saturation,
    mouseAttraction,
    pulseIntensity,
    webComplexity,
    attractionStrength,
    energyFlow,
    transparent,
    brightness,
  ]);

  return <div ref={ctnDom} className="w-full h-full absolute inset-0 z-0 pointer-events-none" />;
}

function AuthForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const router = useRouter();

  // If a token is present, we start in 'new-password' mode.
  const [activeTab, setActiveTab] = useState<"login" | "signup" | "reset" | "new-password">(
    token ? "new-password" : "login"
  );
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetSuccess, setIsResetSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const urlError = searchParams.get("error");

  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [resetData, setResetData] = useState({ email: "" });
  const [newPasswordData, setNewPasswordData] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateLogin = () => {
    const newErrors: Record<string, string> = {};
    if (!loginData.email) newErrors.email = "Email is required";
    if (!loginData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};
    if (!signupData.name) newErrors.name = "Name is required";
    
    if (!signupData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!signupData.password) {
      newErrors.password = "Password is required";
    } else {
      if (signupData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/[A-Z]/.test(signupData.password)) {
        newErrors.password = "Password must contain at least one uppercase letter";
      } else if (!/[a-z]/.test(signupData.password)) {
        newErrors.password = "Password must contain at least one lowercase letter";
      } else if (!/[0-9]/.test(signupData.password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/[^A-Za-z0-9]/.test(signupData.password)) {
        newErrors.password = "Password must contain at least one special character";
      }
    }

    if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setIsLoading(true);
    setErrors({});
    
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: loginData.email,
        password: loginData.password,
      });
      if (res?.error) {
        setErrors({ general: "Invalid email or password" });
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setErrors({ general: "An error occurred during sign in" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateSignup()) return;
    setIsLoading(true);
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append("name", signupData.name);
      formData.append("email", signupData.email);
      formData.append("password", signupData.password);
      
      const result = await register(formData);
      if (result?.error) {
        setErrors({ general: result.error });
      } else {
        // Automatically sign in after register
        const res = await signIn("credentials", {
          redirect: false,
          email: signupData.email,
          password: signupData.password,
        });
        if (!res?.error) router.push(callbackUrl);
      }
    } catch {
      setErrors({ general: "An error occurred during registration" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!resetData.email) {
      setErrors({ email: "Email is required" });
      return;
    }
    setIsLoading(true);
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append("email", resetData.email);
      const result = await forgotPassword(formData);
      if (result?.error) {
        setErrors({ general: result.error });
      } else {
        setIsResetSuccess(true);
      }
    } catch {
      setErrors({ general: "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPasswordData.password !== newPasswordData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    if (!token) return;
    setIsLoading(true);
    setErrors({});
    
    try {
      const formData = new FormData();
      formData.append("password", newPasswordData.password);
      const result = await resetPassword(formData, token);
      if (result?.error) {
        setErrors({ general: result.error });
      } else {
        setActiveTab("login");
        setSuccessMessage("Password successfully updated! Please log in.");
        setErrors({});
      }
    } catch {
      setErrors({ general: "An error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    signIn(provider, { callbackUrl });
  };

  // Falling dust particles canvas effect (from original prompt)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();

    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];
    let raf = 0;

    const make = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.25 + 0.05,
      o: Math.random() * 0.35 + 0.15,
    });

    const init = () => {
      ps = [];
      const count = Math.floor((canvas.width * canvas.height) / 9000);
      for (let i = 0; i < count; i++) ps.push(make());
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 40;
          p.v = Math.random() * 0.25 + 0.05;
          p.o = Math.random() * 0.35 + 0.15;
        }
        ctx.fillStyle = `rgba(168,85,247,${p.o})`;
        ctx.fillRect(p.x, p.y, 0.7, 2.2);
      });
      raf = requestAnimationFrame(draw);
    };

    const onResize = () => {
      setSize();
      init();
    };

    window.addEventListener("resize", onResize);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="min-h-screen bg-zinc-950 text-zinc-50 overflow-hidden flex flex-col lg:flex-row relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <PlasmaWeb
          hueShift={270}
          density={1.2}
          glowIntensity={1.0}
          saturation={0.8}
          brightness={0.7}
          energyFlow={1.2}
          pulseIntensity={0.3}
          attractionStrength={2.0}
          mouseAttraction={true}
          transparent={true}
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30 mix-blend-screen pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(168,85,247,0.08),transparent_60%)]" />
      </div>

      <div className="absolute top-0 left-0 w-full z-50">
        <NavBar />
      </div>

      <div className="relative z-10 hidden lg:flex w-1/2 flex-col justify-center items-start px-20">
        <div className="w-16 h-16 bg-zinc-900/80 border border-purple-500/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)]">
           <img src="/AURA_LOGO.png" alt="Aura Proxy" className="w-10 h-10 object-contain" />
        </div>
        <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6">
          The Intelligent <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">AI Gateway</span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-md leading-relaxed mb-10">
          Optimize your LLM infrastructure. Effortlessly route traffic, manage costs, and monitor performance in real-time with Aura Proxy.
        </p>
        
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center shadow-lg"><img src="/openai.svg" className="w-5 h-5" alt="OpenAI" /></div>
             <div className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center shadow-lg"><img src="/google-gemini.svg" className="w-5 h-5" alt="Gemini" /></div>
             <div className="w-10 h-10 rounded-full border-2 border-zinc-950 bg-zinc-900 flex items-center justify-center shadow-lg"><img src="/claude-icon.svg" className="w-5 h-5" alt="Claude" /></div>
          </div>
          <div className="flex flex-col justify-center">
             <span className="text-sm font-semibold text-zinc-200">Integrate Anywhere</span>
             <span className="text-xs text-purple-400/80">100+ Models Supported</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-4 pt-24 pb-12 lg:p-12 lg:pt-24 lg:pb-12 h-screen overflow-y-auto no-scrollbar">
        <Card className="w-full max-w-md border-purple-500/20 bg-zinc-900/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-zinc-900/40 shadow-[0_0_80px_-20px_rgba(168,85,247,0.15)] overflow-hidden">
          {(errors.general || urlError) && (
            <div className="bg-red-500/10 border-b border-red-500/20 p-3 flex items-center justify-center gap-2">
              <span className="text-sm text-red-400 font-medium">{errors.general || urlError}</span>
            </div>
          )}
          {successMessage && (
            <div className="bg-green-500/10 border-b border-green-500/20 p-3 flex items-center justify-center gap-2">
              <span className="text-sm text-green-400 font-medium">{successMessage}</span>
            </div>
          )}

          {activeTab === "new-password" ? (
             <form onSubmit={handleNewPasswordSubmit}>
               <CardHeader className="text-center space-y-2 pt-8">
                 <CardTitle className="text-3xl font-bold tracking-tight">Set New Password</CardTitle>
                 <CardDescription className="text-zinc-400">Enter a secure new password below.</CardDescription>
               </CardHeader>
               <CardContent className="space-y-5 px-8 pb-8">
                 <div className="space-y-2">
                   <Label className="text-zinc-300">New Password</Label>
                   <Input
                     type="password"
                     value={newPasswordData.password}
                     onChange={(e) => setNewPasswordData({ ...newPasswordData, password: e.target.value })}
                     className="bg-zinc-950/50 border-purple-500/30 text-zinc-50 focus-visible:ring-purple-500/50 transition-all h-11"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-zinc-300">Confirm Password</Label>
                   <Input
                     type="password"
                     value={newPasswordData.confirmPassword}
                     onChange={(e) => setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value })}
                     className="bg-zinc-950/50 border-purple-500/30 text-zinc-50 focus-visible:ring-purple-500/50 transition-all h-11"
                   />
                   {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
                 </div>
                 <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white h-11 text-base shadow-lg shadow-purple-600/20 mt-6 transition-all">
                   {isLoading ? "Saving..." : "Reset Password"}
                 </Button>
               </CardContent>
             </form>
          ) : activeTab === "reset" && isResetSuccess ? (
            <>
              <CardHeader className="text-center space-y-4 pt-10">
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]">
                    <CheckCircle className="h-10 w-10 text-purple-400" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold text-zinc-100 tracking-tight">Check Your Email</CardTitle>
                <CardDescription className="text-zinc-400 text-base">
                  We&apos;ve sent a password reset link to <strong className="text-zinc-200">{resetData.email}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-6 px-8">
                <p className="text-sm text-zinc-500">
                  Click the link in the email to securely reset your password. If you don&apos;t see it, check your spam folder.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={() => {
                      setIsResetSuccess(false);
                      setResetData({ email: "" });
                    }}
                    variant="outline"
                    className="w-full border-purple-500/30 bg-purple-950/20 text-purple-200 hover:bg-purple-900/40 hover:text-white transition-all h-9"
                  >
                    Send Another Link
                  </Button>
                  <Button
                    onClick={() => {
                      setActiveTab("login");
                      setIsResetSuccess(false);
                      setLoginData({ email: "", password: "" });
                    }}
                    variant="ghost"
                    className="w-full text-zinc-400 hover:text-white hover:bg-white/5 transition-all h-9"
                  >
                    Connect with another account
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "login" | "signup" | "reset" | "new-password"); setErrors({}); }} className="w-full">
              <CardHeader className="space-y-3 pt-6 pb-2">
                <TabsList className="grid w-full grid-cols-2 bg-zinc-950/50 border border-purple-500/20 p-1 rounded-xl h-10">
                  <TabsTrigger value="login" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-100 rounded-lg transition-all h-full text-sm font-medium">
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-100 rounded-lg transition-all h-full text-sm font-medium">
                    Sign Up
                  </TabsTrigger>
                </TabsList>
                <div className="text-center space-y-2">
                  <CardTitle className="text-2xl font-bold tracking-tight">
                    {activeTab === "login" ? "Welcome back" : activeTab === "signup" ? "Create account" : "Reset password"}
                  </CardTitle>
                  <CardDescription className="text-zinc-400 text-base">
                    {activeTab === "login"
                      ? "Access your AI gateway dashboard"
                      : activeTab === "signup"
                      ? "Start managing your LLM usage"
                      : "Enter your email to reset your password"}
                  </CardDescription>
                </div>
              </CardHeader>

              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLoginSubmit}>
                  <CardContent className="space-y-2 px-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Button type="button" variant="outline" onClick={() => handleOAuthLogin("github")} className="h-9 border-purple-500/20 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> GitHub
                      </Button>
                      <Button type="button" variant="outline" onClick={() => handleOAuthLogin("google")} className="h-9 border-purple-500/20 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg> Google
                      </Button>
                    </div>

                    <div className="relative py-1">
                      <Separator className="bg-purple-500/20" />
                      <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-zinc-900 px-3 text-[10px] uppercase tracking-widest text-zinc-500">or</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-zinc-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                          id="login-email" type="email" placeholder="you@example.com"
                          value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className={`pl-10 h-9 bg-zinc-950/50 border-${errors.email ? 'red-500/50' : 'purple-500/30'} text-zinc-50 focus-visible:ring-purple-500/50 transition-all`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password" className="text-zinc-300">Password</Label>
                        <button type="button" onClick={() => { setActiveTab("reset"); setErrors({}); setSuccessMessage(null); }} className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-all">
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Input
                          id="login-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                          value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className={`pr-10 h-9 bg-zinc-950/50 border-${errors.password ? 'red-500/50' : 'purple-500/30'} text-zinc-50 focus-visible:ring-purple-500/50 transition-all`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                    </div>
                  </CardContent>

                  <CardFooter className="px-6 pb-6 pt-4">
                    <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white h-9 text-base shadow-lg shadow-purple-600/20 transition-all">
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignupSubmit}>
                  <CardContent className="space-y-2 px-6">
                    <div className="grid grid-cols-2 gap-3">
                      <Button type="button" variant="outline" onClick={() => handleOAuthLogin("github")} className="h-9 border-purple-500/20 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> GitHub
                      </Button>
                      <Button type="button" variant="outline" onClick={() => handleOAuthLogin("google")} className="h-9 border-purple-500/20 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg> Google
                      </Button>
                    </div>
                    
                    <div className="relative py-1">
                      <Separator className="bg-purple-500/20" />
                      <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-zinc-900 px-3 text-[10px] uppercase tracking-widest text-zinc-500">or</span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-zinc-300">Name</Label>
                      <Input
                        id="signup-name" type="text" placeholder="Your name"
                        value={signupData.name} onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                        className={`h-9 bg-zinc-950/50 border-${errors.name ? 'red-500/50' : 'purple-500/30'} text-zinc-50 focus-visible:ring-purple-500/50 transition-all`}
                      />
                      {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-zinc-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                          id="signup-email" type="email" placeholder="you@example.com"
                          value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className={`pl-10 h-9 bg-zinc-950/50 border-${errors.email ? 'red-500/50' : 'purple-500/30'} text-zinc-50 focus-visible:ring-purple-500/50 transition-all`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-zinc-300">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                          value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className={`pr-10 h-9 bg-zinc-950/50 border-${errors.password ? 'red-500/50' : 'purple-500/30'} text-zinc-50 focus-visible:ring-purple-500/50 transition-all`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password ? (
                        <p className="text-xs text-red-400 mt-1">{errors.password}</p>
                      ) : (
                        <p className="text-[11px] text-zinc-500 mt-1">
                          Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm" className="text-zinc-300">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm" type={showConfirmPassword ? "text" : "password"} placeholder="••••••••"
                          value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          className={`pr-10 h-9 bg-zinc-950/50 border-${errors.confirmPassword ? 'red-500/50' : 'purple-500/30'} text-zinc-50 focus-visible:ring-purple-500/50 transition-all`}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-xs text-red-400 mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </CardContent>

                  <CardFooter className="px-6 pb-6 pt-4">
                    <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white h-9 text-base shadow-lg shadow-purple-600/20 transition-all">
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              <TabsContent value="reset" className="mt-0">
                <form onSubmit={handleResetSubmit}>
                  <CardContent className="space-y-5 px-8 pt-4 pb-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-zinc-300">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                          id="reset-email" type="email" placeholder="you@example.com"
                          value={resetData.email} onChange={(e) => setResetData({ email: e.target.value })}
                          className={`pl-10 h-11 bg-zinc-950/50 border-${errors.email ? 'red-500/50' : 'purple-500/30'} text-zinc-50 focus-visible:ring-purple-500/50 transition-all`}
                        />
                      </div>
                      {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 px-8 pb-8 pt-4">
                    <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white h-11 text-base shadow-lg shadow-purple-600/20 transition-all">
                      {isLoading ? "Sending link..." : "Send Reset Link"}
                    </Button>
                    <button type="button" onClick={() => setActiveTab("login")} className="text-sm text-zinc-400 hover:text-purple-400 hover:underline transition-all mt-2">
                      Back to Sign In
                    </button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </Card>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
