const REAL_MODEL_API = window.location.protocol === "file:" || ["127.0.0.1", "localhost"].includes(window.location.hostname)
      ? "http://127.0.0.1:8776/api/score"
      : "https://moses-shipping-market-todd.trycloudflare.com/api/score";
    const LOCAL_API_BASE = window.location.protocol === "file:" || ["127.0.0.1", "localhost"].includes(window.location.hostname)
      ? "http://127.0.0.1:8776"
      : "";
