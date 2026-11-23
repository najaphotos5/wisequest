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
        {`try{var q=new URLSearchParams(location.search).get('dev');if(q==='1'||q==='on')localStorage.setItem('wq-dev','1');if(q==='0'||q==='off')localStorage.removeItem('wq-dev');if(localStorage.getItem('wq-dev')==='1')window['ga-disable-${id}']=true;}catch(e){}window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`}
      </Script>
    </>
  );
}
