import Script from "next/script";
import { site } from "@/lib/site";

/**
 * Google Analytics 4. Renders nothing until `site.gaId` is set.
 * GA4's enhanced measurement counts client-side page changes automatically,
 * and reports engagement time per page under Reports → Pages and screens.
 */
export function Analytics() {
  const id = site.gaId;
  if (!id) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
