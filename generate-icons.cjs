const fs = require('fs');

const createPng = (size) => {
  // A tiny valid blank transparent 1x1 base64 png, scaled up isn't valid, wait!
  // I must provide a valid PNG. Wait, a 1x1 PNG is valid but Chrome might reject if it parses size.
  // Instead, just copy a pre-made base64 of a 192x192 PNG.
};

const basePNG192 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAQAAACJofFjAAAAZElEQVR42u3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC+A2oBAAFOALZPAAAAAElFTkSuQmCC', 'base64');
const basePNG512 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAA1BMVEUAAACnej3aAAAAJElEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAABuAx8AAAErEa7IAAAAAElFTkSuQmCC', 'base64');

fs.writeFileSync('public/icon-192x192.png', basePNG192);
fs.writeFileSync('public/icon-512x512.png', basePNG512);

console.log('Icons generated!');
