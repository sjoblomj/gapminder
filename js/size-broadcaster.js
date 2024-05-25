function calculateSize() {
  const menu      = document.getElementById('countriesAndContinentsList');
  const stylesM   = window.getComputedStyle(menu);
  const marginMW  = parseFloat(stylesM['marginLeft']) + parseFloat(stylesM['marginRight'])  + parseFloat(stylesM['paddingLeft']) + parseFloat(stylesM['paddingRight']);
  const marginMH  = parseFloat(stylesM['marginTop'])  + parseFloat(stylesM['marginBottom']) + parseFloat(stylesM['paddingTop'])  + parseFloat(stylesM['paddingBottom']);

  const controlContainer = document.getElementById('controlContainer');
  const stylesC   = window.getComputedStyle(controlContainer);
  const marginCW  = parseFloat(stylesC['marginLeft']) + parseFloat(stylesC['marginRight'])  + parseFloat(stylesC['paddingLeft']) + parseFloat(stylesC['paddingRight']);
  const marginCH  = parseFloat(stylesC['marginTop'])  + parseFloat(stylesC['marginBottom']) + parseFloat(stylesC['paddingTop'])  + parseFloat(stylesC['paddingBottom']);

  const width  = Math.max(menu.offsetWidth  + marginMW, controlContainer.offsetWidth  + marginCW) + 16;
  const height = Math.max(menu.offsetHeight + marginMH, controlContainer.offsetHeight + marginCH) + 16;
  return {"id": "gapminder", "width": width, "height": height};
}

function notifyParentOfSize() {
  // If this is included as an iframe, notify the parent of our size so that the iframe can be resized accordingly
  const size = calculateSize();
  window.parent.postMessage(size, "*");
}

window.addEventListener("message", (event) => {
  if (event?.data?.id !== "gapminder") {
    notifyParentOfSize();
  }
});
