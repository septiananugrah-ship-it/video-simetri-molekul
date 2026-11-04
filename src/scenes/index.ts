import type React from 'react';
import {CharTable} from './CharTable';
import {Chiral} from './Chiral';
import {Flowchart} from './Flowchart';
import {Gallery} from './Gallery';
import {Greenhouse} from './Greenhouse';
import {Group} from './Group';
import {Hook} from './Hook';
import {Infrared} from './Infrared';
import {Inversion} from './Inversion';
import {Mirror} from './Mirror';
import {Operation} from './Operation';
import {Outro} from './Outro';
import {Overlap} from './Overlap';
import {Polar} from './Polar';
import {Recap} from './Recap';
import {Roadmap} from './Roadmap';
import {Rotation} from './Rotation';
import {Title} from './Title';

// Pemetaan id scene di naskah → komponen visual.
export const SCENES: Record<string, React.FC> = {
  hook: Hook,
  title: Title,
  roadmap: Roadmap,
  operation: Operation,
  rotation: Rotation,
  mirror: Mirror,
  inversion: Inversion,
  chiral: Chiral,
  group: Group,
  flowchart: Flowchart,
  gallery: Gallery,
  table: CharTable,
  overlap: Overlap,
  polar: Polar,
  ir: Infrared,
  greenhouse: Greenhouse,
  recap: Recap,
  outro: Outro,
};
