import type { DeltaInserts } from './types.js';

export function deltaInsersToChunks(delta: DeltaInserts): DeltaInserts[] {
  if (delta.length === 0) {
    return [[]];
  }

  function* chunksGenerator(arr: DeltaInserts) {
    let start = 0;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].attributes.type === 'line-break') {
        const chunk = arr.slice(start, i);
        start = i + 1;
        yield chunk;
      } else if (i === arr.length - 1) {
        yield arr.slice(start);
      }
    }

    if (arr[arr.length - 1].attributes.type === 'line-break') {
      yield [];
    }
  }

  return [...chunksGenerator(delta)];
}
