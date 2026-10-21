import {FONT_MONO, FONT_SANS, canvasTexture, grain, horizontalGradient, rng, rr, softGlow, text, verticalGradient, withAlpha} from '../canvas';

/* ------------------------------------------------------------------ */
/* Shared screen furniture                                             */
/* ------------------------------------------------------------------ */

const frame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  title: string,
  tint: string,
): void => {
  ctx.fillStyle = '#0e151b';
  ctx.fillRect(0, 0, width, height);
  verticalGradient(ctx, 0, 0, width, 40, [
    [0, '#1a242c'],
    [1, '#141d24'],
  ]);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 40, width, 2);
  ['#e0705f', '#e0b45a', '#7fbf9a'].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(24 + index * 20, 20, 5.5, 0, Math.PI * 2);
    ctx.fill();
  });
  text(ctx, title, 100, 26, {size: 15, weight: 600, font: FONT_MONO, color: '#9fb4be'});
  const random = rng(88);
  for (let index = 0; index < 3; index += 1) {
    ctx.fillStyle = 'rgba(159, 180, 190, 0.25)';
    ctx.fillRect(width - 140 + index * 34, 14, 24, 12);
  }
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(0, height - 22, width, 22);
  text(ctx, 'READY', width - 18, height - 7, {size: 11, weight: 600, font: FONT_MONO, color: '#6f8f9a', align: 'right'});
  text(ctx, 'UTF-8', 18, height - 7, {size: 11, weight: 600, font: FONT_MONO, color: '#6f8f9a'});
  void random;
};

const row = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  color: string,
  value?: string,
): void => {
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  rr(ctx, x, y, width, height, 3);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 3, height);
  text(ctx, label, x + 14, y + height / 2 + 5, {size: 13, weight: 600, font: FONT_MONO, color: '#c8d6dc'});
  if (value) text(ctx, value, x + width - 12, y + height / 2 + 5, {size: 12, weight: 600, font: FONT_MONO, color, align: 'right'});
};

