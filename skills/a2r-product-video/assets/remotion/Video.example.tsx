// A2R product-video — composition assembler (EXAMPLE, adapt per module).
// Renders the ordered SCENES from timeline, each wrapped in FadeScene.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { C } from "./brand";
import { FadeScene } from "./helpers";
import { Intro } from "./scenes/Intro";
import { Outro } from "./scenes/Outro";
import { SceneVideo } from "./scenes/SceneVideo";
import { Interstitial } from "./scenes/Interstitial";
import { DocScroll } from "./scenes/DocScroll";
import { data, SCENES, STARTS, docScrollFrames } from "./timeline";

export const A2RVideo: React.FC = () => {
  const clipByKey: Record<string, any> = {};
  data.clips.forEach((c: any) => (clipByKey[`clip:${c.key}`] = c));

  return (
    <AbsoluteFill style={{ backgroundColor: C.silver }}>
      {SCENES.map((s) => {
        const from = STARTS[s.key], dur = s.dur;
        let node: React.ReactNode = null;

        if (s.key === "intro") node = <Intro title={data.module.title} subtitle={data.module.subtitle} />;
        else if (s.key === "outro") node = <Outro tagline={data.module.tagline} />;
        else if (s.key.startsWith("clip:")) node = <SceneVideo clip={clipByKey[s.key]} dur={dur} />;
        else if (s.key === "interstitial")
          node = <Interstitial dur={dur} title="Procesando…" statusChain="En cola → Generando → Listo" seconds={data.processingSeconds ?? undefined} />;
        else if (s.key === "docOrig")
          node = <DocScroll dur={dur} folder="doc-orig" pages={data.docOrig!.pages} title="Documento original" chipLabel="Original" chipColor={C.silver800} rightNote="antes de procesar" introNote="Este es el documento de ejemplo" />;
        else if (s.key === "docResult")
          node = <DocScroll dur={dur} folder="doc" pages={data.doc!.pages} title="Documento resultado" chipLabel="Resultado" chipColor={C.coreBlue} rightNote="formato preservado" />;

        return (
          <Sequence key={s.key} from={from} durationInFrames={dur}>
            <FadeScene dur={dur}>{node}</FadeScene>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
