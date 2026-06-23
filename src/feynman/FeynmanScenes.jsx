import React from 'react';
import { Stage } from '../engine/Stage.jsx';
import { Sprite } from '../engine/timeline.jsx';
import { FY_DUR } from './constants.js';
import { GridGlow, Vignette } from './FeynmanPath.jsx';
import { Sections, NarrationBar } from './overlays.jsx';
import { TitleScene } from './scenes/Title.jsx';
import { SinglePathScene } from './scenes/SinglePath.jsx';
import { GluonSplitScene } from './scenes/GluonSplit.jsx';
import { AnnounceScene, GridScene } from './scenes/SumOverPaths.jsx';
import { TimeSliceScene } from './scenes/TimeSlice.jsx';
import { ClimaxScene } from './scenes/Climax.jsx';
import { PhasorScene } from './scenes/Phasor.jsx';

/**
 * Feynman path-integral animation — Strong Interaction (QCD), lecture edition.
 *
 * 82 seconds, 16:9 (1280×720), six sections:
 *   01 One Path · 02 Gluon Self-Coupling · 03 Sum Over Paths ·
 *   04 Superposition in Time · 05 Total Amplitude · 06 Interference of Amplitudes
 *
 * Transport: space = play/pause, ←/→ = seek (shift = 1s), 0/Home = reset,
 * drag/click the scrub track to seek.
 */
export default function FeynmanScenes() {
  return (
    <Stage
      width={1280}
      height={720}
      duration={FY_DUR}
      persistKey="feynman-qcd"
      background="radial-gradient(120% 100% at 50% 0%, #141c2c 0%, #0a0e16 55%, #06090f 100%)"
    >
      <GridGlow />
      <Sections />
      <Sprite start={0} end={5.4}>
        <TitleScene />
      </Sprite>
      <Sprite start={5.3} end={20.4}>
        <SinglePathScene />
      </Sprite>
      <Sprite start={20.5} end={35.4}>
        <GluonSplitScene />
      </Sprite>
      <Sprite start={35.4} end={38.4}>
        <AnnounceScene />
      </Sprite>
      <Sprite start={38.2} end={50.9}>
        <GridScene />
      </Sprite>
      <Sprite start={50.8} end={62.0}>
        <TimeSliceScene />
      </Sprite>
      <Sprite start={61.8} end={70.7}>
        <ClimaxScene />
      </Sprite>
      <Sprite start={70.5} end={FY_DUR}>
        <PhasorScene />
      </Sprite>
      <NarrationBar />
      <Vignette />
    </Stage>
  );
}