const bar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  progress: number,
  color: string,
): void => {
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  rr(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = color;
  rr(ctx, x, y, Math.max(height, width * progress), height, height / 2);
  ctx.fill();
};

/* ------------------------------------------------------------------ */
/* Monitors                                                            */
/* ------------------------------------------------------------------ */

export const codeScreenTexture = (variant = 0): ReturnType<typeof canvasTexture> =>
  canvasTexture(`screen/code/${variant}`, 512, 320, (ctx, width, height) => {
    frame(ctx, width, height, variant === 0 ? 'pmu-api / app/main.py' : 'agent_loop.py', '#6f9fb8');
    const codeLines = [
      [['from', '#7fb8d8'], [' fastapi ', '#c8d6dc'], ['import', '#7fb8d8'], [' FastAPI', '#e0c48a']],
      [['from', '#7fb8d8'], [' pydantic ', '#c8d6dc'], ['import', '#7fb8d8'], [' BaseModel', '#e0c48a']],
      [['from', '#7fb8d8'], [' core.memory ', '#c8d6dc'], ['import', '#7fb8d8'], [' PMUStore', '#e0c48a']],
      [],
      [['class', '#d89a6a'], [' TaskRequest', '#e8e0c8'], ['(BaseModel):', '#c8d6dc']],
      [['    prompt: ', '#c8d6dc'], ['str', '#e0c48a']],
      [['    budget: ', '#c8d6dc'], ['int', '#e0c48a'], [' = ', '#c8d6dc'], ['1200', '#e0b45a']],
      [],
      [['@app', '#7fbf9a'], ['.post', '#7fb8d8'], ['("/execute")', '#c8d6dc']],
      [['async def', '#d89a6a'], [' execute', '#8fb8d8'], ['(req: TaskRequest):', '#c8d6dc']],
      [['    pmu = ', '#c8d6dc'], ['await', '#7fb8d8'], [' store', '#c8d6dc'], ['.resolve', '#8fb8d8'], ['(req)', '#c8d6dc']],
      [['    verdict = ', '#c8d6dc'], ['await', '#7fb8d8'], [' judge', '#c8d6dc'], ['.verify', '#8fb8d8'], ['(pmu)', '#c8d6dc']],
      [['    ', '#c8d6dc'], ['# candidate -> verified', '#6f8a92']],
      [['    return', '#d89a6a'], [' pmu.activate()', '#c8d6dc']],
      [],
      [['# trace replay keeps every step auditable', '#5f7a82']],
    ] as const;
    let x = 62;
    let y = 72;
    codeLines.forEach((tokens, index) => {
      text(ctx, `${index + 1}`.padStart(2, ' '), 22, y, {size: 12, weight: 500, font: FONT_MONO, color: '#4a626c'});
      x = 62;
      for (const [token, color] of tokens) {
        ctx.font = `500 13px ${FONT_MONO}`;
        text(ctx, token, x, y, {size: 13, weight: 500, font: FONT_MONO, color});
        x += ctx.measureText(token).width;
      }
      if (index === 11) {
        ctx.fillStyle = 'rgba(127, 191, 154, 0.10)';
        ctx.fillRect(50, y - 14, width - 62, 20);
      }
      y += 21;
    });
    // Minimap.
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(width - 84, 62, 64, 180);
    const random = rng(31);
    for (let index = 0; index < 26; index += 1) {
      ctx.fillStyle = withAlpha(['#6f9fb8', '#e0c48a', '#7fbf9a'][Math.floor(random() * 3)] ?? '#6f9fb8', 0.6);
      ctx.fillRect(width - 78 + random() * 12, 66 + index * 6.6, 18 + random() * 44, 3);
    }
    grain(ctx, width, height, {seed: 2, count: 900, alpha: 0.04, size: 1.2});
  });

export const graphScreenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('screen/graph', 512, 320, (ctx, width, height) => {
    frame(ctx, width, height, 'metadata-graph / neo4j', '#7fc8b8');
    const nodes = [
      ['PMU', 150, 110, '#8fb9c9', 20],
      ['SKILL', 300, 74, '#7fbf9a', 18],
      ['TASK', 386, 140, '#e0b45a', 16],
      ['ENV', 286, 202, '#a8b8d8', 14],
      ['GOAL', 132, 214, '#d89a8a', 15],
      ['EVIDENCE', 396, 244, '#7fc8b8', 12],
    ] as const;
    // Edges first.
    const edges = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [0, 4],
      [1, 5],
      [2, 5],
      [3, 5],
    ] as const;
    for (const [from, to] of edges) {
      const a = nodes[from];
      const b = nodes[to];
      if (!a || !b) continue;
      ctx.strokeStyle = 'rgba(127, 184, 196, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a[1], a[2]);
      ctx.lineTo(b[1], b[2]);
      ctx.stroke();
    }
    for (const [label, x, y, color, radius] of nodes) {
      softGlow(ctx, x, y, radius * 2.6, withAlpha(color, 0.25));
      ctx.fillStyle = withAlpha(color, 0.22);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, label, x, y + radius + 16, {size: 11, weight: 700, font: FONT_MONO, color: '#a8c4cc', align: 'center'});
    }
    // Side panel.
    ctx.fillStyle = 'rgba(8, 16, 20, 0.8)';
    rr(ctx, width - 132, 52, 118, 172, 4);
    ctx.fill();
    text(ctx, 'NODES', width - 120, 72, {size: 11, weight: 700, font: FONT_MONO, color: '#5f7f8a'});
    ['PMU 1,204', 'SKILL 86', 'TASK 412', 'ENV 39', 'GOAL 12', 'EDGE 3,880'].forEach((line, index) => {
      text(ctx, line, width - 120, 94 + index * 20, {size: 12, weight: 600, font: FONT_MONO, color: index < 2 ? '#9fd8c8' : '#7f99a4'});
    });
    text(ctx, 'TRACE / ACTIVE', 24, 62, {size: 12, weight: 700, font: FONT_MONO, color: '#7fbf9a'});
    grain(ctx, width, height, {seed: 5, count: 700, alpha: 0.035, size: 1.2});
  });

