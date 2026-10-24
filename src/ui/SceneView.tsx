import {lazy} from 'react';
import type {SceneId} from '../data/scenes';
import {getScene} from '../data/scenes';
import type {DemoControl} from './ProjectDossier';
import {ProjectStory} from '../three/ProjectStory';
import {DeskBookmark, EvidenceDetails, MemoryDetails, ShopLife, WorkshopDetails} from '../three/LivingDetails';

/**
 * Each diorama is its own chunk: the hero only downloads the rainy konbini,
 * and collection scenes load as their cards approach the viewport.
 */
const KonbiniScene = lazy(() => import('../scenes/konbini/KonbiniScene').then((module) => ({default: module.KonbiniScene})));
const DeskScene = lazy(() => import('../scenes/desk/DeskScene').then((module) => ({default: module.DeskScene})));
const ArchiveScene = lazy(() => import('../scenes/archive/ArchiveScene').then((module) => ({default: module.ArchiveScene})));
const CommandScene = lazy(() => import('../scenes/command/CommandScene').then((module) => ({default: module.CommandScene})));
const SecurityScene = lazy(() => import('../scenes/security/SecurityScene').then((module) => ({default: module.SecurityScene})));
const WorkshopScene = lazy(() => import('../scenes/workshop/WorkshopScene').then((module) => ({default: module.WorkshopScene})));
const PostboxScene = lazy(() => import('../scenes/postbox/PostboxScene').then((module) => ({default: module.PostboxScene})));

const sceneComponents = {
  konbini: KonbiniScene,
  desk: DeskScene,
  archive: ArchiveScene,
  command: CommandScene,
  security: SecurityScene,
  workshop: WorkshopScene,
  postbox: PostboxScene,
} as const;

export const SceneView = ({id, story}: {id: SceneId; story?: DemoControl}) => {
  const Component = sceneComponents[id];
  const projectId = getScene(id).projectId;
  return (
    <>
      {id === 'security' ? <SecurityScene demo={story} /> : <Component />}
      {id === 'konbini' ? <ShopLife /> : null}
      {id === 'archive' ? <MemoryDetails control={story} /> : null}
      {id === 'command' ? <EvidenceDetails control={story} /> : null}
      {id === 'desk' ? <DeskBookmark /> : null}
      {id === 'workshop' ? <WorkshopDetails /> : null}
      {projectId && story ? <ProjectStory projectId={projectId} control={story} /> : null}
    </>
  );
};
