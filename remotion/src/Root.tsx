import {Composition} from 'remotion';
import {CinematicIntro} from './compositions/CinematicIntro';
import {PortfolioTeaser} from './compositions/PortfolioTeaser';
import {VerticalTeaser} from './compositions/VerticalTeaser';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CinematicIntro" component={CinematicIntro} durationInFrames={240} fps={30} width={1920} height={1080} />
    <Composition id="PortfolioTeaser" component={PortfolioTeaser} durationInFrames={450} fps={30} width={1920} height={1080} />
    <Composition id="VerticalTeaser" component={VerticalTeaser} durationInFrames={450} fps={30} width={1080} height={1920} />
  </>
);
