import piexif from "piexifjs";

export function uint8ToBase64(u8) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToUint8(b64) {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function reencodeJpeg(blob, quality = 0.95) {
  const imgUrl = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imgUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const base64 = dataUrl.split(',')[1];
    const outBytes = base64ToUint8(base64);
    return new Blob([outBytes], { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

function buildXmpPacket({ title = "", description = "", keywords = [] }) {
  const esc = (s) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  const kwXml = (keywords || []).map(k => `<rdf:li>${esc(String(k))}</rdf:li>`).join('');
  const xml = `<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">
  <rdf:Description>
    <dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(title)}</rdf:li></rdf:Alt></dc:title>
    <dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(description)}</rdf:li></rdf:Alt></dc:description>
    <dc:subject><rdf:Bag>${kwXml}</rdf:Bag></dc:subject>
    <photoshop:Headline>${esc(title)}</photoshop:Headline>
    <photoshop:Description>${esc(description)}</photoshop:Description>
    <photoshop:Keywords><rdf:Bag>${kwXml}</rdf:Bag></photoshop:Keywords>
  </rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  return new TextEncoder().encode(xml);
}

function matchXmpHeader(bytes, start, headerBytes) {
  if (start + headerBytes.length > bytes.length) return false;
  for (let i = 0; i < headerBytes.length; i++) {
    if (bytes[start + i] !== headerBytes[i]) return false;
  }
  return true;
}

function insertXmpIntoJpegBytes(bytes, xmpUtf8Bytes) {
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return bytes; // not JPEG
  const headerStr = "http://ns.adobe.com/xap/1.0/\0";
  const headerBytes = new TextEncoder().encode(headerStr);
  const payloadLen = headerBytes.length + xmpUtf8Bytes.length;
  const app1Len = payloadLen + 2; // includes these two length bytes
  const app1 = new Uint8Array(2 + 2 + payloadLen);
  app1[0] = 0xFF; app1[1] = 0xE1; // APP1 marker
  app1[2] = (app1Len >> 8) & 0xFF; app1[3] = app1Len & 0xFF;
  app1.set(headerBytes, 4);
  app1.set(xmpUtf8Bytes, 4 + headerBytes.length);

  // Find insertion point: after APP0/APP1 segments, before SOS (0xDA)
  let pos = 2;
  while (pos + 4 < bytes.length && bytes[pos] === 0xFF) {
    const marker = bytes[pos + 1];
    if (marker === 0xDA) break; // SOS
    if (marker >= 0xD0 && marker <= 0xD7) { pos += 2; continue; } // RSTn
    if (marker === 0x01 || marker === 0x00) { pos += 2; continue; }
    if (marker >= 0xE0 && marker <= 0xEF) {
      const len = (bytes[pos + 2] << 8) | bytes[pos + 3];
      if (marker === 0xE1) {
        const segStart = pos + 4;
        const segEnd = pos + 2 + len;
        const isXmp = matchXmpHeader(bytes, segStart, headerBytes);
        if (isXmp) {
          const before = bytes.slice(0, pos);
          const after = bytes.slice(segEnd);
          const tmp = new Uint8Array(before.length + after.length);
          tmp.set(before, 0); tmp.set(after, before.length);
          bytes = tmp;
          continue;
        }
      }
      pos += 2 + len;
      continue;
    }
    break;
  }
  const before = bytes.slice(0, pos);
  const after = bytes.slice(pos);
  const out = new Uint8Array(before.length + app1.length + after.length);
  out.set(before, 0);
  out.set(app1, before.length);
  out.set(after, before.length + app1.length);
  return out;
}

// Build minimal IPTC IIM block with UTF-8 charset tag (1:90) and Caption/Abstract (2:120)
function buildIptcIim({ caption = "" }) {
  const encoder = new TextEncoder();
  // CodedCharacterSet (1:90) value for UTF-8: ESC % G
  const codedCharSet = new Uint8Array([0x1B, 0x25, 0x47]);
  function dataset(record, tag, data) {
    const len = data.length;
    const out = new Uint8Array(5 + len);
    out[0] = 0x1C; // marker
    out[1] = record & 0xFF;
    out[2] = tag & 0xFF;
    out[3] = (len >> 8) & 0xFF;
    out[4] = len & 0xFF;
    out.set(data, 5);
    return out;
  }
  const dsCharset = dataset(1, 90, codedCharSet);
  const dsCaption = dataset(2, 120, encoder.encode(caption));
  const total = new Uint8Array(dsCharset.length + dsCaption.length);
  total.set(dsCharset, 0);
  total.set(dsCaption, dsCharset.length);
  return total;
}

// Wrap IPTC IIM inside Photoshop IRB (8BIM, resource ID 0x0404) and then into APP13
function insertIptcIntoJpegBytes(bytes, iptcData) {
  if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) return bytes; // not JPEG
  const ascii = (s) => new TextEncoder().encode(s);
  const header = ascii("Photoshop 3.0\0");
  const sig = ascii("8BIM");
  const resId = 0x0404;
  // Pascal string name: empty (0), pad to even
  const nameLen = 0; // empty name
  const nameField = new Uint8Array([0]); // length byte 0, already even length (1), will pad later
  const namePad = (nameField.length % 2 === 0) ? new Uint8Array(0) : new Uint8Array(1);
  const sizeBytes = new Uint8Array(4);
  const dataLen = iptcData.length;
  sizeBytes[0] = (dataLen >>> 24) & 0xFF;
  sizeBytes[1] = (dataLen >>> 16) & 0xFF;
  sizeBytes[2] = (dataLen >>> 8) & 0xFF;
  sizeBytes[3] = dataLen & 0xFF;
  const dataPad = (dataLen % 2 === 1) ? new Uint8Array(1) : new Uint8Array(0);

  const irbLen = sig.length + 2 + nameField.length + namePad.length + 4 + dataLen + dataPad.length;
  const irb = new Uint8Array(header.length + irbLen);
  let p = 0;
  irb.set(header, p); p += header.length;
  irb.set(sig, p); p += sig.length;
  irb[p++] = (resId >> 8) & 0xFF; irb[p++] = resId & 0xFF;
  irb.set(nameField, p); p += nameField.length;
  irb.set(namePad, p); p += namePad.length;
  irb.set(sizeBytes, p); p += 4;
  irb.set(iptcData, p); p += iptcData.length;
  irb.set(dataPad, p); p += dataPad.length;

  const app13PayloadLen = irb.length;
  const app13Len = app13PayloadLen + 2; // includes length bytes
  const app13 = new Uint8Array(2 + 2 + app13PayloadLen);
  app13[0] = 0xFF; app13[1] = 0xED; // APP13
  app13[2] = (app13Len >> 8) & 0xFF; app13[3] = app13Len & 0xFF;
  app13.set(irb, 4);

  // Remove existing APP13 8BIM:0404 if present, then insert before SOS
  let pos = 2;
  while (pos + 4 < bytes.length && bytes[pos] === 0xFF) {
    const marker = bytes[pos + 1];
    if (marker === 0xDA) break; // SOS
    if (marker >= 0xE0 && marker <= 0xEF) {
      const len = (bytes[pos + 2] << 8) | bytes[pos + 3];
      if (marker === 0xED) {
        const segStart = pos + 4;
        const segEnd = pos + 2 + len;
        // Check Photoshop 3.0 header
        const isPs = (function() {
          if (segStart + 13 > bytes.length) return false;
          const hdr = new TextDecoder().decode(bytes.slice(segStart, segStart + 13));
          return hdr === "Photoshop 3.0\0";
        })();
        if (isPs) {
          const before = bytes.slice(0, pos);
          const after = bytes.slice(segEnd);
          const tmp = new Uint8Array(before.length + after.length);
          tmp.set(before, 0); tmp.set(after, before.length);
          bytes = tmp;
          // do not advance pos to allow continued scanning
          continue;
        }
      }
      pos += 2 + len;
      continue;
    }
    if (marker >= 0xD0 && marker <= 0xD7) { pos += 2; continue; }
    if (marker === 0x01 || marker === 0x00) { pos += 2; continue; }
    break;
  }

  const before = bytes.slice(0, pos);
  const after = bytes.slice(pos);
  const out = new Uint8Array(before.length + app13.length + after.length);
  out.set(before, 0);
  out.set(app13, before.length);
  out.set(after, before.length + app13.length);
  return out;
}

function insertXmpIntoJpegDataUrl(dataUrl, { title = "", description = "", keywords = [] }) {
  try {
    const b64 = dataUrl.split(',')[1];
    const bytes = base64ToUint8(b64);
    const withXmp = insertXmpIntoJpegBytes(bytes, buildXmpPacket({ title, description, keywords }));
    const outB64 = uint8ToBase64(withXmp);
    return `data:image/jpeg;base64,${outB64}`;
  } catch (_) {
    return dataUrl;
  }
}

export async function embedExifIntoJpegBlob(inputBlob, { title = "", description = "", keywords = [], cameraShotDate = "" }) {
  let arrayBuffer = await inputBlob.arrayBuffer();
  let bytes = new Uint8Array(arrayBuffer);
  let dataUrl = `data:image/jpeg;base64,${uint8ToBase64(bytes)}`;
  let exifObj;
  try {
    exifObj = piexif.load(dataUrl);
  } catch (_) {
    const re = await reencodeJpeg(inputBlob, 0.95);
    arrayBuffer = await re.arrayBuffer();
    bytes = new Uint8Array(arrayBuffer);
    dataUrl = `data:image/jpeg;base64,${uint8ToBase64(bytes)}`;
    exifObj = piexif.load(dataUrl);
  }
  const toUCS2 = (str) => {
    const out = [];
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      out.push(code & 0xFF, (code >> 8) & 0xFF);
    }
    out.push(0, 0);
    return out;
  };
  exifObj['0th'] = exifObj['0th'] || {};
  exifObj['0th'][piexif.ImageIFD.ImageDescription] = description || "";
  if (title) {
    exifObj['0th'][piexif.ImageIFD.XPTitle] = toUCS2(title);
    if (piexif.ImageIFD.XPSubject) exifObj['0th'][piexif.ImageIFD.XPSubject] = toUCS2(title);
  }
  if (description) exifObj['0th'][piexif.ImageIFD.XPComment] = toUCS2(description);
  if (keywords?.length) exifObj['0th'][piexif.ImageIFD.XPKeywords] = toUCS2(keywords.join(';'));

  const exifBytes = piexif.dump(exifObj);
  const newDataUrl = piexif.insert(exifBytes, dataUrl);
  const xmpDataUrl = insertXmpIntoJpegDataUrl(newDataUrl, { title, description, keywords });
  const base64 = xmpDataUrl.split(',')[1];
  let outBytes = base64ToUint8(base64);

  // Insert IPTC (APP13) with Caption/Abstract for broader compatibility (e.g., iStock/DeepMeta)
  try {
    const iptc = buildIptcIim({ caption: description || "" });
    outBytes = insertIptcIntoJpegBytes(outBytes, iptc);
  } catch (_) {
    // Ignore IPTC write failures to keep flow resilient
  }

  return new Blob([outBytes], { type: 'image/jpeg' });
}


