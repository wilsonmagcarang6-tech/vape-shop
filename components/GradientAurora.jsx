"use client"

export default function GradientAurora({ colorStops = ["#7cff67", "#B497CF", "#5227FF"], blend = 0.5 }) {
  return (
    <div 
      className="aurora-container" 
      style={{
        background: `radial-gradient(ellipse at top, ${colorStops[0]} 0%, ${colorStops[1]} 50%, ${colorStops[2]} 100%)`,
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }}
    />
  );
}

