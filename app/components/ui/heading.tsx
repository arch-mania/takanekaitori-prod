import React from 'react';

type HeadingLevel = 1 | 2 | 3 | 4;

interface HeadingStyles {
  h1: string;
  h2: string;
  h3: string;
  h4: string;
}

const headingStyles: HeadingStyles = {
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl',
  h2: "scroll-m-20 text-xl font-medium relative pl-5 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-8 before:w-3 before:bg-[#B3E5FC] md:text-[24px] md:h-9 md:before:h-9 md:before:w-4 md:pl-7 content-center",
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
};

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  children: React.ReactNode;
  className?: string;
}

const Heading: React.FC<HeadingProps> = ({ level = 1, children, className = '', ...props }) => {
  const Tag: React.ElementType = `h${level}`;
  const combinedClassName =
    `${headingStyles[`h${level}` as keyof HeadingStyles]} ${className}`.trim();

  return (
    <Tag className={combinedClassName} {...props}>
      {children}
    </Tag>
  );
};

export const H1: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={1} {...props} />
);
export const H2: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={2} {...props} />
);
export const H3: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={3} {...props} />
);
export const H4: React.FC<Omit<HeadingProps, 'level'>> = (props) => (
  <Heading level={4} {...props} />
);

export default Heading;
