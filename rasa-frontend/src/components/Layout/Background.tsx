import type { RefObject } from "react";

interface BackgroundProps {
  parARef: RefObject<HTMLDivElement | null>;
  parBRef: RefObject<HTMLDivElement | null>;
  spotRef: RefObject<HTMLDivElement | null>;
}


export function Background({ parARef, parBRef, spotRef }: BackgroundProps) {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      {/* layered base: faint indigo up top, settling softer toward the bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #eef0fb 0%, #f4f5fc 34%, #f7f7fb 66%, #f5f4fa 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -8%, rgba(199, 205, 245, 0.55) 0%, rgba(214, 218, 248, 0.22) 32%, rgba(238, 240, 253, 0) 58%), radial-gradient(90% 70% at 50% 118%, rgba(224, 223, 248, 0.55) 0%, rgba(224, 223, 248, 0) 55%)",
        }}
      />

      {/* parallax layer A */}
      <div ref={parARef} className="absolute inset-0 will-change-transform">
        <div
          className="absolute rounded-full animate-[drift1_26s_ease-in-out_infinite]"
          style={{
            top: "-180px",
            left: "-120px",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(181, 168, 245, 0.62), rgba(181, 168, 245, 0) 66%)",
            filter: "blur(64px)",
          }}
        />
        <div
          className="absolute rounded-full animate-[drift1_38s_ease-in-out_infinite]"
          style={{
            top: "28%",
            left: "54%",
            width: "460px",
            height: "460px",
            background:
              "radial-gradient(circle, rgba(199, 190, 250, 0.55), rgba(199, 190, 250, 0) 62%)",
            filter: "blur(56px)",
          }}
        />
      </div>

      {/* parallax layer B */}
      <div ref={parBRef} className="absolute inset-0 will-change-transform">
        <div
          className="absolute rounded-full animate-[drift2_32s_ease-in-out_infinite]"
          style={{
            bottom: "-200px",
            right: "-140px",
            width: "680px",
            height: "680px",
            background:
              "radial-gradient(circle, rgba(190, 172, 248, 0.6), rgba(190, 172, 248, 0) 66%)",
            filter: "blur(74px)",
          }}
        />
        <div
          className="absolute rounded-full animate-[drift2_46s_ease-in-out_infinite]"
          style={{
            top: "6%",
            right: "12%",
            width: "340px",
            height: "340px",
            background:
              "radial-gradient(circle, rgba(176, 164, 246, 0.42), rgba(176, 164, 246, 0) 60%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* gentle central halo behind the orb for depth */}
      <div
        className="absolute rounded-full"
        style={{
          top: "34%",
          left: "50%",
          width: "min(70vw, 720px)",
          aspectRatio: "1",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(165, 180, 252, 0.16) 0%, rgba(199, 210, 254, 0.06) 40%, rgba(199, 210, 254, 0) 68%)",
        }}
      />

      {/* cursor spotlight */}
      <div
        ref={spotRef}
        className="absolute top-0 left-0 rounded-full will-change-transform"
        style={{
          width: "620px",
          height: "620px",
          background:
            "radial-gradient(circle, rgba(165, 180, 252, 0.16), rgba(165, 180, 252, 0) 60%)",
          transform: "translate3d(-1000px, -1000px, 0)",
        }}
      />

      {/* soft vignette for gentle depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(0, 0, 0, 0) 52%, rgba(49, 46, 84, 0.06) 100%)",
        }}
      />
    </div>
  );
}
