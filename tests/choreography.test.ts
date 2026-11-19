import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {choreography, filmPosition, sampleTrack} from '../src/lib/choreography.ts';

test('every spatial trajectory reverses exactly without a retained animation state', () => {
  for (const track of Object.values(choreography)) for (const mode of ['desktop','mobile'] as const) {
    const forward = Array.from({length:101},(_,i)=>sampleTrack(track[mode],i/100));
    const reverse = Array.from({length:101},(_,i)=>sampleTrack(track[mode],(100-i)/100));
    assert.deepEqual(forward,reverse.reverse());
  }
});

test('crew credits follow the first sighting and the question stays inside the measured blackout', () => {
  for (const mode of ['desktop','mobile'] as const) {
    assert.equal(sampleTrack(choreography.crew[mode],0).opacity,0);
    assert.equal(sampleTrack(choreography.crew[mode],.14).opacity,1);
    for (let i = 0; i <= 1000; i++) {
      const p = i / 1000, seconds = filmPosition(p) * 30.0833;
      if (sampleTrack(choreography.question[mode],p).opacity > 0) {
        assert.ok(seconds >= 25.633 && seconds < 26.55);
      }
    }
    assert.equal(sampleTrack(choreography.question[mode],.76).opacity,1);
  }
});

test('the closing title stays visible on the held Earth frame', () => {
  assert.equal(filmPosition(.89),1);
  assert.equal(filmPosition(.95),1);
  assert.equal(filmPosition(1),1);
  for (const mode of ['desktop','mobile'] as const) {
    assert.equal(sampleTrack(choreography.ending[mode],.89).opacity,1);
    assert.equal(sampleTrack(choreography.ending[mode],1).opacity,1);
    assert.equal(sampleTrack(choreography.ending[mode],1).y,sampleTrack(choreography.ending[mode],.89).y);
  }
  let previous = 0;
  for(let i=0;i<=1000;i++) {const film=filmPosition(i/1000);assert.ok(film>=previous&&film<=1);previous=film;}
});
