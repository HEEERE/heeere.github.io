import type {ProjectId} from './projects';

export type SceneId = 'konbini' | 'desk' | 'archive' | 'command' | 'security' | 'workshop' | 'postbox';
export type SceneKind = 'world' | 'about' | 'project' | 'stack' | 'contact';

export type CameraView = {
  /** Horizontal angle in degrees, 0 looks from +Z. */
  azimuth: number;
  /** Vertical angle in degrees. */
  elevation: number;
  target: readonly [number, number, number];
  /** Extra framing room around the bounding box, 1 = exactly fit. */
  padding?: number;
  /** How far the camera may orbit horizontally, in radians. */
  azimuthRange?: number;
};

export type SceneMeta = {
  id: SceneId;
  index: string;
  nameZh: string;
  nameEn: string;
  nameJp: string;
  kind: SceneKind;
  kindLabel: string;
  tagline: string;
  description: string;
  accent: string;
  glow: string;
  projectId?: ProjectId;
  camera: CameraView;
};

export const scenes: readonly SceneMeta[] = [
  {
    id: 'konbini',
    index: '01',
    nameZh: '雨夜便利店',
    nameEn: 'RAINY KONBINI',
    nameJp: '雨の夜のコンビニ',
    kind: 'world',
    kindLabel: 'WORLD / ENTRANCE',
    tagline: '雨下了一整晚，店里的灯没关。',
    description:
      '街角的便利店，斑马线、贩卖机和一辆靠在墙边的自行车都在雨里。透过玻璃能看到货架、冰柜和收银台，自动门隔一阵开一次，里面的灯把门口的地面照成暖黄色。',
    accent: '#ffc078',
    glow: '#ff9a4d',
    camera: {azimuth: 35, elevation: 23, target: [0, 0.58, -0.1], padding: 0.95, azimuthRange: 0.46},
  },
  {
    id: 'desk',
    index: '02',
    nameZh: '学习工作台',
    nameEn: 'DESK WORKSPACE',
    nameJp: '机の上の灯り',
    kind: 'about',
    kindLabel: 'ABOUT / PROFILE',
    tagline: '台灯开着，代码还没写完。',
    description:
      '书桌靠着窗，显示器、台灯、键盘和一杯凉掉的咖啡都摆在桌上。旁边摞着书和笔记本，墙上贴着便签、日历和打印出来的资料，晚上写代码和看论文都在这里。',
    accent: '#d8b98c',
    glow: '#e2a35f',
    camera: {azimuth: 21, elevation: 20, target: [0, 0.7, -0.12], padding: 1.0},
  },
  {
    id: 'archive',
    index: '03',
    nameZh: '记忆档案室',
    nameEn: 'MEMORY ARCHIVE',
    nameJp: '記憶のアーカイブ',
    kind: 'project',
    kindLabel: 'PROJECT 01',
    tagline: '任务跑完以后，过程会被收进抽屉。',
    description:
      '档案室改的工作间：铁皮文件柜、卡片柜和几块状态灯牌，中间是一台带指示灯的记忆装置，数据顺着线缆传出来。墙上挂着 Candidate、Verified、Active 三个阶段，方便随时核对。',
    accent: '#9fc7d8',
    glow: '#6fa9c4',
    projectId: 'pmu',
    camera: {azimuth: 8, elevation: 21, target: [0, 0.78, -0.15], padding: 1.12},
  },
  {
    id: 'command',
    index: '04',
    nameZh: '应急指挥室',
    nameEn: 'EMERGENCY COMMAND',
    nameJp: '指令室の夜',
    kind: 'project',
    kindLabel: 'PROJECT 02',
    tagline: '预案里的规则，最后都落到屏幕上。',
    description:
      '指挥室不大：一面墙是地图大屏，三块屏幕分别看文档解析、实体抽取和图谱关系，长桌上摊着预案手册和打印的流程图。回答问题的时候，能查到引用了哪一条。',
    accent: '#8fd4c8',
    glow: '#5fbfae',
    projectId: 'ekg',
    camera: {azimuth: 4, elevation: 22, target: [0, 0.82, -0.15], padding: 1.12},
  },
  {
    id: 'security',
    index: '05',
    nameZh: '防御实验室',
    nameEn: 'DEFENSE LAB',
    nameJp: '防御ラボ',
    kind: 'project',
    kindLabel: 'PROJECT 03',
    tagline: '被污染的上下文，在闸门前停下。',
    description:
      '实验室里隔出一间玻璃舱，三台 Agent 模块摆在架子上，门口是检测门和红色扫描口。一段被污染的数据顺着线缆传过来，在闸门处被拦下，旁边的警示灯一直在闪。',
    accent: '#e0877a',
    glow: '#d4635a',
    projectId: 'security',
    camera: {azimuth: -7, elevation: 20, target: [0, 0.8, -0.15], padding: 1.12},
  },
  {
    id: 'workshop',
    index: '06',
    nameZh: '工具工坊',
    nameEn: 'TOOL WORKSHOP',
    nameJp: '道具の仕事場',
    kind: 'stack',
    kindLabel: 'STACK / SKILLS',
    tagline: '工具挂在墙上，抽屉贴着标签。',
    description:
      '工具墙、八层抽屉和一台小机柜，抽屉上写着 Python、FastAPI、Neo4j、Docker 这些名字。桌上放着显示器和焊台，白板上还留着一版没擦干净的架构草图。',
    accent: '#dcc38a',
    glow: '#c9a45c',
    camera: {azimuth: 17, elevation: 20, target: [0, 0.72, -0.12], padding: 1.0},
  },
  {
    id: 'postbox',
    index: '07',
    nameZh: '街角邮箱',
    nameEn: 'POSTBOX CORNER',
    nameJp: 'ポストのある街角',
    kind: 'contact',
    kindLabel: 'CONTACT',
    tagline: '路口的邮筒，和一台还能用的电话亭。',
    description:
      '路口有红色邮筒、绿色电话亭、一盏路灯和一条长椅，旁边是家开到很晚的咖啡馆。雨刚停，地砖上还有水，树叶也是湿的。',
    accent: '#e8b384',
    glow: '#d99155',
    camera: {azimuth: 30, elevation: 19, target: [0, 0.5, 0], padding: 0.92},
  },
] as const;

export const mainScenes = scenes.filter((scene) => scene.kind !== 'world');
export const konbiniScene = scenes[0] as SceneMeta;

export const getScene = (id: SceneId): SceneMeta => {
  const scene = scenes.find((item) => item.id === id);
  if (!scene) throw new Error(`Unknown scene: ${id}`);
  return scene;
};
