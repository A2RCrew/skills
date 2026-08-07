// A2R product-video — Remotion config. No audio track is added by the scenes,
// but Remotion still muxes a silent AAC stream; strip it after render (see SKILL.md).
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
