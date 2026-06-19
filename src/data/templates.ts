/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DrawingTemplate {
  id: string;
  titleAr: string;
  descriptionAr: string;
  icon: string;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
}

// Draw a very simple, child-like car scribble (as if a kid drew it)
function drawChildishCar(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Messy car body
  ctx.moveTo(width * 0.15, height * 0.6);
  ctx.lineTo(width * 0.2, height * 0.45);
  ctx.lineTo(width * 0.4, height * 0.45);
  ctx.lineTo(width * 0.45, height * 0.35);
  ctx.lineTo(width * 0.75, height * 0.35);
  ctx.lineTo(width * 0.82, height * 0.48);
  ctx.lineTo(width * 0.88, height * 0.6);
  ctx.closePath();
  ctx.stroke();

  // Messy wheels
  ctx.beginPath();
  ctx.arc(width * 0.35, height * 0.62, 45, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(width * 0.68, height * 0.62, 45, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.stroke();

  // Messy windows
  ctx.beginPath();
  ctx.moveTo(width * 0.48, height * 0.38);
  ctx.lineTo(width * 0.6, height * 0.38);
  ctx.lineTo(width * 0.6, height * 0.46);
  ctx.lineTo(width * 0.48, height * 0.46);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

// Draw a very simple, child-like house and sun scribble
function drawChildishHouse(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // The house box
  ctx.beginPath();
  ctx.rect(width * 0.25, height * 0.45, width * 0.5, height * 0.3);
  ctx.stroke();

  // Triangular roof (slightly crooked like a kid's drawing)
  ctx.beginPath();
  ctx.moveTo(width * 0.2, height * 0.45);
  ctx.lineTo(width * 0.5, height * 0.22);
  ctx.lineTo(width * 0.8, height * 0.45);
  ctx.closePath();
  ctx.stroke();

  // Crooked door
  ctx.beginPath();
  ctx.rect(width * 0.45, height * 0.58, width * 0.14, height * 0.17);
  ctx.stroke();

  // Splayed sun in the corner
  ctx.beginPath();
  ctx.arc(width * 0.78, height * 0.15, 35, 0, Math.PI * 2);
  ctx.stroke();

  // Messy sunbeams
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const startX = width * 0.78 + Math.cos(angle) * 45;
    const startY = height * 0.15 + Math.sin(angle) * 45;
    const endX = width * 0.78 + Math.cos(angle) * 75;
    const endY = height * 0.15 + Math.sin(angle) * 75;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  ctx.restore();
}

// Draw a very simple kid-like cute kitten scribble
function drawChildishKitten(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Head circle
  ctx.beginPath();
  ctx.arc(width * 0.5, height * 0.42, 120, 0, Math.PI * 2);
  ctx.stroke();

  // Left messy ears
  ctx.beginPath();
  ctx.moveTo(width * 0.38, height * 0.33);
  ctx.lineTo(width * 0.34, height * 0.15);
  ctx.lineTo(width * 0.46, height * 0.28);
  ctx.stroke();

  // Right messy ears
  ctx.beginPath();
  ctx.moveTo(width * 0.62, height * 0.33);
  ctx.lineTo(width * 0.66, height * 0.15);
  ctx.lineTo(width * 0.54, height * 0.28);
  ctx.stroke();

  // Simple dot eyes
  ctx.beginPath();
  ctx.arc(width * 0.44, height * 0.4, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#222222';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(width * 0.56, height * 0.4, 10, 0, Math.PI * 2);
  ctx.fillStyle = '#222222';
  ctx.fill();

  // Crooked nose and mouth
  ctx.beginPath();
  ctx.moveTo(width * 0.5, height * 0.44);
  ctx.lineTo(width * 0.47, height * 0.48);
  ctx.moveTo(width * 0.5, height * 0.44);
  ctx.lineTo(width * 0.53, height * 0.48);
  ctx.stroke();

  // Whiskers (crooked)
  ctx.beginPath();
  ctx.moveTo(width * 0.38, height * 0.45);
  ctx.lineTo(width * 0.24, height * 0.43);
  ctx.moveTo(width * 0.38, height * 0.47);
  ctx.lineTo(width * 0.23, height * 0.49);

  ctx.moveTo(width * 0.62, height * 0.45);
  ctx.lineTo(width * 0.76, height * 0.43);
  ctx.moveTo(width * 0.62, height * 0.47);
  ctx.lineTo(width * 0.77, height * 0.49);
  ctx.stroke();

  ctx.restore();
}

export const coloringTemplates: DrawingTemplate[] = [
  {
    id: 'blank',
    titleAr: 'ورقة بيضاء فارغة ✏️',
    descriptionAr: 'ابدأ بالرسم الحر من الصفر تماماً واصنع خربوشتك الفريدة لتشغيل السحر عليها!',
    icon: '✨',
    draw: () => {}
  },
  {
    id: 'car',
    titleAr: 'خربوشة سيّارة كرتونية',
    descriptionAr: 'هيكل سيارة وعجلات بسيطة جاهزة لتشغيل سحر الذكاء الاصطناعي عليها لتتحول لسيارة سباق حقيقية!',
    icon: '🚗',
    draw: drawChildishCar
  },
  {
    id: 'house',
    titleAr: 'خربوشة منزل دافئ وشمس',
    descriptionAr: 'بيت لطيف وسقف مائل مع شمس دافئة بانتظار لمسة السحر الذكي للذكاء الاصطناعي!',
    icon: '🏠',
    draw: drawChildishHouse
  },
  {
    id: 'kitten',
    titleAr: 'خربوشة قطّة صغيرة ودودة',
    descriptionAr: 'رأس قطّة بأذنين مائلتين وشاربين لطيفين للتحول لهرّة واقعية وفائقة الجمال بالذكاء الاصطناعي!',
    icon: '🐱',
    draw: drawChildishKitten
  }
];
