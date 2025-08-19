import React, { useRef, useState, useEffect } from "react";

const EllipsisCell = ({ value, maxWidth = "200px" }) => {
  const spanRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = spanRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [value]);

  return (
    <span
      ref={spanRef}
      style={{
        display: "block",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth,
      }}
      title={isTruncated ? value : undefined} // seulement si tronqué
    >
      {value}
    </span>
  );
};

export default EllipsisCell;
