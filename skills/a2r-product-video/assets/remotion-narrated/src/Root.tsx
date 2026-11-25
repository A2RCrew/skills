import React from "react";
import { Composition } from "remotion";
import { Walkthrough, TOTAL } from "./Video";
import { FPS, W, H } from "./brand";

export const RemotionRoot: React.FC = () => <Composition id="Walkthrough" component={Walkthrough} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />;
