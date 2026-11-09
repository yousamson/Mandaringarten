import './_group.css';
import { GardenArtwork } from './_shared/GardenArtwork';

export function Growing() {
  return <main className="garden-preview-frame"><GardenArtwork growthDays={20} /></main>;
}
