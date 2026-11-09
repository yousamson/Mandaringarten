import './_group.css';
import { GardenArtwork } from './_shared/GardenArtwork';

export function FirstBloom() {
  return <main className="garden-preview-frame"><GardenArtwork growthDays={10} /></main>;
}
