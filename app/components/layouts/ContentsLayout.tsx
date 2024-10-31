import React from "react";

const ContentsLayout: React.FC<{
  children: React.ReactNode;
  className: string;
}> = ({ children, className }) => {
  return <main className={`px-3 ${className}`}>{children}</main>;
};

export default ContentsLayout;
