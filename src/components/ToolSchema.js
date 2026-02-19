import React from 'react';
import { Helmet } from 'react-helmet-async';

const ToolSchema = ({ tool, category }) => {
    if (!tool) return null;

    const schemaData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": tool.name,
        "description": tool.description || tool.shortDescription || tool.short_description,
        "url": window.location.href, // or tool.website_url if you want to point to external
        "image": tool.logo_url || tool.logoUrl,
        "applicationCategory": category?.name || tool.applicationCategory || "AI Tool",
        "operatingSystem": tool.operatingSystem || "Web",
        "offers": {
            "@type": "Offer",
            "price": (tool.pricing_model === 'FREE' || tool.pricingModel === 'FREE') ? "0" : "varies",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
        },
        ...(tool.rating && tool.rating > 0 && {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": tool.rating,
                "reviewCount": tool.reviewCount || 0,
                "bestRating": "5",
                "worstRating": "1"
            }
        }),
        "author": {
            "@type": "Organization",
            "name": "Clarifyall"
        },
        "datePublished": tool.created_at || tool.createdAt,
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schemaData)}
            </script>
        </Helmet>
    );
};

export default ToolSchema;