export const lifecycleScreenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('screen/lifecycle', 512, 320, (ctx, width, height) => {
    frame(ctx, width, height, 'pmu / lifecycle', '#9fc7d8');
    const states = [
      ['CANDIDATE', '#e0b45a', 60],
      ['VERIFIED', '#7fbf9a', 186],
      ['ACTIVE', '#7fc8d8', 312],
    ] as const;
    states.forEach(([label, color, x]) => {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      rr(ctx, x, 88, 110, 48, 5);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color, 0.8);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + 16, 112, 5, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, label, x + 28, 117, {size: 11, weight: 700, font: FONT_MONO, color: '#d8e4e8'});
    });
    for (let index = 0; index < 2; index += 1) {
      const from = 170 + index * 126;
      ctx.strokeStyle = 'rgba(159, 199, 216, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(from, 112);
      ctx.lineTo(from + 14, 112);
      ctx.stroke();
      ctx.fillStyle = 'rgba(159, 199, 216, 0.5)';
      ctx.beginPath();
      ctx.moveTo(from + 14, 112);
      ctx.lineTo(from + 6, 107);
      ctx.lineTo(from + 6, 117);
      ctx.fill();
    }
    text(ctx, 'TRANSITIONS', 24, 168, {size: 11, weight: 700, font: FONT_MONO, color: '#5f7f8a'});
    const logs = [
      'candidate → verify   PASS  risk=0.12',
      'verified → activate  PASS  reuse=14',
      'repair loop          1 cycle',
      'evidence nodes       28',
    ] as const;
    logs.forEach((line, index) => {
      text(ctx, line, 24, 192 + index * 22, {size: 12, weight: 500, font: FONT_MONO, color: index < 2 ? '#9fd8c8' : '#7f99a4'});
    });
    bar(ctx, 300, 196, 184, 8, 0.86, '#7fbf9a');
    bar(ctx, 300, 216, 184, 8, 0.42, '#e0b45a');
    bar(ctx, 300, 236, 184, 8, 0.64, '#7fc8d8');
    grain(ctx, width, height, {seed: 7, count: 700, alpha: 0.035, size: 1.2});
  });

export const dashboardScreenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('screen/dashboard', 512, 320, (ctx, width, height) => {
    frame(ctx, width, height, 'kg-service / overview', '#8fd4c8');
    const kpis = [
      ['15,240', 'ENTITIES', '#8fd4c8'],
      ['38,610', 'EDGES', '#a8d8b8'],
      ['92.4%', 'RECALL@5', '#e0c48a'],
    ] as const;
    kpis.forEach(([value, label, color], index) => {
      const x = 24 + index * 156;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      rr(ctx, x, 58, 140, 66, 5);
      ctx.fill();
      text(ctx, value, x + 14, 92, {size: 24, weight: 700, font: FONT_MONO, color});
      text(ctx, label, x + 14, 112, {size: 10, weight: 600, font: FONT_MONO, color: '#7f99a4', tracking: 1});
    });
    // Bar chart.
    const random = rng(712);
    for (let index = 0; index < 14; index += 1) {
      const heightValue = 18 + random() * 70;
      ctx.fillStyle = withAlpha(index > 10 ? '#e0c48a' : '#5f9f9a', 0.55);
      ctx.fillRect(28 + index * 20, 268 - heightValue, 12, heightValue);
    }
    text(ctx, 'INGEST / HOUR', 28, 290, {size: 10, weight: 600, font: FONT_MONO, color: '#5f7f8a'});
    // Line graph.
    ctx.strokeStyle = '#e0c48a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(330, 250);
    let value = 250;
    const random2 = rng(51);
    for (let index = 1; index < 14; index += 1) {
      value += (random2() - 0.55) * 26;
      ctx.lineTo(330 + index * 12, Math.max(220, Math.min(275, value)));
    }
    ctx.stroke();
    text(ctx, 'GRAPH GROWTH', 330, 292, {size: 10, weight: 600, font: FONT_MONO, color: '#5f7f8a'});
    grain(ctx, width, height, {seed: 11, count: 700, alpha: 0.035, size: 1.2});
  });

