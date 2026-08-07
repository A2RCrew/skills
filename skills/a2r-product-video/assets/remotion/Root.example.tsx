// A2R product-video — Remotion Root (EXAMPLE). Registered via src/index.ts:
//   import { registerRoot } from "remotion"; import { RemotionRoot } from "./Root";
//   registerRoot(RemotionRoot);
import "./index.css";
import { Composition } from "remotion";
import { A2RVideo } from "./Video";
import { data, TOTAL } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="A2RVideo"
    component={A2RVideo}
    durationInFrames={TOTAL}
    fps={data.fps}
    width={data.width}
    height={data.height}
  />
);
