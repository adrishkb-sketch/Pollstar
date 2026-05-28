'use client';

import { useEffect, useState } from 'react';
import { Sparkles, X } from 'lucide-react';

interface AdvertisementZoneProps {
  removeAdvertisements?: boolean;
}

export default function AdvertisementZone({ removeAdvertisements = false }: AdvertisementZoneProps) {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (removeAdvertisements) {
      setLoading(false);
      return;
    }

    const fetchConfigs = async () => {
      try {
        const res = await fetch('/api/admin/site-config');
        if (res.ok) {
          const data = await res.json();
          const vals: Record<string, string> = {};
          (data.configs || []).forEach((c: any) => {
            vals[c.key] = c.value;
          });
          setConfigs(vals);
        }
      } catch (e) {
        console.error('Error fetching ad configs', e);
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [removeAdvertisements]);

  // If advertisements are disabled by creator plan or closed, render nothing
  if (removeAdvertisements || !isVisible || loading) return null;

  const isNetworkEnabled = configs['ad_network_enabled'] === 'true';
  const isCustomEnabled = configs['ad_custom_enabled'] === 'true';

  // If no ads are enabled globally by admin, render nothing
  if (!isNetworkEnabled && !isCustomEnabled) return null;

  // Custom ad links & images
  const customDesktopImage = configs['ad_custom_desktop_image'] || '';
  const customDesktopLink = configs['ad_custom_desktop_link'] || '#';
  const customTabletImage = configs['ad_custom_tablet_image'] || '';
  const customTabletLink = configs['ad_custom_tablet_link'] || '#';
  const customMobileImage = configs['ad_custom_mobile_image'] || '';
  const customMobileLink = configs['ad_custom_mobile_link'] || '#';

  // Inject network ad script tags in document body if enabled
  const renderNetworkScripts = () => {
    if (!isNetworkEnabled) return null;

    const adsenseSnippet = configs['ad_google_adsense_code'] || '';
    const medianetSnippet = configs['ad_medianet_code'] || '';

    if (!adsenseSnippet && !medianetSnippet) return null;

    return (
      <div className="hidden">
        {adsenseSnippet && (
          <div dangerouslySetInnerHTML={{ __html: adsenseSnippet }} />
        )}
        {medianetSnippet && (
          <div dangerouslySetInnerHTML={{ __html: medianetSnippet }} />
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 transition-all animate-fade-in relative z-10">
      {/* Network Scripts Injection */}
      {renderNetworkScripts()}

      {/* Custom Banner Advertisement */}
      {isCustomEnabled && (
        <div className="glass-card rounded-3xl border border-white/10 p-1 bg-[#080d1a]/85 relative shadow-2xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 group">
          {/* Background subtle glowing radial gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Ad Label Overlay */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border border-white/10 tracking-widest flex items-center gap-1 z-10">
            <Sparkles className="w-2.5 h-2.5 text-yellow-400 animate-pulse" />
            <span>Sponsored</span>
          </div>

          {/* Close Advertisement Button */}
          <button
            onClick={() => setIsVisible(false)}
            className="absolute top-3 right-3 p-1 rounded-lg bg-black/60 hover:bg-black/80 text-gray-400 hover:text-white border border-white/10 transition-colors z-10"
            title="Dismiss Advertisement"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Render Responsive Banners */}
          <div className="w-full h-auto text-center flex items-center justify-center min-h-[60px]">
            {/* Desktop Banner: Visible on lg and up (approx 970x90 or 728x90 layout) */}
            {customDesktopImage && (
              <a
                href={customDesktopLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:block w-full max-h-[120px] overflow-hidden rounded-2xl hover:opacity-95 transition-opacity"
              >
                <img
                  src={customDesktopImage}
                  alt="Advertisement Banner Desktop"
                  className="w-full h-auto object-cover max-h-[120px] rounded-2xl"
                />
              </a>
            )}

            {/* Tablet Banner: Visible on md to lg (approx 728x90 or 468x60 layout) */}
            {customTabletImage && (
              <a
                href={customTabletLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:block lg:hidden w-full max-h-[90px] overflow-hidden rounded-2xl hover:opacity-95 transition-opacity"
              >
                <img
                  src={customTabletImage}
                  alt="Advertisement Banner Tablet"
                  className="w-full h-auto object-cover max-h-[90px] rounded-2xl"
                />
              </a>
            )}

            {/* Mobile Banner: Visible below md (approx 320x50 or 300x50 layout) */}
            {customMobileImage && (
              <a
                href={customMobileLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block md:hidden w-full max-h-[70px] overflow-hidden rounded-2xl hover:opacity-95 transition-opacity"
              >
                <img
                  src={customMobileImage}
                  alt="Advertisement Banner Mobile"
                  className="w-full h-auto object-cover max-h-[70px] rounded-2xl"
                />
              </a>
            )}

            {/* Fallback if no images uploaded */}
            {!customDesktopImage && !customTabletImage && !customMobileImage && (
              <div className="py-4 text-[10px] text-gray-500 italic font-semibold">
                Advertisement slot available — Inquire at our Contact Us Page
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