export const mapScreenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('screen/map', 512, 320, (ctx, width, height) => {
    frame(ctx, width, height, 'sop-map / region-07', '#8fd4c8');
    ctx.fillStyle = '#0f2028';
    ctx.fillRect(0, 42, width, height - 64);
    ctx.strokeStyle = 'rgba(120, 180, 190, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 34) {
      ctx.beginPath();
      ctx.moveTo(x, 42);
      ctx.lineTo(x, height - 22);
      ctx.stroke();
    }
    for (let y = 42; y < height; y += 34) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    const random = rng(808);
    const regions = [
      ['rgba(40, 92, 96, 0.85)', 40, 70, 190, 120],
      ['rgba(48, 84, 78, 0.85)', 260, 56, 150, 96],
      ['rgba(36, 76, 92, 0.85)', 330, 172, 150, 110],
      ['rgba(46, 82, 90, 0.7)', 70, 210, 220, 76],
    ] as const;
    for (const [color, x, y, w, h] of regions) {
      ctx.fillStyle = color;
      ctx.beginPath();
      const points = 8;
      for (let index = 0; index < points; index += 1) {
        const angle = (index / points) * Math.PI * 2;
        const px = x + w / 2 + Math.cos(angle) * (w / 2) * (0.78 + random() * 0.3);
        const py = y + h / 2 + Math.sin(angle) * (h / 2) * (0.78 + random() * 0.3);
        if (index === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(140, 210, 214, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // Route.
    ctx.strokeStyle = 'rgba(224, 196, 138, 0.85)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(92, 130);
    ctx.bezierCurveTo(180, 96, 260, 190, 360, 170);
    ctx.bezierCurveTo(420, 158, 430, 220, 440, 240);
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [x, y, color] of [
      [92, 130, '#e0c48a'],
      [360, 170, '#e0877a'],
      [440, 240, '#8fd4c8'],
    ] as const) {
      softGlow(ctx, x, y, 24, withAlpha(color, 0.8));
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(9, 20, 26, 0.86)';
    rr(ctx, 18, 254, 210, 48, 4);
    ctx.fill();
    text(ctx, 'ALERT / SOP-07', 30, 274, {size: 12, weight: 700, font: FONT_MONO, color: '#e0877a'});
    text(ctx, 'evacuation route · verified', 30, 292, {size: 11, weight: 500, font: FONT_MONO, color: '#7f99a4'});
    grain(ctx, width, height, {seed: 15, count: 700, alpha: 0.035, size: 1.2});
  });

export const terminalScreenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('screen/terminal', 512, 320, (ctx, width, height) => {
    frame(ctx, width, height, 'qa-terminal / evidence', '#8fd4c8');
    // User question bubble.
    ctx.fillStyle = 'rgba(143, 212, 200, 0.12)';
    rr(ctx, 26, 58, 300, 40, 6);
    ctx.fill();
    text(ctx, '台风预警发布后，学校应如何响应？', 40, 84, {size: 14, weight: 500, font: FONT_SANS, color: '#cfe8e2'});
    // Answer lines.
    const answerLines = [
      '1. 立即启动应急预案，通知在校师生；',
      '2. 停止户外活动，安排室内避险场所；',
      '3. 与属地应急部门保持信息同步。',
    ] as const;
    answerLines.forEach((line, index) => {
      text(ctx, line, 30, 126 + index * 24, {size: 13, weight: 500, font: FONT_SANS, color: '#b8ccd0'});
    });
    // Evidence chips.
    ['SOP-07 §3.2', 'SOP-07 §5.1', 'ANNEX-B §2'].forEach((line, index) => {
      const x = 30 + index * 116;
      ctx.strokeStyle = 'rgba(143, 212, 200, 0.5)';
      ctx.lineWidth = 1.5;
      rr(ctx, x, 216, 106, 24, 4);
      ctx.stroke();
      text(ctx, line, x + 10, 232, {size: 10, weight: 600, font: FONT_MONO, color: '#8fd4c8'});
    });
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    rr(ctx, 26, 260, 460, 28, 5);
    ctx.fill();
    text(ctx, '追问 evidence 追踪 …', 40, 279, {size: 12, weight: 500, font: FONT_SANS, color: '#6f8f9a'});
    ctx.fillStyle = 'rgba(143, 212, 200, 0.3)';
    ctx.fillRect(26, 250, 460, 1.5);
    grain(ctx, width, height, {seed: 17, count: 700, alpha: 0.035, size: 1.2});
  });

export const agentScreenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('screen/agents', 512, 320, (ctx, width, height) => {
    frame(ctx, width, height, 'message-bus / agent trace', '#e0877a');
    const agents = [
      ['A1', 42, 88, '#7fc8b8', 'PLANNER'],
      ['A2', 144, 88, '#7fc8b8', 'RETRIEVER'],
      ['A3', 246, 88, '#e0b45a', 'TOOL'],
      ['A4', 348, 88, '#e0877a', 'REFLECT'],
      ['A5', 450, 88, '#7fc8b8', 'FINAL'],
    ] as const;
    for (const [id, x, y, color, label] of agents) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      rr(ctx, x - 34, y - 30, 68, 74, 5);
      ctx.fill();
      ctx.strokeStyle = withAlpha(color, 0.7);
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y - 12, 6, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, id, x, y + 14, {size: 16, weight: 700, font: FONT_MONO, color: '#d8e4e8', align: 'center'});
      text(ctx, label, x, y + 32, {size: 8, weight: 600, font: FONT_MONO, color: '#7f99a4', align: 'center', tracking: 1});
    }
    // Chain arrows with one tainted path.
    for (let index = 0; index < agents.length - 1; index += 1) {
      const from = agents[index];
      const to = agents[index + 1];
      if (!from || !to) continue;
      const tainted = index === 2;
      ctx.strokeStyle = tainted ? 'rgba(224, 135, 122, 0.9)' : 'rgba(127, 200, 184, 0.5)';
      ctx.lineWidth = tainted ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(from[1] + 36, from[2] - 8);
      ctx.lineTo(to[1] - 36, to[2] - 8);
      ctx.stroke();
      ctx.fillStyle = tainted ? '#e0877a' : 'rgba(127, 200, 184, 0.5)';
      ctx.beginPath();
      ctx.arc((from[1] + to[1]) / 2, from[2] - 8, tainted ? 3.5 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Detection rows.
    const detections = [
      ['L1 REGEX', 'INJECTION', 'BLOCK', '#e0877a'],
      ['L2 VECTOR', 'RAG POISON', 'BLOCK', '#e0877a'],
      ['L3 INTENT', 'TOOL ABUSE', 'REVIEW', '#e0b45a'],
      ['GUARD VOTE', '4 / 7 VETO', 'CONTAIN', '#7fc8b8'],
    ] as const;
    detections.forEach(([stage, signal, action, color], index) => {
      const y = 178 + index * 28;
      ctx.fillStyle = index % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, y - 16, width, 24);
      text(ctx, stage, 24, y, {size: 11, weight: 700, font: FONT_MONO, color: '#8fa4ae'});
      text(ctx, signal, 150, y, {size: 11, weight: 600, font: FONT_MONO, color: '#c8d6dc'});
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(392, y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, action, 402, y, {size: 11, weight: 700, font: FONT_MONO, color});
    });
    grain(ctx, width, height, {seed: 21, count: 700, alpha: 0.035, size: 1.2});
  });

export const detectionScreenTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('screen/detection', 512, 320, (ctx, width, height) => {
    frame(ctx, width, height, 'guard-pipeline / L1-L3', '#e0b45a');
    const stages = [
      ['L1  REGEX', 0.82, '#7fbf9a', 'PASS'],
      ['L2  VECTOR', 0.64, '#e0b45a', 'SCAN'],
      ['L3  INTENT', 0.38, '#e0877a', 'BLOCK'],
    ] as const;
    stages.forEach(([label, progress, color, status], index) => {
      const y = 80 + index * 58;
      text(ctx, label, 30, y, {size: 13, weight: 700, font: FONT_MONO, color: '#c8d6dc'});
      bar(ctx, 140, y - 12, 280, 14, progress, color);
      text(ctx, status, 440, y, {size: 12, weight: 700, font: FONT_MONO, color, align: 'right'});
    });
    text(ctx, 'CONTAINMENT REGISTRY', 30, 224, {size: 11, weight: 700, font: FONT_MONO, color: '#5f7f8a'});
    const rows = [
      ['node:A4', 'QUARANTINED', '#e0877a'],
      ['edge:A3→A4', 'SEVERED', '#e0877a'],
      ['key:memory/ctx', 'FROZEN', '#e0b45a'],
      ['tool:web_fetch', 'RESTRICTED', '#7fc8b8'],
    ] as const;
    rows.forEach(([label, status, color], index) => {
      row(ctx, 24, 232 + index * 16, 210, 14, label, color);
      text(ctx, status, 250, 243 + index * 16, {size: 10, weight: 700, font: FONT_MONO, color});
    });
    ctx.strokeStyle = 'rgba(224, 135, 122, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 44, width - 36, height - 90);
    grain(ctx, width, height, {seed: 23, count: 700, alpha: 0.035, size: 1.2});
  });

/** Tiny glowing screen glow decal used on top of monitors. */
export const screenGlowTexture = (color: string): ReturnType<typeof canvasTexture> =>
  canvasTexture(`screen/glow/${color}`, 128, 128, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    softGlow(ctx, width / 2, height / 2, width / 2, color, 0.5);
  });

export const clockFaceTexture = (): ReturnType<typeof canvasTexture> =>
  canvasTexture('screen/clock', 256, 256, (ctx, width, height) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#e8e4d6';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 118, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2e3438';
    ctx.lineWidth = 6;
    ctx.stroke();
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const inner = index % 3 === 0 ? 84 : 96;
      ctx.strokeStyle = '#3a4046';
      ctx.lineWidth = index % 3 === 0 ? 5 : 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 + Math.cos(angle) * inner, height / 2 + Math.sin(angle) * inner);
      ctx.lineTo(width / 2 + Math.cos(angle) * 108, height / 2 + Math.sin(angle) * 108);
      ctx.stroke();
    }
    ctx.strokeStyle = '#2e3438';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.lineTo(width / 2 + 38, height / 2 - 46);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2);
    ctx.lineTo(width / 2 + 54, height / 2 + 20);
    ctx.stroke();
    ctx.fillStyle = '#c8402f';
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 7, 0, Math.PI * 2);
    ctx.fill();
  });

/** Tall LED strip texture for status lights / server racks. */
export const ledStripTexture = (seed = 1, color = '#7fbf9a'): ReturnType<typeof canvasTexture> =>
  canvasTexture(`screen/led/${seed}/${color}`, 64, 256, (ctx, width, height) => {
    ctx.fillStyle = '#141a1e';
    ctx.fillRect(0, 0, width, height);
    const random = rng(seed * 97 + 3);
    for (let index = 0; index < 22; index += 1) {
      const y = 10 + index * 11;
      const on = random() > 0.35;
      ctx.fillStyle = on ? color : 'rgba(80, 100, 108, 0.25)';
      ctx.fillRect(14, y, width - 28, 4);
      if (on) softGlow(ctx, width / 2, y + 2, 14, withAlpha(color, 0.5));
    }
    horizontalGradient(ctx, 0, 0, width, height, [
      [0, 'rgba(255,255,255,0.05)'],
      [1, 'rgba(0,0,0,0.12)'],
    ]);
  });
