// src/components/title/Title.tsx
import React from "react";

interface TitleProps {
  title: string;
}

const Title: React.FC<TitleProps> = ({ title }) => {
  return (
    <h1
      style={{
        fontSize: "2rem",
        fontWeight: "bold",
        marginBottom: "1rem",
        textAlign: "center",
      }}
    >
      {title}
    </h1>
  );
};

export default Title;
