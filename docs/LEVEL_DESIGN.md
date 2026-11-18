# OTHERSELF — vertical episode design

The second iteration replaces the flat walking route with connected floors, service decks and overhead walkways. The engine owns horizontal and vertical position, velocity, support surfaces, ladders and solid obstacles; the renderer reads that state. A decorative beam is not a platform unless it appears in the room's collision metadata.

This is an authored traversal plan. Executed checks and remaining limitations are recorded separately in [QA.md](QA.md).

## Movement and route rules

- Nim walks with A/D or the arrow keys, jumps with Space, toggles crawling with C, and climbs ladders with W/S or up/down. Q borrows or releases a worker; E uses the current contextual interaction; F picks up or throws an object. Touch controls expose the same actions.
- Jumping uses an impulse and gravity. Horizontal movement alone does not bridge a gap. Coyote time and a short jump buffer forgive input timing without replacing the jump input.
- Crawling changes both speed and collision height. A low ceiling blocks standing; releasing or toggling the stance must not push Nim through it. Workers cannot use Nim's low openings.
- A ladder connects explicitly authored elevations. Vertical input moves along it; its top and bottom must provide support or a deliberate landing. An unused ladder is not an automatic elevator.
- Doors, readers, consoles, rescues and exits are height-aware. Standing directly below a reader or the shuttle does not activate it. Workers remain within their room.
- Possession leaves Nim's actual body in the world and gravity keeps acting on it. A body abandoned in the air or on a ladder falls rather than gaining invisible support. Cover and sight use the same elevations as traversal. A recess below a walkway does not hide somebody standing on that walkway.

All distances below are engine world units. Ground is `y=0`, the middle deck is `y=2.3`, and the upper deck is `y=4.8`. Coordinate ranges describe the walkable surface, not the player's centre with its collision radius.

## Four connected rooms

| Room | Main route | Alternative or optional route | Exit |
| --- | --- | --- | --- |
| Observation vestibule | Crawl under the entry duct, climb ladder x7, borrow the keeper to use the reader at x19/y2.3, descend beyond the middle deck and climb x29. Jump the final upper gap. | Ladder x16 reaches the observatory and its second throwable object. Ladder x18.5 connects the lower floor to the middle deck as another recovery and return path. | Middle deck y2.3, after gap x31–32.7. |
| Wet sorting | Crawl, climb x8, use the keeper's reader x12/y2.3, jump the broken middle deck at x16–17.6, pass the opened door. | Climb x14 and borrow the technician to operate x18/y4.8. The deployed upper bridge crosses above the closed passenger door. Descend x28 to rescue the creature at x29.5/y0. | Middle deck y2.3, after gap x30.8–32.5. |
| Glass garden | Crawl below the glazing at x8, jump the ground pit x9–11, climb x12, and use the keeper's reader x17/y2.3. Descend beyond the middle deck and climb x29 on the far side. | The canopy at y4.8 contains the technician's cart control. The cart supplies a second way to open the route. Rescue the creature at x28/y2.3. | Middle deck y2.3, after gap x30.5–32. |
| Roadstead dock | Crawl, climb x7, use the keeper reader x12.5/y2.3, jump the middle gap x14–16, cross the open door, and climb x26 to the shuttle deck. | Climb x13 and use the technician's control x18/y4.8 to bridge above the closed door. | Jump x30–31.5 at y4.8 and operate the bell at x34/y4.8. |

### Why the routes use the new controls

Every entry has a real low obstruction. Each room's destination sits above ground, so walking underneath the decks cannot finish that room. The last gap in every room requires a jump at the correct elevation. The garden also makes the low opening beneath glass useful: a target can be visible on the other side while the possession ray and standing body remain blocked.

The sorting and dock alternatives change which elevation crosses the door. A technician deploys an upper span; a keeper opens the middle passage. The span must be crossed physically after its mechanism finishes. Selecting the mechanism does not teleport Nim or change his height.

## Distraction and guard response

Loose bolts and cans are placed near the entry and on reachable side routes. A held object travels with Nim until thrown. Its ballistic flight and impact location determine the sound; the noise must not originate at Nim after the object lands elsewhere.

An audible impact produces a readable sequence: listen, turn or approach the sound, inspect, then return to patrol. Guards still prioritize an exposed body they can see. A throw should create an opportunity to move or borrow a body, not grant temporary invisibility.

Sound targets can lie on another deck or beyond a closed door. Investigation must have a finite search timeout so a guard does not spend the rest of the episode walking into an inaccessible point. A poor throw must remain recoverable; no compulsory door requires a unique consumable object.

## Return paths and failure recovery

Before ringing the final bell, Nim can return through visited rooms for either missed rescue. Opened doors and deployed mechanisms persist. Sorting and dock upper spans must work in both directions with their passenger doors closed. The exit gaps can be jumped in reverse; ladders can be descended as well as climbed.

The garden's glazing remains a physical obstacle on the middle deck. Its return route descends at x12, jumps the ground pit toward the entry, then crawls beneath the glass. In the vestibule, Nim can jump the ground pit from right to left or climb x18.5, cross the middle deck and descend x7.

Falling into a pit produces a specific recoverable failure and returns to the last checkpoint. Missing an upper landing onto an existing lower floor is a fall, not an automatic loss or an invisible wall. A released host must not strand Nim on a nonexistent surface.

Save validation distinguishes durable progress from transient physics. New saves preserve position, velocity, stance, ladder attachment, carried/projectile object state, investigation and mechanisms. Migration from the flat episode preserves rescues, opened doors and completed route flags, while moving incompatible bodies to the current room's safe entry instead of guessing a platform. Old in-progress mechanisms and worker positions are reset; an unfinished mechanism can be operated again.

## Readability and acceptance

Walkable edges, ladder endpoints and landing zones need to stand apart from background architecture. Nim's feet and silhouette must remain visible at each elevation. The camera should reveal the next landing and enough ladder above or below the player to plan a move. An apparent opening must agree with the actual collision bounds.

Acceptance requires an input-driven playthrough of all four rooms, both role routes where available, reverse traversal before the final bell, and a reload during meaningful transient states. Isolated save fixtures can validate endings and failure presentation; they do not count as complete playthroughs. Previous flat-route results do not establish this version's readiness.
