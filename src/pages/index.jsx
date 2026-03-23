import { useState } from "react";
import { Button } from "../components/ui/button";
import { FiBook, FiPackage, FiGithub, FiExternalLink } from "react-icons/fi";
import "./index.css";

// Vite Logo SVG
const ViteLogo = () => (
  <svg
    className="logo-icon logo-vite"
    viewBox="0 0 410 404"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M399.641 59.5246L215.643 388.545C211.844 395.338 202.084 395.378 198.228 388.618L10.5817 59.5563C6.38087 52.1896 12.6802 43.2665 21.0281 44.7586L205.223 77.6824C206.398 77.8924 207.601 77.8904 208.776 77.6763L389.119 44.8058C397.439 43.2894 403.768 52.1434 399.641 59.5246Z"
      fill="url(#paint0_linear)"
    />
    <path
      d="M292.965 1.5744L156.801 28.2552C154.563 28.6937 152.906 30.5903 152.771 32.8664L144.395 174.33C144.198 177.662 147.258 180.248 150.51 179.498L188.42 170.749C191.967 169.931 195.172 173.055 194.443 176.622L183.18 231.775C182.422 235.487 185.907 238.661 189.532 237.56L212.947 230.446C216.577 229.344 220.065 232.527 219.297 236.242L201.398 322.875C200.278 328.294 207.486 331.249 210.492 326.603L212.5 323.5L323.454 102.072C325.312 98.3645 322.108 94.137 318.036 94.9228L279.014 102.454C275.347 103.161 272.227 99.746 273.262 96.1583L298.731 7.86689C299.767 4.27314 296.636 0.855181 292.965 1.5744Z"
      fill="url(#paint1_linear)"
    />
    <defs>
      <linearGradient
        id="paint0_linear"
        x1="6.00017"
        y1="32.9999"
        x2="235"
        y2="344"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#41D1FF" />
        <stop offset="1" stopColor="#BD34FE" />
      </linearGradient>
      <linearGradient
        id="paint1_linear"
        x1="194.651"
        y1="8.81818"
        x2="236.076"
        y2="292.989"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FFBD4F" />
        <stop offset="1" stopColor="#FF980E" />
      </linearGradient>
    </defs>
  </svg>
);

// React Logo SVG
const ReactLogo = () => (
  <svg
    className="logo-icon logo-react"
    viewBox="-11.5 -10.23174 23 20.46348"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="0" cy="0" r="2.05" fill="#61dafb" />
    <g stroke="#61dafb" strokeWidth="1" fill="none">
      <ellipse rx="11" ry="4.2" />
      <ellipse rx="11" ry="4.2" transform="rotate(60)" />
      <ellipse rx="11" ry="4.2" transform="rotate(120)" />
    </g>
  </svg>
);

