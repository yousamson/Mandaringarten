type Props = { growthDays: number };

const stages = [
  { days: 0, image: 'garden-seed-wide.jpg', caption: 'A seed, ready for you' },
  { days: 10, image: 'garden-first-bloom-wide.jpg', caption: 'The first flowers are here' },
  { days: 20, image: 'garden-growing-wide.jpg', caption: 'The first flowers are here' },
  { days: 30, image: 'garden-full-bloom-wide.jpg', caption: 'A garden in full bloom' },
];

export function GardenArtwork({ growthDays }: Props) {
  const days = Math.max(0, Math.min(30, Math.floor(growthDays)));
  const stage = days >= 30 ? stages[3] : days >= 20 ? stages[2] : days >= 10 ? stages[1] : stages[0];

  return (
    <div className="garden-artwork" data-growth-days={days} role="img" aria-label={`${days} days of garden growth`}>
      <img
        className="garden-art-image"
        src={`/__mockup/images/${stage.image}`}
        alt=""
        draggable="false"
      />
      <div className="garden-art-caption">
        <span>{stage.caption}</span>
        <span>{days} / 30</span>
      </div>
    </div>
  );
}
