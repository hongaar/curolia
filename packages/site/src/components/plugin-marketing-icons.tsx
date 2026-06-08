import { PluginIconFrame } from "@curolia/ui/plugin-icon-frame";
import type { ReactNode } from "react";

import styles from "./plugin-marketing-icons.module.css";

const wikipediaLogo = new URL("../assets/wikipedia-logo.svg", import.meta.url)
  .href;
const polarstepsLogo = new URL("../assets/polarsteps-icon.svg", import.meta.url)
  .href;

type IconProps = {
  className?: string;
  size?: 4 | 5 | 6;
};

function MarketingPluginIcon({
  size = 5,
  children,
}: IconProps & { children: ReactNode }) {
  return <PluginIconFrame size={size}>{children}</PluginIconFrame>;
}

/** Spotify mark (simplified). */
export function SpotifyIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg viewBox="0 0 496 512" aria-hidden width="100%" height="100%">
        <path
          fill="#1ed760"
          d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z"
        />
        <path
          fill="#fff"
          d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z"
        />
      </svg>
    </MarketingPluginIcon>
  );
}

/** Google Photos mark. */
export function GooglePhotosIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg viewBox="0 0 59 59" aria-hidden width="100%" height="100%">
        <path
          fill="#FBBC04"
          d="M14.75 13.41c8.146 0 14.75 6.603 14.75 14.75v1.34H1.34C.6 29.5 0 28.9 0 28.16c0-8.147 6.604-14.75 14.75-14.75z"
        />
        <path
          fill="#EA4335"
          d="M45.59 14.75c0 8.146-6.603 14.75-14.75 14.75H29.5V1.34C29.5.6 30.1 0 30.84 0c8.147 0 14.75 6.604 14.75 14.75z"
        />
        <path
          fill="#4285F4"
          d="M44.25 45.59c-8.146 0-14.75-6.603-14.75-14.75V29.5h28.16c.74 0 1.34.6 1.34 1.34 0 8.147-6.604 14.75-14.75 14.75z"
        />
        <path
          fill="#34A853"
          d="M13.41 44.25c0-8.146 6.603-14.75 14.75-14.75h1.34v28.16c0 .74-.6 1.34-1.34 1.34-8.147 0-14.75-6.604-14.75-14.75z"
        />
      </svg>
    </MarketingPluginIcon>
  );
}

export function IcalIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg viewBox="0 0 55 60" aria-hidden width="100%" height="100%">
        <path
          fill="#2778BD"
          d="M52 60H3C1.34 60 0 58.66 0 57V5.87C0 4.21 1.34 2.87 3 2.87H52C53.66 2.87 55 4.21 55 5.87V57C55 58.66 53.66 60 52 60Z"
        />
        <path
          fill="#0F579F"
          d="M55 13.26H0V5.87C0 4.21 1.34 2.87 3 2.87H52C53.66 2.87 55 4.21 55 5.87V13.26Z"
        />
        <rect fill="#F0F0F0" x="7" y="21" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="18" y="21" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="29" y="21" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="40" y="21" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="7" y="32" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="18" y="32" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="29" y="32" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="40" y="32" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="18" y="43" width="7" height="8" rx="1" />
        <rect fill="#F0F0F0" x="29" y="43" width="7" height="8" rx="1" />
      </svg>
    </MarketingPluginIcon>
  );
}

export function LastfmIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg viewBox="0 0 512 512" aria-hidden width="100%" height="100%">
        <path
          fill="#D0232B"
          d="M105 0h302c58 0 105 47 105 105v302c0 58-47 105-105 105H105C47 511 0 464 0 407V105C0 47 47 0 105 0z"
        />
        <path
          fill="#fff"
          d="M237 325l-12-32s-19 21-47 21c-25 0-43-22-43-57 0-45 23-61 45-61 32 0 42 21 51 47l12 37c12 35 34 64 97 64 45 0 76-14 76-50 0-30-17-45-48-52l-23-5c-16-4-21-10-21-21 0-12 10-20 26-20 18 0 27 7 28 22l37-4c-3-33-26-46-63-46-33 0-65 12-65 52 0 25 12 41 42 48l25 6c19 4 25 12 25 23 0 13-13 19-38 19-37 0-52-19-61-46l-12-37c-15-48-40-65-88-65-54 0-82 34-82 92 0 56 28 85 80 85 41 0 61-19 61-19z"
        />
      </svg>
    </MarketingPluginIcon>
  );
}

/**
 * Strava app icon.
 * @see https://www.svgrepo.com/svg/349518/strava (CC0 via SVG Repo)
 */
export function StravaIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg viewBox="0 0 512 512" aria-hidden width="100%" height="100%">
        <rect width="512" height="512" rx="15%" fill="#fc4c01" />
        <path fill="#ffffff" d="M120 288L232 56l112 232h-72l-40-96-40 96z" />
        <path fill="#fda580" d="M280 288l32 72 32-72h48l-80 168-80-168z" />
      </svg>
    </MarketingPluginIcon>
  );
}

/**
 * Google Maps app icon.
 * @see https://www.svgrepo.com/svg/452221/google-maps
 */
