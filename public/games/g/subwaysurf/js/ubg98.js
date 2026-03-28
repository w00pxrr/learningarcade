// Backlinks Go Here!
const backlinksList= [{
  link: "https://ubg98.github.io/car-games.html",
  text: "CAR",
}, {
  link: "https://ubg98.github.io/jump-run-games.html",
  text: "JUMP & RUN",
}, {
  link: "https://ubg98.github.io/shooting-games.html",
  text: "SHOOTING",
}, {
  link: "https://ubg98.github.io/sports-games.html",
  text: "SPORTS",
}, {
  link: "https://ubg98.github.io/puzzle-games.html",
  text: "PUZZLE",
}, {
  link: "https://ubg98.github.io/idle-games.html",
  text: "IDLE",
}];


function inFrame () {
  try {
      return window.self !== window.top;
  } catch (e) {
      return true;
  }
}


function botBrowser() {
try {
  return navigator.webdriver
} catch (e) {
    return true;
}
}


function desktopBrowser() {
  try {
    const w= window.screen.width;
    return (w>= 800);
  } catch (e) {
    return false;
  }
  return false;
}


function closeBacklinks() {
document.getElementById("backlinksPlace").style.display= "none";
return false;
}


function insertBacklinks() {
// Backlinks disabled - no redirects to external sites
return false;
}

addEventListener("load", insertBacklinks);
setTimeout(closeBacklinks, 5* 60* 1000);