"use client";
import {
  useBroadcastEvent,
  useEventListener,
  useMyPresence,
} from "@/liveblocks.config";
import LiveCursors from "../cursor/LiveCursors";
import { useCallback, useEffect, useState } from "react";
import CursorChat from "../cursor/CursorChat";
import { CursorMode, CursorState, Reaction } from "@/types/type";
import ReactionSelector from "../reaction/ReactionButton";
import FlyingReaction from "../reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import { Comments } from "../comments/Comments";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/shadcn/context-menu";
import { shortcuts } from "@/constants";

type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  undo: () => void;
  redo: () => void;
};

export default function Live({ canvasRef, undo, redo }: Props) {
  const [reaction, setReaction] = useState<Reaction[]>([]);
  const [cursorState, setCursorState] = useState<CursorState>({
    mode: CursorMode.Hidden,
  });
  const [{ cursor }, updateMyPresence] = useMyPresence();

  const broadcast = useBroadcastEvent();

  useEventListener((e) => {
    const event = e.event;
    setReaction((prevState) =>
      prevState.concat([
        {
          point: { x: event.x, y: event.y },
          value: event.value,
          timestamp: Date.now(),
        },
      ])
    );
  });

  useInterval(() => {
    setReaction((reaction) =>
      reaction.filter((r) => r.timestamp > Date.now() - 5000)
    );
  }, 1000);

  useInterval(() => {
    if (
      cursorState.mode === CursorMode.Reaction &&
      cursorState.isPressed &&
      cursor
    ) {
      setReaction((prevState) =>
        prevState.concat([
          {
            point: { x: cursor.x, y: cursor.y },
            value: cursorState.reaction,
            timestamp: Date.now(),
          },
        ])
      );
      broadcast({ x: cursor.x, y: cursor.y, value: cursorState.reaction });
    }
  }, 100);
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
        const x = e.clientX - e.currentTarget.getBoundingClientRect().x;
        const y = e.clientY - e.currentTarget.getBoundingClientRect().y;

        updateMyPresence({ cursor: { x, y } });
      }
    },
    [updateMyPresence, cursor, cursorState.mode]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      setCursorState({ mode: CursorMode.Hidden });
      updateMyPresence({ cursor: null, message: null });
    },
    [updateMyPresence]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const x = e.clientX - e.currentTarget.getBoundingClientRect().x;
      const y = e.clientY - e.currentTarget.getBoundingClientRect().y;

      updateMyPresence({ cursor: { x, y } });
      setCursorState((prevState: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...prevState, isPressed: true }
          : prevState
      );
    },
    [updateMyPresence, cursorState.mode]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setCursorState((prevState: CursorState) =>
        cursorState.mode === CursorMode.Reaction
          ? { ...prevState, isPressed: true }
          : prevState
      );
    },
    [cursorState.mode]
  );

  const setReactions = useCallback(
    (reaction: string) =>
      setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false }),
    []
  );

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "/") {
        setCursorState({
          mode: CursorMode.Chat,
          previousMessage: null,
          message: "",
        });
      } else if (e.key === "Escape") {
        updateMyPresence({ message: "" });
        setCursorState({ mode: CursorMode.Hidden });
      } else if (e.key === "e") {
        setCursorState({ mode: CursorMode.ReactionSelector });
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
      }
    };
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [updateMyPresence]);

  const handleContextMenuClick = useCallback(
    (key: string) => {
      switch (key) {
        case "Chat":
          setCursorState({
            mode: CursorMode.Chat,
            previousMessage: null,
            message: "",
          });
          break;
        case "Undo":
          undo();
          break;
        case "Redo":
          redo();
          break;
        case "Reactions":
          setCursorState({ mode: CursorMode.ReactionSelector });
          break;
        default:
          break;
      }
    },
    [redo, undo]
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger
        id="canvas"
        className="relative h-full flex flex-1 w-full  justify-center items-center"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <canvas ref={canvasRef} />
        {reaction.map((r) => (
          <FlyingReaction
            key={r.timestamp.toString()}
            x={r.point.x}
            y={r.point.y}
            timestamp={r.timestamp}
            value={r.value}
          />
        ))}
        {cursor && (
          <CursorChat
            cursor={cursor}
            cursorState={cursorState}
            setCursorState={setCursorState}
            updateMyPresence={updateMyPresence}
          />
        )}
        {cursorState.mode === CursorMode.ReactionSelector && (
          <ReactionSelector setReaction={setReactions} />
        )}
        <LiveCursors />
        <Comments />
      </ContextMenuTrigger>
      <ContextMenuContent className="right-menu-content">
        {shortcuts.map((item) => (
          <ContextMenuItem
            key={item.key}
            onClick={() => handleContextMenuClick(item.name)}
            className="right-menu-item"
          >
            <p>{item.name}</p>
            <p className="text-xs text-primary-grey-300">{item.shortcut}</p>
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