export function GoogleMapsIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="8 5 16 22"
        fill="none"
        aria-hidden
        width="100%"
        height="100%"
      >
        <path
          fill="#34A851"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 12.8116L23.9999 12.8541C23.9998 12.872 23.9996 12.8899 23.9994 12.9078C23.9998 12.9287 24 12.9498 24 12.971C24 16.3073 21.4007 19.2604 19.6614 21.2367C19.1567 21.8101 18.7244 22.3013 18.449 22.6957C17.4694 24.0986 16.9524 25.6184 16.8163 26.2029C16.8163 26.6431 16.4509 27 16 27C15.5491 27 15.1837 26.6431 15.1837 26.2029C15.0476 25.6184 14.5306 24.0986 13.551 22.6957C13.2756 22.3013 12.8433 21.8101 12.3386 21.2367C10.5993 19.2604 8 16.3073 8 12.971C8 12.9498 8.0002 12.9287 8.0006 12.9078C8.0002 12.8758 8 12.8437 8 12.8116C8 8.49736 11.5817 5 16 5C20.4183 5 24 8.49736 24 12.8116ZM16 15.6812C17.7132 15.6812 19.102 14.325 19.102 12.6522C19.102 10.9793 17.7132 9.62319 16 9.62319C14.2868 9.62319 12.898 10.9793 12.898 12.6522C12.898 14.325 14.2868 15.6812 16 15.6812Z"
        />
        <path
          fill="#4285F5"
          d="M23.1054 9.21856C22.1258 7.37546 20.4161 5.96177 18.3504 5.34277L13.7559 10.5615C14.3208 9.98352 15.1174 9.62346 16.0002 9.62346C17.7134 9.62346 19.1022 10.9796 19.1022 12.6524C19.1022 13.3349 18.8711 13.9646 18.4811 14.4711L23.1054 9.21856Z"
        />
        <path
          fill="#F9BB0E"
          d="M12.4311 21.3425C12.4004 21.3076 12.3695 21.2725 12.3383 21.2371C11.1918 19.9344 9.67162 18.2073 8.76855 16.2257L13.5439 10.8018C13.1387 11.3136 12.8976 11.9556 12.8976 12.6526C12.8976 14.3254 14.2865 15.6816 15.9997 15.6816C16.8675 15.6816 17.6521 15.3336 18.2151 14.7727L12.4311 21.3425Z"
        />
        <path
          fill="#E74335"
          d="M9.89288 7.76562C8.71207 9.12685 8 10.8881 8 12.8117C8 12.8438 8.0002 12.8759 8.0006 12.9079C8.0002 12.9288 8 12.9499 8 12.9711C8 14.1082 8.30196 15.2009 8.76889 16.2254L13.5362 10.8106L9.89288 7.76562Z"
        />
        <path
          fill="#1A73E6"
          d="M18.3499 5.34254C17.6068 5.11988 16.8176 5 15.9997 5C13.5514 5 11.36 6.07387 9.89258 7.76553L13.5359 10.8105L13.5438 10.8015C13.6101 10.7178 13.6807 10.6375 13.7554 10.5611L18.3499 5.34254Z"
        />
      </svg>
    </MarketingPluginIcon>
  );
}

export function GoogleCalendarIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg viewBox="0 0 48 48" aria-hidden width="100%" height="100%">
        <rect fill="#fff" width="48" height="48" rx="8" />
        <rect fill="#4285F4" y="10" width="48" height="12" />
        <rect fill="#fff" y="22" width="48" height="26" />
        <rect fill="#EA4335" x="8" y="26" width="8" height="8" rx="1" />
        <rect fill="#FBBC04" x="20" y="26" width="8" height="8" rx="1" />
        <rect fill="#34A853" x="32" y="26" width="8" height="8" rx="1" />
        <rect fill="#4285F4" x="8" y="36" width="8" height="6" rx="1" />
        <rect fill="#EA4335" x="20" y="36" width="8" height="6" rx="1" />
      </svg>
    </MarketingPluginIcon>
  );
}

export function AppleCalendarIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg viewBox="0 0 48 48" aria-hidden width="100%" height="100%">
        <rect fill="#fff" width="48" height="48" rx="10" />
        <rect fill="#FF3B30" y="8" width="48" height="10" rx="2" />
        <text
          x="24"
          y="36"
          textAnchor="middle"
          fontSize="16"
          fontWeight="600"
          fill="#1c1c1e"
          fontFamily="system-ui, sans-serif"
        >
          12
        </text>
      </svg>
    </MarketingPluginIcon>
  );
}

/** Wikipedia puzzle globe (Wikimedia Commons, CC BY-SA 3.0). */
export function WikipediaIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <img src={wikipediaLogo} alt="" className={styles.logoImg} />
    </MarketingPluginIcon>
  );
}

/** Open-Meteo weather tile. */
export function OpenMeteoIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        aria-hidden
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id="om-marketing-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0ea5e9" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="6" fill="url(#om-marketing-sky)" />
        <circle cx="22" cy="10" r="5" fill="#fde047" />
        <path
          fill="#fff"
          fillOpacity="0.95"
          d="M6 22c2-4 6-6 10-6s9 2 11 6H6z"
        />
      </svg>
    </MarketingPluginIcon>
  );
}

/** Points of interest place-context tile (red map pin). */
export function PoiIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden
        width="100%"
        height="100%"
      >
        <path
          fill="#EA4335"
          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        />
        <circle cx="12" cy="9" r="2.5" fill="#fff" />
      </svg>
    </MarketingPluginIcon>
  );
}

/** Polarsteps compass mark. */
export function PolarstepsIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <img src={polarstepsLogo} alt="" className={styles.logoImg} />
    </MarketingPluginIcon>
  );
}

/** Public API / developer access. */
export function ApiAccessIcon({ size = 5 }: IconProps) {
  return (
    <MarketingPluginIcon size={size}>
      <svg viewBox="0 0 48 48" aria-hidden width="100%" height="100%">
        <rect width="48" height="48" rx="10" fill="#1e293b" />
        <path
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 16 11 24l6 8M31 16l6 8-6 8"
        />
        <path
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          d="M27 14 21 34"
        />
        <circle cx="36" cy="12" r="3" fill="#22c55e" />
      </svg>
    </MarketingPluginIcon>
  );
}
