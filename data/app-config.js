const REAL_MODEL_API = window.location.protocol === "file:" || ["127.0.0.1", "localhost"].includes(window.location.hostname)
      ? "http://127.0.0.1:8774/api/score"
      : "https://moses-shipping-market-todd.trycloudflare.com/api/score";
