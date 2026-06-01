import { unsplashImages } from "../content/unsplash-images";
import { MarketingButtonLink, MarketingLayout } from "../shell/marketing-shell";
import nativeStyles from "../styles/native-landing.module.css";

type NativeAppLandingPageProps = {
  heroImageSrc?: string;
  logoSrc?: string;
};

/** Full-viewport welcome for Capacitor guests — no scroll, hero + auth actions only. */
export function NativeAppLandingPage({
  heroImageSrc = unsplashImages.nativeHero.src,
  logoSrc = "/icon.png",
}: NativeAppLandingPageProps = {}) {
  return (
    <MarketingLayout>
      <div className={nativeStyles.viewport}>
        <div className={nativeStyles.screen}>
          <img
            className={nativeStyles.heroImage}
            src={heroImageSrc}
            alt=""
            aria-hidden
            decoding="async"
          />
          <div className={nativeStyles.scrim} aria-hidden />

          <div className={nativeStyles.content}>
            <img
              className={nativeStyles.logo}
              src={logoSrc}
              alt="Curolia"
              width={72}
              height={72}
              decoding="async"
            />
            <h1 className={nativeStyles.title}>Curolia</h1>
            <p className={nativeStyles.lead}>Remember every place you go</p>
            <div className={nativeStyles.actions}>
              <MarketingButtonLink to="/signup" size="lg">
                Sign up
              </MarketingButtonLink>
              <MarketingButtonLink to="/login" variant="outline" size="lg">
                Log in
              </MarketingButtonLink>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}
