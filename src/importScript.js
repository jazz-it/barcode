import { useEffect } from "react";

const importScript = (resourceUrl, callback) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = resourceUrl;
    script.async = true;
    script.onload = callback;
    script.onerror = (error) => {
      console.error(`Failed to load script at ${resourceUrl}:`, error);
    };
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [resourceUrl, callback]);
};

export default importScript;
