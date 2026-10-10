import { useRef, useState } from "react";

export default function RegionSelector({ imageUrl, region, setRegion }) {
  const containerRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState(null);

  const getRelativePos = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return {
      x: Math.max(0, Math.min(x, rect.width)),
      y: Math.max(0, Math.min(y, rect.height)),
    };
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const pos = getRelativePos(e);
    setStart(pos);
    setDragging(true);
    setRegion({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !start) return;
    const pos = getRelativePos(e);
    const x = Math.min(start.x, pos.x);
    const y = Math.min(start.y, pos.y);
    const w = Math.abs(pos.x - start.x);
    const h = Math.abs(pos.y - start.y);
    setRegion({ x, y, w, h });
  };

  const handleMouseUp = () => {
    setDragging(false);
    setStart(null);
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-block select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <img
        src={imageUrl}
        alt="Drawing preview"
        className="block max-w-full"
        draggable={false}
      />
      {region && region.w > 2 && region.h > 2 && (
        <div
          className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/10"
          style={{
            left: region.x,
            top: region.y,
            width: region.w,
            height: region.h,
          }}
        />
      )}
    </div>
  );
}
