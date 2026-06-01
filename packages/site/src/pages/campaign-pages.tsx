import { campaignById } from "../content/campaigns";
import { CampaignLandingPage } from "./campaign-landing-page";

function campaignPage(id: string) {
  const campaign = campaignById(id);
  if (!campaign) {
    throw new Error(`Unknown campaign: ${id}`);
  }
  return <CampaignLandingPage campaign={campaign} />;
}

export function TravelLandingPage() {
  return campaignPage("travel");
}

export function FoodLandingPage() {
  return campaignPage("food");
}

export function GeocachingLandingPage() {
  return campaignPage("geocaching");
}

export function FamiliesLandingPage() {
  return campaignPage("families");
}

export function HikingLandingPage() {
  return campaignPage("hiking");
}

export function VanlifeLandingPage() {
  return campaignPage("vanlife");
}

export function HeritageLandingPage() {
  return campaignPage("heritage");
}

export function EventsLandingPage() {
  return campaignPage("events");
}
