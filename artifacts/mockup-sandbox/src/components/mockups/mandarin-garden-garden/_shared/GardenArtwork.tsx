type Props = { growthDays: number };

export function GardenArtwork({ growthDays }: Props) {
  const days = Math.max(0, Math.min(30, Math.floor(growthDays)));
  const plantCount = days >= 24 ? 5 : days >= 15 ? 3 : days >= 6 ? 2 : days > 0 ? 1 : 0;
  const flowerCount = days >= 30 ? 5 : days >= 22 ? 4 : days >= 15 ? 3 : days >= 10 ? 1 : 0;
  const plants = [
    { x: 120, height: 93, tilt: -12 },
    { x: 205, height: 124, tilt: -4 },
    { x: 286, height: 112, tilt: 7 },
    { x: 365, height: 138, tilt: 3 },
    { x: 430, height: 88, tilt: 12 },
  ].slice(0, plantCount);
  const caption = days === 0
    ? 'A seed, ready for you'
    : days >= 30
      ? 'A garden in full bloom'
      : days >= 10
        ? 'The first flowers are here'
        : 'A little more each day';

  return (
    <div className="garden-artwork" data-growth-days={days} role="img" aria-label={`${days} days of garden growth`}>
      <svg viewBox="0 0 520 260" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="gardenSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f5edda" /><stop offset="1" stopColor="#e8efdd" /></linearGradient>
          <linearGradient id="gardenGround" x1="0" x2="1"><stop offset="0" stopColor="#8ca579" /><stop offset=".5" stopColor="#718f67" /><stop offset="1" stopColor="#a2b18a" /></linearGradient>
          <linearGradient id="gardenPetal" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f1b08f" /><stop offset="1" stopColor="#d57e68" /></linearGradient>
        </defs>
        <path d="M48 226c25-81 63-122 118-137 48-13 92 1 126-13 45-19 106-2 148 29 30 23 40 70 34 121H48Z" fill="url(#gardenSky)" />
        <circle cx="390" cy="74" r="29" fill="#e8c980" opacity=".74" />
        <path d="M0 197c76-27 133-22 203 2 84 29 154 24 317-16v77H0Z" fill="#dce6cc" />
        <path d="M0 222c84-35 143-16 220 2 96 23 180 10 300-19v55H0Z" fill="url(#gardenGround)" />
        <path d="M18 240c79-23 123-5 191 6m76-15c65 20 129 16 216-8" fill="none" stroke="#bfd0a7" strokeWidth="2" opacity=".8" />
        {plants.map((plant, index) => {
          const height = Math.max(14, plant.height * Math.min(1, days / (index === 0 ? 8 : index === 1 ? 12 : 18)));
          const stemTop = 225 - height;
          const showFlower = index < flowerCount;
          return (
            <g key={plant.x} transform={`rotate(${plant.tilt} ${plant.x} 226)`}>
              <path d={`M${plant.x} 228 Q${plant.x - 2} ${stemTop + height * .42} ${plant.x} ${stemTop}`} fill="none" stroke="#557957" strokeWidth="4" strokeLinecap="round" />
              {height > 25 ? <path d={`M${plant.x - 2} ${stemTop + height * .56} Q${plant.x - 36} ${stemTop + height * .42} ${plant.x - 42} ${stemTop + height * .57} Q${plant.x - 22} ${stemTop + height * .77} ${plant.x - 2} ${stemTop + height * .65}`} fill="#93ae7b" stroke="#6e9165" strokeWidth="1" /> : null}
              {height > 42 ? <path d={`M${plant.x + 2} ${stemTop + height * .77} Q${plant.x + 32} ${stemTop + height * .63} ${plant.x + 39} ${stemTop + height * .77} Q${plant.x + 19} ${stemTop + height * .94} ${plant.x + 2} ${stemTop + height * .85}`} fill="#a6b989" stroke="#75966a" strokeWidth="1" /> : null}
              {showFlower ? <g transform={`translate(${plant.x} ${stemTop - 4})`}>
                <ellipse rx="6" ry="13" cy="-12" fill="url(#gardenPetal)" />
                <ellipse rx="6" ry="13" cy="12" fill="url(#gardenPetal)" />
                <ellipse rx="6" ry="13" cx="-12" fill="url(#gardenPetal)" transform="rotate(90 -12 0)" />
                <ellipse rx="6" ry="13" cx="12" fill="url(#gardenPetal)" transform="rotate(90 12 0)" />
                <ellipse rx="5" ry="11" cx="-9" cy="-9" fill="#e99a7d" transform="rotate(-45 -9 -9)" />
                <ellipse rx="5" ry="11" cx="9" cy="-9" fill="#e99a7d" transform="rotate(45 9 -9)" />
                <circle r="6" fill="#e8c76e" />
              </g> : null}
            </g>
          );
        })}
        {days === 0 ? <g className="garden-seed" transform="translate(260 216)">
          <ellipse cx="0" cy="13" rx="15" ry="7" fill="#c8a875" />
          <path d="M0 9c-2-14 4-22 12-25M1 2c-8-8-15-7-18-1 8 7 13 7 18 1Z" fill="#88a06b" stroke="#67865d" strokeWidth="2" strokeLinecap="round" />
        </g> : null}
        <path d="M95 224c-7-12-13-11-16-8 3 10 9 14 16 14m330-5c4-13 10-14 15-11-2 10-8 15-15 17" fill="#6f9265" opacity=".9" />
      </svg>
      <div className="garden-art-caption"><span>{caption}</span><span>{days} / 30</span></div>
    </div>
  );
}
