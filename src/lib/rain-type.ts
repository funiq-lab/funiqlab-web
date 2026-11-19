// Draw the laid-out lines at their DOM positions so the rain can sample real
// letter strokes, including wrapping and fallback fonts in both languages.
export function paintRainType(ctx: CanvasRenderingContext2D, element: HTMLElement, origin: DOMRect) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    const parent = text.parentElement;
    if (!parent || !text.textContent?.trim()) continue;
    const style = getComputedStyle(parent);
    ctx.font = [style.fontWeight, style.fontSize, style.fontFamily].join(' ');
    ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    ctx.fillStyle = '#efefef';
    const ascent = ctx.measureText(text.textContent).fontBoundingBoxAscent;
    let line = '', x = 0, y = 0;
    for (let i = 0; i < text.textContent.length; i++) {
      range.setStart(text,i);
      range.setEnd(text,i+1);
      const rect = range.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      // DOM text ranges enclose the font box, not the block's line box.
      if (!line || Math.abs(rect.top - y) > 1) {
        if (line) ctx.fillText(line,x-origin.left,y-origin.top+ascent);
        x = rect.left;
        y = rect.top;
        line = '';
      }
      line += text.textContent[i];
    }
    if (line) ctx.fillText(line,x-origin.left,y-origin.top+ascent);
  }
}
