function loadGoogleAnalytics(e) {
  var o = document.getElementsByTagName("script")[0];
  function a() {
    dataLayer.push(arguments);
  }
  ((newScript = document.createElement("script")),
    (newScript.async = ""),
    (newScript.src = "https://www.googletagmanager.com/gtag/js?id=" + e),
    o.parentNode.insertBefore(newScript, o),
    (window.dataLayer = window.dataLayer || []),
    a("js", new Date()),
    a("config", e));
}
window.addEventListener("load", (e) => {
  navigator.webdriver
    ? (loadGoogleAnalytics("G-LE1ZGTPC77"), console.log("Bot Browser", e))
    : (loadGoogleAnalytics("G-GLTKYHC2VB"), console.log("Human Browser", e));
});
