import './_group.css';
import { GardenArtwork } from './_shared/GardenArtwork';

export function Seed() {
  return <main className="garden-preview-frame"><GardenArtwork growthDays={0} /></main>;
}
