/** A direct document navigation reads the destination hash after it is committed.
 * The caller flushes the learner store before leaving the current exercise. */
export function wechsleLernziel(href:string):void { window.location.assign(href); }
