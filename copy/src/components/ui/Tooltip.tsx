import React, { useState } from 'react';

const Tooltip: React.FC<{ content: React.ReactNode; children: React.ReactNode }> = ({ content, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block" onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)}>
      {children}
      {open && (
        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 text-xs bg-black text-white rounded shadow">
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip; 
