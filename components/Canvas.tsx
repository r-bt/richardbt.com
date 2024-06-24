"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Canvas(props: {
  width?: string;
  height?: string;
  backgroundColor?: string;
  draw: () => void;
  establishContext: (context: CanvasRenderingContext2D) => void;
  establishSize: (width: number, height: number) => void;
}) {
  const {
    width = "100%",
    height = "100%",
    backgroundColor = "#ffffff",
    draw,
    establishContext,
    establishSize,
  } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  const resizeCanvas = useCallback(
    (context: CanvasRenderingContext2D) => {
      const canvas = context.canvas;
      const { width, height } = canvas.getBoundingClientRect();

      if (canvas.width !== width || canvas.height !== height) {
        const { devicePixelRatio: ratio = 1 } = window;

        canvas.width = Math.max(width, 764) * ratio;
        canvas.height = Math.max(width, 764) * ratio;

        if (establishSize) {
          establishSize(canvas.width, canvas.height);
        }

        context.scale(ratio, ratio);

        return true;
      }

      return false;
    },
    [establishSize]
  );

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        setContext(ctx);
        resizeCanvas(ctx);

        if (establishContext) {
          establishContext(ctx);
        }
      }
    }
  }, [establishContext, resizeCanvas]);

  useEffect(() => {
    let animationFrameId: number;

    if (context) {
      const render = () => {
        draw();
        animationFrameId = window.requestAnimationFrame(render);
      };
      render();
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [draw, context, resizeCanvas]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        backgroundColor,
        aspectRatio: "1 / 1",
      }}
    ></canvas>
  );
}
