"use client";

import { useEffect, useState } from "react";

// Definimos o tipo aqui para o TypeScript não reclamar
type Snowflake = {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  size: number;
  opacity: number;
};

export default function Snow() {
  const [flakes, setFlakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    // Gera 50 flocos de neve com posições, tamanhos e tempos aleatórios
    const newFlakes = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100, // Posição horizontal (0 a 100%)
      animationDuration: 5 + Math.random() * 10, // Queda lenta (5 a 15 segundos)
      animationDelay: Math.random() * 5, // Atraso inicial (0 a 5 segundos)
      size: 2 + Math.random() * 4, // Tamanho entre 2px e 6px
      opacity: 0.3 + Math.random() * 0.7, // Opacidade entre 0.3 e 1
    }));

    setFlakes(newFlakes);
  }, []);

  return (
    <div className="snow-container" aria-hidden="true">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
}