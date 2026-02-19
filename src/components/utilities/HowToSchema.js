import React from 'react';
import { Helmet } from 'react-helmet-async';

const HowToSchema = ({ name, description, steps, tools }) => {
    const schema = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": name,
        "description": description,
        "step": steps.map((step, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "name": step.title,
            "text": step.text,
            "url": window.location.href + `#step-${index + 1}`
        })),
        "tool": tools?.map(tool => ({
            "@type": "HowToTool",
            "name": tool
        }))
    };

    return (
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify(schema)}
            </script>
        </Helmet>
    );
};

export default HowToSchema;
