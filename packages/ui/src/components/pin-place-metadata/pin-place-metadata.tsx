"use client";

import {
  Accessibility,
  Building2,
  Clock,
  Dog,
  Globe,
  Info,
  Leaf,
  List,
  Mail,
  MapPin,
  Phone,
  Store,
  Tag,
  UtensilsCrossed,
} from "lucide-react";
import type * as React from "react";

import { HoverTooltip } from "../tooltip/hover-tooltip";
import styles from "./pin-place-metadata.module.css";

export type PinPlaceMetadataFieldKey =
  | "place_name"
  | "place_type"
  | "cuisine"
  | "dietary_options"
  | "wheelchair_access"
  | "dog_policy"
  | "brand"
  | "operator"
  | "phone"
  | "website"
  | "opening_hours"
  | "email"
  | "place_facts";

const FIELD_LABELS: Record<PinPlaceMetadataFieldKey, string> = {
  place_name: "Name",
  place_type: "Type",
  cuisine: "Cuisine",
  dietary_options: "Dietary",
  wheelchair_access: "Accessibility",
  dog_policy: "Dogs",
  brand: "Brand",
  operator: "Operator",
  phone: "Phone",
  website: "Website",
  opening_hours: "Hours",
  email: "Email",
  place_facts: "Details",
};

export function PinPlaceMetadataRoot({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div
      className={
        footer ? `${styles.panel} ${styles.panelHasAttribution}` : styles.panel
      }
    >
      <dl className={styles.body}>{children}</dl>
      {footer ? <div className={styles.attribution}>{footer}</div> : null}
    </div>
  );
}

export function PinPlaceMetadataRow({
  fieldKey,
  children,
}: {
  fieldKey: PinPlaceMetadataFieldKey;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>
        <PinPlaceMetadataIcon fieldKey={fieldKey} />
        <span>{FIELD_LABELS[fieldKey]}</span>
      </dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}

export function PinPlaceMetadataText({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.text}>{children}</span>;
}

export function PinPlaceMetadataMultiline({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.multiline}>{children}</span>;
}

export function PinPlaceMetadataFactList({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ul className={styles.factList}>{children}</ul>;
}

export function PinPlaceMetadataFactItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className={styles.factItem}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factValue}>{children}</span>
    </li>
  );
}

export function PinPlaceMetadataLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
    >
      {children}
    </a>
  );
}

export function PinPlaceMetadataSource({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.source}>{children}</span>;
}

export function PinPlaceMetadataAttribution({
  sources,
}: {
  sources: string[];
}) {
  const labels = sources.map((source) => source.trim()).filter(Boolean);
  if (labels.length === 0) return null;

  const tooltip =
    labels.length === 1 ? `via ${labels[0]}` : `via ${labels.join(", ")}`;

  return (
    <HoverTooltip content={tooltip}>
      <span className={styles.attributionTrigger} aria-label={tooltip}>
        <Info className={styles.attributionIcon} aria-hidden />
      </span>
    </HoverTooltip>
  );
}

export function PinPlaceMetadataStatus({
  children,
}: {
  children: React.ReactNode;
}) {
  return <span className={styles.status}>{children}</span>;
}

function PinPlaceMetadataIcon({
  fieldKey,
}: {
  fieldKey: PinPlaceMetadataFieldKey;
}) {
  const className = styles.icon;
  switch (fieldKey) {
    case "place_name":
      return <Tag className={className} aria-hidden />;
    case "place_type":
      return <MapPin className={className} aria-hidden />;
    case "cuisine":
      return <UtensilsCrossed className={className} aria-hidden />;
    case "dietary_options":
      return <Leaf className={className} aria-hidden />;
    case "wheelchair_access":
      return <Accessibility className={className} aria-hidden />;
    case "dog_policy":
      return <Dog className={className} aria-hidden />;
    case "brand":
      return <Store className={className} aria-hidden />;
    case "operator":
      return <Building2 className={className} aria-hidden />;
    case "opening_hours":
      return <Clock className={className} aria-hidden />;
    case "phone":
      return <Phone className={className} aria-hidden />;
    case "website":
      return <Globe className={className} aria-hidden />;
    case "email":
      return <Mail className={className} aria-hidden />;
    case "place_facts":
      return <List className={className} aria-hidden />;
    default:
      return null;
  }
}

export const pinPlaceMetadataStyles = styles;
