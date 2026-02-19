import React, { useEffect, useRef } from 'react';

function AdSense({ slot, style, format = 'auto', responsive = 'true' }) {
  const adRef = useRef(null);
  const [error, setError] = React.useState(false);

  useEffect(() => {
    // Only initialize if we have a valid slot
    if (!slot || slot === 'YOUR_PUBLISHER_ID') {
      console.warn('AdSense: Invalid or missing slot ID');
      setError(true);
      return;
    }

    try {
      // AdSense script should be loaded in index.html <head>
      // Just wait a bit for script to load before initializing
      const timer = setTimeout(() => {
        try {
          if (window.adsbygoogle) {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } else {
            console.warn('AdSense: Script not loaded yet');
            setError(true);
          }
        } catch (e) {
          console.warn('AdSense: Error initializing ad', e);
          setError(true);
        }
      }, 100);

      return () => clearTimeout(timer);
    } catch (e) {
      console.warn('AdSense: Error setting up ad', e);
      setError(true);
    }
  }, [slot]);

  // AdSense publisher ID
  const AD_CLIENT = 'ca-pub-1827656723411506'; // AdSense client ID

  // Don't render if there's an error or invalid config
  if (error || !slot) {
    return null; // Return null instead of rendering broken ad
  }

  return (
    <div className="adsense-container" ref={adRef} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}

export default AdSense;

