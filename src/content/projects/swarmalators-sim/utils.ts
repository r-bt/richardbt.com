export function mapRange(
  num: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) {
  return ((num - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function radiansToHSV(angleInRadians: number) {
  // Convert radians to degrees
  let degrees = angleInRadians * (180 / Math.PI);

  // Normalize degrees to [0, 360)
  let hue = ((degrees % 360) + 360) % 360;

  // Set saturation and value to maximum
  let saturation = 1;
  let value = 1;

  return { hue, saturation, value };
}

function HSVtoRGB(h: number, s: number, v: number) {
  let c = v * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = v - c;
  let r, g, b;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return { r, g, b };
}

export function HSVtoCanvasFillStyle(angleInRadians: number) {
  let hsv = radiansToHSV(angleInRadians);
  let rgb = HSVtoRGB(hsv.hue, hsv.saturation, hsv.value);

  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
