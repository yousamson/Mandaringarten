import './_group.css';
import { GardenArtwork } from './_shared/GardenArtwork';

export function FullBloom() {
  return <main className="garden-preview-frame"><GardenArtwork growthDays={30} /></main>;
}