// Domo Logo SVG
const DomoLogo = () => (
  <svg
    className="logo-icon logo-domo"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100" height="100" rx="16" fill="url(#domoGradient)" />
    <text
      x="50"
      y="65"
      textAnchor="middle"
      fill="white"
      fontSize="36"
      fontWeight="bold"
      fontFamily="Arial, sans-serif"
    >
      DOMO
    </text>
    {/* <circle cx="72" cy="35" r="8" fill="white" opacity="0.8" /> */}
    <defs>
      <linearGradient
        id="domoGradient"
        x1="0"
        y1="0"
        x2="100"
        y2="100"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#00B5E2" />
        <stop offset="1" stopColor="#0072BC" />
      </linearGradient>
    </defs>
  </svg>
);

// Tailwind Logo SVG
const TailwindLogo = () => (
  <svg
    className="logo-icon logo-tailwind"
    viewBox="0 0 54 33"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#tailwindClip)">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27 0C19.8 0 15.3 3.6 13.5 10.8C16.2 7.2 19.35 5.85 22.95 6.75C25.004 7.263 26.472 8.754 28.097 10.403C30.744 13.09 33.808 16.2 40.5 16.2C47.7 16.2 52.2 12.6 54 5.4C51.3 9 48.15 10.35 44.55 9.45C42.496 8.937 41.028 7.446 39.403 5.797C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27C2.7 23.4 5.85 22.05 9.45 22.95C11.504 23.464 12.972 24.954 14.597 26.603C17.244 29.29 20.308 32.4 27 32.4C34.2 32.4 38.7 28.8 40.5 21.6C37.8 25.2 34.65 26.55 31.05 25.65C28.996 25.137 27.528 23.646 25.903 21.997C23.256 19.31 20.192 16.2 13.5 16.2Z"
        fill="url(#tailwindGradient)"
      />
    </g>
    <defs>
      <linearGradient
        id="tailwindGradient"
        x1="0"
        y1="16.2"
        x2="54"
        y2="16.2"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#06B6D4" />
        <stop offset="1" stopColor="#22D3EE" />
      </linearGradient>
      <clipPath id="tailwindClip">
        <rect width="54" height="33" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Shadcn Logo SVG
const ShadcnLogo = () => (
  <svg
    className="logo-icon logo-shadcn"
    viewBox="0 0 256 256"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="256" height="256" rx="60" fill="currentColor" />
    <line
      x1="208"
      y1="128"
      x2="128"
      y2="208"
      stroke="url(#shadcnGradient)"
      strokeWidth="24"
      strokeLinecap="round"
    />
    <line
      x1="192"
      y1="40"
      x2="40"
      y2="192"
      stroke="url(#shadcnGradient)"
      strokeWidth="24"
      strokeLinecap="round"
    />
    <defs>
      <linearGradient
        id="shadcnGradient"
        x1="40"
        y1="40"
        x2="208"
        y2="208"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#fff" />
        <stop offset="1" stopColor="#a1a1aa" />
      </linearGradient>
    </defs>
  </svg>
);

const DefaultPage = () => {
  const [count, setCount] = useState(0);

  const docLinks = [
    {
      title: "DOMO APIs",
      url: "https://developer.domo.com/portal/8ba9aedad3679-ap-is",
      description: "Explore the API documentation",
      Icon: FiBook,
    },
    {
      title: "Domo Starter Kit",
      url: "https://developer.domo.com/portal/u8w475o2245yp-starter-kits",
      description: "Get started quickly",
      Icon: FiPackage,
    },
    {
      title: "GitHub Repository",
      url: "https://github.com/Ajay-Balu/create-dovite",
      description: "View source code",
      Icon: FiGithub,
    },
  ];

  return (
    <div className="landing-page h-screen w-screen flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center gap-16 px-8 py-8 max-w-[1400px] mx-auto w-full max-lg:flex-col max-lg:gap-8 max-lg:overflow-y-auto">
        {/* Left Side - Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
          {/* Logo Container */}
          <div className="flex justify-center items-center gap-2 flex-wrap mb-2">
            <a
              href="https://vitejs.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex transition-transform duration-300 hover:scale-115"
            >
              <ViteLogo />
            </a>
            <span className="text-2xl font-light text-zinc-500/50 mx-1">+</span>
            <a
              href="https://react.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex transition-transform duration-300 hover:scale-115"
            >
              <ReactLogo />
            </a>
            <span className="text-2xl font-light text-zinc-500/50 mx-1">+</span>
            <a
              href="https://www.domo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex transition-transform duration-300 hover:scale-115"
            >
              <DomoLogo />
            </a>
            <span className="text-2xl font-light text-zinc-500/50 mx-1">+</span>
            <a
              href="https://tailwindcss.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex transition-transform duration-300 hover:scale-115"
            >
              <TailwindLogo />
            </a>
            <span className="text-2xl font-light text-zinc-500/50 mx-1">+</span>
            <a
              href="https://ui.shadcn.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex transition-transform duration-300 hover:scale-115"
            >
              <ShadcnLogo />
            </a>
          </div>

          {/* Title */}
          <h1 className="text-5xl font-extrabold tracking-tight m-0 leading-tight max-md:text-4xl max-sm:text-3xl">
            <span className="gradient-text">Dovite</span>
          </h1>
          <p className="text-base text-zinc-400 m-0 font-medium">
            Vite + React + DOMO + Tailwind + Shadcn/UI
          </p>
          <p className="text-sm text-zinc-500 m-0 max-w-[400px]">
            Build beautiful DOMO apps with modern web technologies
          </p>

          {/* Interactive Demo Section */}
          <div className="mt-6">
            <div className="px-8 py-6 bg-white/3 border border-white/8 rounded-2xl backdrop-blur-lg">
              <Button
                onClick={() => setCount((count) => count + 1)}
                className="text-sm px-5 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Count is {count}
              </Button>
              <p className="mt-4 text-zinc-500 text-xs">
                Edit{" "}
                <code className="bg-zinc-500/15 px-1.5 py-0.5 rounded text-zinc-400 font-mono text-[0.8em]">
                  src/pages/index.jsx
                </code>{" "}
                and save to test HMR
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Documentation Links */}
        <div className="w-80 flex flex-col gap-4 p-6 bg-white/2 border border-white/6 rounded-2xl backdrop-blur-lg max-lg:w-full max-lg:max-w-[400px]">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest m-0 pb-3 border-b border-white/6">
            Resources
          </h2>
          <div className="flex flex-col gap-2">
            {docLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-4 py-3.5 bg-white/2 border border-white/4 rounded-xl no-underline text-inherit transition-all duration-250 hover:bg-white/6 hover:border-cyan-500/30 hover:translate-x-1"
              >
                <link.Icon className="text-xl text-cyan-500 shrink-0" />
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold text-zinc-100">
                    {link.title}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {link.description}
                  </span>
                </div>
                <FiExternalLink className="text-sm text-zinc-600 shrink-0 transition-all duration-250 group-hover:text-cyan-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            ))}
          </div>
          <p className="text-xs text-zinc-600 text-center m-0 pt-2">
            Click on the logos to learn more
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-4 text-center border-t border-white/6 bg-black/20">
        <p className="m-0 text-zinc-600 text-xs">
          Built with <span className="text-red-500">❤</span> using{" "}
          <a
            href="https://github.com/Ajay-Balu/create-dovite"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-500 no-underline font-medium transition-colors duration-300 hover:text-purple-500"
          >
            create-dovite
          </a>
        </p>
      </footer>
    </div>
  );
};

export default DefaultPage;
